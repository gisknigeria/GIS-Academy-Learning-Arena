import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { EnrollStudentDto } from "./dto/enroll-student.dto";
import { MarkAttendanceDto } from "./dto/mark-attendance.dto";
import { UpdateClassDto } from "./dto/update-class.dto";

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto) {
    await this.ensureCourse(dto.courseId);

    return this.prisma.class.create({
      data: {
        courseId: dto.courseId,
        name: dto.name,
        mode: dto.mode,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: this.defaultInclude(),
    });
  }

  async findAll() {
    return this.prisma.class.findMany({
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      include: this.defaultInclude(),
    });
  }

  async findOne(id: string) {
    const cohort = await this.prisma.class.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });

    if (!cohort) {
      throw new NotFoundException(`Class "${id}" not found.`);
    }

    return cohort;
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id);
    if (dto.courseId) await this.ensureCourse(dto.courseId);

    return this.prisma.class.update({
      where: { id },
      data: {
        courseId: dto.courseId,
        name: dto.name,
        mode: dto.mode,
        ...(dto.startsAt !== undefined
          ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }
          : {}),
        ...(dto.endsAt !== undefined
          ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }
          : {}),
      },
      include: this.defaultInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.class.delete({ where: { id } });
    return { deleted: true };
  }

  async enroll(classId: string, dto: EnrollStudentDto) {
    const cohort = await this.findOne(classId);
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });

    if (!user) {
      throw new NotFoundException(`User "${dto.userId}" not found.`);
    }

    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: dto.userId, courseId: cohort.courseId } },
      update: { classId },
      create: { userId: dto.userId, courseId: cohort.courseId, classId },
      include: {
        user: { select: { id: true, fullName: true, email: true, paymentStatus: true } },
        course: { select: { id: true, code: true, title: true } },
      },
    });
  }

  async listStudents(classId: string) {
    await this.findOne(classId);

    return this.prisma.enrollment.findMany({
      where: { classId },
      orderBy: { enrolledAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, paymentStatus: true } },
        course: { select: { id: true, code: true, title: true } },
      },
    });
  }

  async markAttendance(classId: string, dto: MarkAttendanceDto) {
    await this.findOne(classId);
    const date = this.normalizeAttendanceDate(dto.date);

    const students = await this.prisma.enrollment.findMany({
      where: { classId },
      select: { userId: true },
    });
    const studentIds = new Set(students.map((student) => student.userId));

    for (const record of dto.records) {
      if (!studentIds.has(record.userId)) {
        throw new BadRequestException(`User "${record.userId}" is not enrolled in this class.`);
      }
    }

    await this.prisma.$transaction(
      dto.records.map((record) =>
        this.prisma.attendanceRecord.upsert({
          where: {
            classId_userId_date: {
              classId,
              userId: record.userId,
              date,
            },
          },
          update: { status: record.status, note: record.note },
          create: {
            classId,
            userId: record.userId,
            date,
            status: record.status,
            note: record.note,
          },
        }),
      ),
    );

    return this.listAttendance(classId, dto.date);
  }

  async listAttendance(classId: string, dateInput?: string) {
    await this.findOne(classId);

    const where: Prisma.AttendanceRecordWhereInput = { classId };
    if (dateInput) {
      where.date = this.normalizeAttendanceDate(dateInput);
    }

    return this.prisma.attendanceRecord.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  private async ensureCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course "${courseId}" not found.`);
    return course;
  }

  private normalizeAttendanceDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Attendance date is invalid.");
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  private defaultInclude() {
    return {
      course: { select: { id: true, code: true, title: true, deliveryMode: true } },
      _count: { select: { students: true, attendanceRecords: true } },
    } as const;
  }
}

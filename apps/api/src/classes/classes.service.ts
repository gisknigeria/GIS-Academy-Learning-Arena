import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { EnrollStudentDto } from "./dto/enroll-student.dto";
import { MarkAttendanceDto } from "./dto/mark-attendance.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { BulkEnrollDto } from "./dto/bulk-enroll.dto";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { CreateClassMessageDto } from "./dto/create-class-message.dto";
import { CreateLiveSessionDto } from "./dto/create-live-session.dto";
import { SetLessonUnlocksDto } from "./dto/set-lesson-unlocks.dto";
import { UpdateLiveSessionDto } from "./dto/update-live-session.dto";

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClassDto) {
    await this.ensureCourse(dto.courseId);
    if (dto.trainerId) await this.ensureTrainer(dto.trainerId);

    return this.prisma.class.create({
      data: {
        courseId: dto.courseId,
        trainerId: dto.trainerId,
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
    if (dto.trainerId) await this.ensureTrainer(dto.trainerId);

    return this.prisma.class.update({
      where: { id },
      data: {
        courseId: dto.courseId,
        trainerId: dto.trainerId,
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

  async getSchedule(classId: string) {
    const cohort = await this.findOne(classId);
    return {
      id: cohort.id,
      name: cohort.name,
      course: cohort.course,
      trainer: cohort.trainer,
      startsAt: cohort.startsAt,
      endsAt: cohort.endsAt,
    };
  }

  async attendanceAnalytics(classId: string, from?: string, to?: string) {
    await this.findOne(classId);

    const where: any = { classId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = this.normalizeAttendanceDate(from);
      if (to) where.date.lte = this.normalizeAttendanceDate(to);
    }

    const groups = await this.prisma.attendanceRecord.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    });

    const total = groups.reduce((s, g) => s + g._count.status, 0);
    const breakdown = groups.map((g) => ({ status: g.status, count: g._count.status }));

    return { totalRecords: total, breakdown };
  }

  async bulkEnroll(classId: string, dto: BulkEnrollDto) {
    const cohort = await this.findOne(classId);
    const courseId = cohort.courseId;

    const ops = dto.userIds.map((userId) =>
      this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { classId },
        create: { userId, courseId, classId },
      }),
    );

    const results = await this.prisma.$transaction(ops);
    return { enrolled: results.length };
  }

  async listLessonUnlocks(classId: string) {
    await this.findOne(classId);

    return this.prisma.classLessonUnlock.findMany({
      where: { classId },
      orderBy: { unlockedAt: "asc" },
      include: {
        lesson: { select: { id: true, title: true, order: true, courseId: true } },
      },
    });
  }

  async setLessonUnlocks(classId: string, dto: SetLessonUnlocksDto) {
    const cohort = await this.findOne(classId);
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: dto.lessonIds } },
      select: { id: true, courseId: true },
    });

    const validLessonIds = lessons
      .filter((lesson) => lesson.courseId === cohort.courseId)
      .map((lesson) => lesson.id);

    await this.prisma.$transaction([
      this.prisma.classLessonUnlock.deleteMany({
        where: { classId, lessonId: { notIn: validLessonIds } },
      }),
      ...validLessonIds.map((lessonId) =>
        this.prisma.classLessonUnlock.upsert({
          where: { classId_lessonId: { classId, lessonId } },
          update: {},
          create: { classId, lessonId },
        }),
      ),
    ]);

    return this.listLessonUnlocks(classId);
  }

  async exportAttendanceCsv(classId: string, dateInput?: string) {
    const records = await this.listAttendance(classId, dateInput);

    // Build CSV header
    const header = ["userId", "fullName", "email", "date", "status", "note"].join(",");
    const lines = records.map((r) =>
      [r.user.id, r.user.fullName.replace(/\"/g, '""'), r.user.email ?? "", r.date.toISOString().split("T")[0], r.status, (r.note ?? "").replace(/\"/g, '""')]
        .map((v) => `"${String(v)}"`)
        .join(","),
    );

    return [header, ...lines].join("\n");
  }

  // Announcements
  async createAnnouncement(classId: string, authorId: string | null, dto: CreateAnnouncementDto) {
    await this.findOne(classId);
    const announcement = await this.prisma.classAnnouncement.create({
      data: {
        classId,
        authorId: authorId ?? undefined,
        title: dto.title,
        body: dto.body,
        pinned: dto.pinned ?? false,
      },
    });
    return announcement;
  }

  async listAnnouncements(classId: string) {
    await this.findOne(classId);
    return this.prisma.classAnnouncement.findMany({
      where: { classId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { author: { select: { id: true, fullName: true } } },
    });
  }

  async removeAnnouncement(id: string) {
    return this.prisma.classAnnouncement.delete({ where: { id } });
  }

  async listMessages(classId: string) {
    await this.findOne(classId);

    return this.prisma.classMessage.findMany({
      where: { classId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async createMessage(classId: string, senderId: string, dto: CreateClassMessageDto) {
    await this.findOne(classId);

    return this.prisma.classMessage.create({
      data: {
        classId,
        senderId,
        body: dto.body.trim(),
      },
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async listLiveSessions(classId: string) {
    await this.findOne(classId);

    return this.prisma.liveSession.findMany({
      where: { classId },
      orderBy: { startsAt: "asc" },
      include: this.liveSessionInclude(),
    });
  }

  async createLiveSession(classId: string, createdById: string | null, dto: CreateLiveSessionDto) {
    await this.findOne(classId);

    return this.prisma.liveSession.create({
      data: {
        classId,
        createdById: createdById ?? undefined,
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        meetingUrl: dto.meetingUrl,
        presentationUrl: dto.presentationUrl,
        bookUrl: dto.bookUrl,
      },
      include: this.liveSessionInclude(),
    });
  }

  async findLiveSession(id: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: this.liveSessionInclude(),
    });

    if (!session) {
      throw new NotFoundException(`Live session "${id}" not found.`);
    }

    return session;
  }

  async updateLiveSession(id: string, dto: UpdateLiveSessionDto) {
    await this.findLiveSession(id);

    return this.prisma.liveSession.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : dto.endsAt === "" ? null : undefined,
        status: dto.status,
        meetingUrl: dto.meetingUrl,
        presentationUrl: dto.presentationUrl,
        bookUrl: dto.bookUrl,
      },
      include: this.liveSessionInclude(),
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

  private async ensureTrainer(trainerId: string) {
    const trainer = await this.prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer) throw new NotFoundException(`Trainer "${trainerId}" not found.`);
    return trainer;
  }

  private defaultInclude() {
    return {
      course: { select: { id: true, code: true, title: true, deliveryMode: true } },
      trainer: { select: { id: true, fullName: true, role: true, email: true } },
      _count: { select: { students: true, attendanceRecords: true } },
    } as const;
  }

  private liveSessionInclude() {
    return {
      class: {
        select: {
          id: true,
          name: true,
          mode: true,
          course: { select: { id: true, code: true, title: true } },
          trainer: { select: { id: true, fullName: true, email: true } },
        },
      },
      createdBy: { select: { id: true, fullName: true, role: true } },
    } as const;
  }
}

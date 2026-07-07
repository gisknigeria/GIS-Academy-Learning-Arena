import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CertificatesService } from "../certificates/certificates.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { QueryCoursesDto } from "./dto/query-courses.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificatesService: CertificatesService,
  ) {}

  async create(dto: CreateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Course code "${dto.code.toUpperCase()}" is already in use.`);
    }

    return this.prisma.course.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        requiresPayment: dto.requiresPayment ?? true,
      },
    });
  }

  async findAll(query: QueryCoursesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      isArchived: query.includeArchived ? undefined : false,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.deliveryMode) {
      where.deliveryMode = query.deliveryMode;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: { select: { lessons: true, enrollments: true, classes: true } },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course "${id}" not found.`);
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id); // ensures 404 if not found

    if (dto.code) {
      const conflict = await this.prisma.course.findFirst({
        where: { code: dto.code.toUpperCase(), id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException(`Course code "${dto.code.toUpperCase()}" is already in use.`);
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.code && { code: dto.code.toUpperCase() }),
      },
    });
  }

  async archive(id: string) {
    await this.findOne(id); // ensures 404 if not found

    return this.prisma.course.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async restore(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course "${id}" not found.`);
    }

    return this.prisma.course.update({
      where: { id },
      data: { isArchived: false },
    });
  }

  async createLesson(courseId: string, dto: CreateLessonDto) {
    await this.findOne(courseId);

    return this.prisma.lesson.create({
      data: {
        courseId,
        title: dto.title,
        summary: dto.summary,
        order: dto.order,
        videoUrl: dto.videoUrl,
        resourceUrl: dto.resourceUrl,
      },
    });
  }

  async listLessons(courseId: string) {
    await this.findOne(courseId);

    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });
  }

  async listLessonsWithProgress(courseId: string, userId: string) {
    await this.findOne(courseId);

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        progress: {
          where: { userId },
          select: { completedAt: true },
        },
      },
    });

    return lessons.map((lesson) => {
      const completedAt = lesson.progress[0]?.completedAt ?? null;
      const { progress: _progress, ...lessonData } = lesson;
      return {
        ...lessonData,
        completed: Boolean(completedAt),
        completedAt,
      };
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });

    if (!lesson) {
      throw new NotFoundException(`Lesson "${id}" not found.`);
    }

    return this.prisma.lesson.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });

    if (!lesson) {
      throw new NotFoundException(`Lesson "${id}" not found.`);
    }

    await this.prisma.lesson.delete({ where: { id } });

    return { deleted: true };
  }

  async markLessonComplete(courseId: string, lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson "${lessonId}" not found in this course.`);
    }

    await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completedAt: new Date() },
      create: { userId, lessonId },
    });

    const summary = await this.ensureEnrollmentAndRefreshProgress(courseId, userId);

    if (summary.progress === 100) {
      await this.certificatesService.issueAutoCompletion(userId, courseId).catch(() => null);
    }

    return summary;
  }

  /**
   * Self-enroll the given user in a course. For free courses this gives immediate
   * enrollment; for paid courses it records the enrollment but access still
   * depends on paymentStatus.
   */
  async enrollSelf(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course "${courseId}" not found.`);

    // Create or return existing enrollment; set initial progress based on any
    // completed lessons the user already has (usually zero).
    const progressSummary = await this.getCourseProgress(courseId, userId).catch(() => ({ progress: 0 }));

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { progress: progressSummary.progress },
      create: { userId, courseId, progress: progressSummary.progress },
    });

    return { enrolled: true, courseId: course.id, requiresPayment: course.requiresPayment, enrollment };
  }

  async findEnrollment(courseId: string, userId: string) {
    return this.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  }

  async getCourseProgress(courseId: string, userId: string) {
    await this.findOne(courseId);

    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          lesson: { courseId },
        },
      }),
    ]);

    const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    return {
      courseId,
      totalLessons,
      completedLessons,
      progress,
    };
  }

  private async ensureEnrollmentAndRefreshProgress(courseId: string, userId: string) {
    const summary = await this.getCourseProgress(courseId, userId);

    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { progress: summary.progress },
      create: { userId, courseId, progress: summary.progress },
    });

    return summary;
  }
}

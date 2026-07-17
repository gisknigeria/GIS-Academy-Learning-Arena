import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DeliveryMode, Prisma } from "@prisma/client";
import { CertificatesService } from "../certificates/certificates.service";
import { CurriculumService } from "../curriculum/curriculum.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { QueryCoursesDto } from "./dto/query-courses.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { AnswerLessonDiscussionDto } from "./dto/answer-lesson-discussion.dto";
import { CreateLessonDiscussionDto } from "./dto/create-lesson-discussion.dto";
import { ImportLessonDto } from "./dto/import-lesson.dto";

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificatesService: CertificatesService,
    private readonly curriculumService: CurriculumService,
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

    if (query.trainingCategory) {
      where.trainingCategory = query.trainingCategory;
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

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course "${id}" not found.`);
    }

    await this.prisma.course.delete({ where: { id } });

    return { deleted: true };
  }

  async createLesson(courseId: string, dto: CreateLessonDto) {
    await this.findOne(courseId);
    await this.ensureModuleBelongsToCourse(dto.moduleId, courseId);

    return this.prisma.lesson.create({
      data: {
        courseId,
        moduleId: dto.moduleId,
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        order: dto.order,
        videoUrl: dto.videoUrl,
        resourceUrl: dto.resourceUrl,
        subtitleUrl: dto.subtitleUrl,
        slideUrl: dto.slideUrl,
        mapUrl: dto.mapUrl,
        attachments: dto.attachments ?? [],
      },
    });
  }

  async searchLessonLibrary(query?: string, excludeCourseId?: string) {
    const where: Prisma.LessonWhereInput = {
      ...(excludeCourseId ? { courseId: { not: excludeCourseId } } : {}),
    };

    if (query?.trim()) {
      const search = query.trim();
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { course: { title: { contains: search, mode: "insensitive" } } },
        { course: { code: { contains: search, mode: "insensitive" } } },
      ];
    }

    return this.prisma.lesson.findMany({
      where,
      orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
      take: 50,
      include: {
        course: { select: { id: true, code: true, title: true, deliveryMode: true } },
      },
    });
  }

  async importLesson(courseId: string, dto: ImportLessonDto) {
    await this.findOne(courseId);
    await this.ensureModuleBelongsToCourse(dto.moduleId, courseId);
    const source = await this.prisma.lesson.findUnique({
      where: { id: dto.sourceLessonId },
    });

    if (!source) {
      throw new NotFoundException(`Lesson "${dto.sourceLessonId}" not found.`);
    }

    const nextOrder = dto.order ?? (await this.prisma.lesson.count({ where: { courseId } })) + 1;

    return this.prisma.lesson.create({
      data: {
        courseId,
        moduleId: dto.moduleId,
        importedFromId: source.id,
        title: source.title,
        summary: source.summary,
        content: source.content,
        order: nextOrder,
        videoUrl: source.videoUrl,
        resourceUrl: source.resourceUrl,
        subtitleUrl: source.subtitleUrl,
        slideUrl: source.slideUrl,
        mapUrl: source.mapUrl,
        attachments: source.attachments ?? [],
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

  async listLessonsWithProgress(courseId: string, userId: string, canManageLessons = false) {
    await this.findOne(courseId);
    const lockContext = canManageLessons ? null : await this.getLessonLockContext(courseId, userId);

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
      include: {
        progress: {
          where: { userId },
          select: { completedAt: true },
        },
      },
    });
    const completedLessonIds = new Set(
      lessons.filter((lesson) => lesson.progress.length > 0).map((lesson) => lesson.id),
    );

    return lessons.map((lesson, index) => {
      const completedAt = lesson.progress[0]?.completedAt ?? null;
      const { progress: _progress, ...lessonData } = lesson;
      const sequentiallyLocked = !canManageLessons
        && index > 0
        && !completedLessonIds.has(lessons[index - 1].id);
      const trainerLocked = Boolean(lockContext && !lockContext.unlockedLessonIds.has(lesson.id));
      const isLocked = sequentiallyLocked || trainerLocked;
      const safeLessonData = isLocked
        ? {
            ...lessonData,
            content: null,
            videoUrl: null,
            resourceUrl: null,
            subtitleUrl: null,
            slideUrl: null,
            mapUrl: null,
            attachments: [],
          }
        : lessonData;
      return {
        ...safeLessonData,
        completed: Boolean(completedAt),
        completedAt,
        locked: isLocked,
        lockReason: sequentiallyLocked ? "previous_lesson" : trainerLocked ? "trainer_locked" : null,
      };
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });

    if (!lesson) {
      throw new NotFoundException(`Lesson "${id}" not found.`);
    }
    await this.ensureModuleBelongsToCourse(dto.moduleId, lesson.courseId);

    return this.prisma.lesson.update({
      where: { id },
      data: dto,
    });
  }

  async getLessonCourseId(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson "${lessonId}" not found.`);
    }

    return lesson.courseId;
  }

  async listLessonDiscussions(lessonId: string, userId?: string, canManageLessons = false) {
    const courseId = await this.getLessonCourseId(lessonId);
    if (!canManageLessons && userId) {
      await this.ensureLessonUnlocked(courseId, lessonId, userId);
    }

    return this.prisma.lessonDiscussion.findMany({
      where: { lessonId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        answeredBy: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async createLessonDiscussion(lessonId: string, authorId: string, dto: CreateLessonDiscussionDto, canManageLessons = false) {
    const courseId = await this.getLessonCourseId(lessonId);
    if (!canManageLessons) {
      await this.ensureLessonUnlocked(courseId, lessonId, authorId);
    }

    return this.prisma.lessonDiscussion.create({
      data: {
        lessonId,
        authorId,
        question: dto.question.trim(),
      },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        answeredBy: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async answerLessonDiscussion(discussionId: string, answeredById: string, dto: AnswerLessonDiscussionDto) {
    const discussion = await this.prisma.lessonDiscussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      throw new NotFoundException(`Question "${discussionId}" not found.`);
    }

    return this.prisma.lessonDiscussion.update({
      where: { id: discussionId },
      data: {
        answer: dto.answer.trim(),
        answeredById,
        answeredAt: new Date(),
      },
      include: {
        author: { select: { id: true, fullName: true, role: true } },
        answeredBy: { select: { id: true, fullName: true, role: true } },
      },
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
    await this.ensureLessonUnlocked(courseId, lessonId, userId);
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
    await this.curriculumService.assertCanEnroll(courseId, userId);

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

    const [totalLessons, completedLessons, modules, finalAssessments] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          lesson: { courseId },
        },
      }),
      this.prisma.courseModule.findMany({
        where: { courseId },
        include: {
          practicals: {
            where: { isPublished: true, kind: "MODULE_PRACTICAL" },
            select: {
              id: true,
              maxScore: true,
              submissions: {
                where: { studentId: userId, status: "GRADED" },
                select: { score: true },
              },
            },
          },
        },
      }),
      this.prisma.assessment.findMany({
        where: { courseId, scope: "COURSE_FINAL", isPublished: true },
        select: {
          id: true,
          attempts: {
            where: { userId, passed: true },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    const completedPracticalModules = modules.filter((module) =>
      module.practicals.length > 0
      && module.practicals.every((practical) =>
        practical.submissions.some((submission) => (submission.score ?? 0) >= practical.maxScore * 0.5),
      ),
    ).length;
    const passedFinalAssessments = finalAssessments.filter((assessment) => assessment.attempts.length > 0).length;
    const requiredFinalAssessments = Math.max(finalAssessments.length, 1);
    const totalRequirements = totalLessons + modules.length + requiredFinalAssessments;
    const completedRequirements = completedLessons + completedPracticalModules + passedFinalAssessments;
    const progress = totalRequirements === 0 ? 0 : Math.round((completedRequirements / totalRequirements) * 100);
    const courseCompleted = totalLessons > 0
      && completedLessons === totalLessons
      && modules.length > 0
      && completedPracticalModules === modules.length
      && finalAssessments.length > 0
      && passedFinalAssessments === finalAssessments.length;

    return {
      courseId,
      totalLessons,
      completedLessons,
      totalModules: modules.length,
      completedPracticalModules,
      totalFinalAssessments: finalAssessments.length,
      passedFinalAssessments,
      courseCompleted,
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

  private async getLessonLockContext(courseId: string, userId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { class: true },
    });

    if (!enrollment?.class || enrollment.class.mode !== DeliveryMode.ONSITE) {
      return null;
    }

    const unlocked = await this.prisma.classLessonUnlock.findMany({
      where: { classId: enrollment.classId ?? "" },
      select: { lessonId: true },
    });

    return {
      classId: enrollment.classId,
      unlockedLessonIds: new Set(unlocked.map((item) => item.lessonId)),
    };
  }

  private async ensureLessonUnlocked(courseId: string, lessonId: string, userId: string) {
    const lockContext = await this.getLessonLockContext(courseId, userId);

    if (lockContext && !lockContext.unlockedLessonIds.has(lessonId)) {
      throw new NotFoundException("This onsite lesson is locked until your trainer unlocks it.");
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
      select: { id: true },
    });
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex > 0) {
      const previousLesson = await this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: lessons[lessonIndex - 1].id } },
      });
      if (!previousLesson) {
        throw new NotFoundException("Complete the previous lesson before opening this lesson.");
      }
    }
  }

  private async ensureModuleBelongsToCourse(moduleId: string | undefined, courseId: string) {
    if (!moduleId) return;
    const module = await this.prisma.courseModule.findFirst({ where: { id: moduleId, courseId } });
    if (!module) {
      throw new NotFoundException("The selected module does not belong to this course.");
    }
  }
}

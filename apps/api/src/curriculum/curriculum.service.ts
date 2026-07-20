import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCategoryDto,
  CreateModuleDto,
  CreatePathwayDto,
  CreateProgrammeDto,
  UpdateProgrammeDto,
  CreateStageDto,
  ImportModuleDto,
  PlaceCourseDto,
} from "./dto/curriculum.dto";

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalogue(userId?: string) {
    const [categories, certificates] = await Promise.all([
      this.prisma.trainingCategory.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          pathways: {
            orderBy: { order: "asc" },
            include: {
              stages: {
                orderBy: { stageNumber: "asc" },
                include: {
                  courses: {
                    orderBy: { order: "asc" },
                    include: {
                      course: {
                        include: {
                          _count: { select: { modules: true, lessons: true, enrollments: true } },
                          enrollments: userId
                            ? { where: { userId }, select: { progress: true } }
                            : false,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      userId
        ? this.prisma.certificate.findMany({
            where: { userId },
            select: { courseId: true, stageId: true },
          })
        : Promise.resolve([]),
    ]);

    const certifiedCourseIds = new Set(certificates.flatMap((item) => item.courseId ? [item.courseId] : []));
    const certifiedStageIds = new Set(certificates.flatMap((item) => item.stageId ? [item.stageId] : []));

    return categories.map((category) => ({
      ...category,
      pathways: category.pathways.map((pathway) => {
        const requiredByStage = new Map(
          pathway.stages.map((stage) => [
            stage.stageNumber,
            stage.courses.filter((placement) => placement.required).map((placement) => placement.courseId),
          ]),
        );

        return {
          ...pathway,
          stages: pathway.stages.map((stage) => {
            const priorCourseIds = pathway.stages
              .filter((item) => item.stageNumber < stage.stageNumber)
              .flatMap((item) => requiredByStage.get(item.stageNumber) ?? []);
            const unlocked = stage.stageNumber === 1
              || certifiedStageIds.has(stage.id)
              || priorCourseIds.every((courseId) => certifiedCourseIds.has(courseId));

            return {
              ...stage,
              unlocked,
              lockedReason: unlocked ? null : "Complete the previous stage and collect its certificates first.",
              courses: stage.courses.map((placement) => ({
                ...placement,
                course: {
                  ...placement.course,
                  enrollment: placement.course.enrollments?.[0] ?? null,
                  enrollments: undefined,
                },
              })),
            };
          }),
        };
      }),
    }));
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.trainingCategory.create({
      data: { ...dto, slug: dto.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") },
    });
  }

  createPathway(categoryId: string, dto: CreatePathwayDto) {
    return this.prisma.learningPathway.create({ data: { categoryId, ...dto } });
  }

  async createProgramme(dto: CreateProgrammeDto) {
    const category = await this.prisma.trainingCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException("Training category not found.");

    const uniqueCourseIds = [...new Set(dto.courseIds)];
    const courseCount = await this.prisma.course.count({
      where: { id: { in: uniqueCourseIds }, isArchived: false },
    });
    if (courseCount !== uniqueCourseIds.length) {
      throw new NotFoundException("One or more selected courses could not be found.");
    }

    return this.prisma.$transaction(async (tx) => {
      const lastProgramme = await tx.learningPathway.findFirst({
        where: { categoryId: dto.categoryId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const programme = await tx.learningPathway.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          order: (lastProgramme?.order ?? 0) + 1,
          stages: {
            create: {
              stageNumber: 1,
              name: "Courses",
              description: "Complete the courses in this programme.",
              courses: {
                create: uniqueCourseIds.map((courseId, order) => ({
                  courseId,
                  order: order + 1,
                  required: true,
                })),
              },
            },
          },
        },
        include: {
          stages: {
            include: {
              courses: { orderBy: { order: "asc" }, include: { course: true } },
            },
          },
        },
      });
      return programme;
    });
  }

  async updateProgramme(programmeId: string, dto: UpdateProgrammeDto) {
    const programme = await this.prisma.learningPathway.findUnique({ where: { id: programmeId } });
    if (!programme) throw new NotFoundException("Programme not found.");
    if (dto.categoryId) {
      const category = await this.prisma.trainingCategory.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException("Training category not found.");
    }
    return this.prisma.learningPathway.update({
      where: { id: programmeId },
      data: {
        categoryId: dto.categoryId,
        name: dto.name?.trim(),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      },
    });
  }

  createStage(pathwayId: string, dto: CreateStageDto) {
    return this.prisma.learningStage.create({ data: { pathwayId, ...dto } });
  }

  async placeCourse(stageId: string, dto: PlaceCourseDto) {
    const [stage, course] = await Promise.all([
      this.prisma.learningStage.findUnique({ where: { id: stageId } }),
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    ]);
    if (!stage) throw new NotFoundException("Stage not found.");
    if (!course) throw new NotFoundException("Course not found.");

    return this.prisma.learningStageCourse.upsert({
      where: { stageId_courseId: { stageId, courseId: dto.courseId } },
      update: { order: dto.order ?? 0, required: dto.required ?? true },
      create: { stageId, courseId: dto.courseId, order: dto.order ?? 0, required: dto.required ?? true },
      include: { course: true },
    });
  }

  async removeCoursePlacement(placementId: string) {
    await this.prisma.learningStageCourse.delete({ where: { id: placementId } });
    return { deleted: true };
  }

  async assertCanEnroll(courseId: string, userId: string) {
    const placements = await this.prisma.learningStageCourse.findMany({
      where: { courseId },
      include: { stage: { include: { pathway: { include: { stages: { include: { courses: true } } } } } } },
    });
    if (placements.length === 0) return;

    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      select: { courseId: true, stageId: true },
    });
    const certifiedCourses = new Set(certificates.flatMap((item) => item.courseId ? [item.courseId] : []));
    const certifiedStages = new Set(certificates.flatMap((item) => item.stageId ? [item.stageId] : []));

    const hasUnlockedPlacement = placements.some(({ stage }) => {
      if (stage.stageNumber === 1 || certifiedStages.has(stage.id)) return true;
      return stage.pathway.stages
        .filter((item) => item.stageNumber < stage.stageNumber)
        .flatMap((item) => item.courses.filter((course) => course.required).map((course) => course.courseId))
        .every((requiredCourseId) => certifiedCourses.has(requiredCourseId));
    });

    if (!hasUnlockedPlacement) {
      throw new ForbiddenException("Complete the previous stage and collect its certificates before enrolling.");
    }
  }

  async listModules(courseId: string, userId: string, canManage = false) {
    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        lessons: { orderBy: { order: "asc" } },
        practicals: {
          where: canManage ? undefined : { isPublished: true },
          orderBy: { createdAt: "asc" },
          include: {
            _count: { select: { submissions: true } },
            submissions: {
              where: { studentId: userId },
              orderBy: { submittedAt: "desc" },
              take: 1,
              select: {
                id: true,
                status: true,
                score: true,
                feedback: true,
                submittedAt: true,
                gradedAt: true,
              },
            },
          },
        },
      },
    });

    return modules.map((module) => ({
      ...module,
      practicals: module.practicals.map(({ submissions, ...practical }) => ({
        ...practical,
        mySubmission: submissions[0] ?? null,
      })),
    }));
  }

  async moduleLibrary(search?: string, excludeCourseId?: string) {
    const where: Prisma.CourseModuleWhereInput = {
      ...(excludeCourseId ? { courseId: { not: excludeCourseId } } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { title: { contains: search.trim(), mode: "insensitive" } },
              { description: { contains: search.trim(), mode: "insensitive" } },
              { course: { title: { contains: search.trim(), mode: "insensitive" } } },
              { course: { code: { contains: search.trim(), mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    return this.prisma.courseModule.findMany({
      where,
      take: 50,
      orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
      include: {
        course: { select: { id: true, code: true, title: true } },
        _count: { select: { lessons: true, practicals: true } },
      },
    });
  }

  async createModule(courseId: string, dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Course not found.");
    const order = dto.order ?? await this.nextModuleOrder(courseId);
    return this.prisma.courseModule.create({ data: { courseId, ...dto, order } });
  }

  async updateModule(moduleId: string, dto: CreateModuleDto) {
    return this.prisma.courseModule.update({ where: { id: moduleId }, data: dto });
  }

  async deleteModule(moduleId: string) {
    const lessonCount = await this.prisma.lesson.count({ where: { moduleId } });
    if (lessonCount > 0) {
      throw new ConflictException("Move or delete this module's lessons before deleting the module.");
    }
    await this.prisma.courseModule.delete({ where: { id: moduleId } });
    return { deleted: true };
  }

  async importModule(courseId: string, dto: ImportModuleDto) {
    const source = await this.prisma.courseModule.findUnique({
      where: { id: dto.sourceModuleId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            assessments: {
              include: { questions: { orderBy: { order: "asc" } } },
            },
          },
        },
        practicals: true,
      },
    });
    if (!source) throw new NotFoundException("Source module not found.");
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException("Destination course not found.");
    const order = dto.order ?? await this.nextModuleOrder(courseId);

    return this.prisma.$transaction(async (tx) => {
      const module = await tx.courseModule.create({
        data: {
          courseId,
          title: source.title,
          description: source.description,
          order,
          importedFromId: source.id,
        },
      });

      for (const lesson of source.lessons) {
        const createdLesson = await tx.lesson.create({
          data: {
            courseId,
            moduleId: module.id,
            importedFromId: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            content: lesson.content,
            order: lesson.order,
            videoUrl: lesson.videoUrl,
            resourceUrl: lesson.resourceUrl,
            subtitleUrl: lesson.subtitleUrl,
            slideUrl: lesson.slideUrl,
            mapUrl: lesson.mapUrl,
            attachments: lesson.attachments ?? [],
          },
        });

        for (const assessment of lesson.assessments) {
          await tx.assessment.create({
            data: {
              courseId,
              lessonId: createdLesson.id,
              scope: "LESSON",
              title: assessment.title,
              description: assessment.description,
              durationMin: assessment.durationMin,
              passMark: assessment.passMark,
              totalPoints: assessment.totalPoints,
              shuffleQuestions: assessment.shuffleQuestions,
              isPublished: assessment.isPublished,
              questions: {
                create: assessment.questions.map((question) => ({
                  text: question.text,
                  type: question.type,
                  options: question.options as Prisma.InputJsonValue,
                  correctAnswer: question.correctAnswer,
                  points: question.points,
                  order: question.order,
                  explanation: question.explanation,
                  tags: question.tags,
                  difficulty: question.difficulty,
                  subject: question.subject,
                  courseId,
                  lessonId: createdLesson.id,
                })),
              },
            },
          });
        }
      }

      for (const practical of source.practicals) {
        await tx.assignment.create({
          data: {
            courseId,
            moduleId: module.id,
            kind: practical.kind,
            title: practical.title,
            description: practical.description,
            dueDate: null,
            maxScore: practical.maxScore,
            isPublished: false,
            acceptedEvidence: practical.acceptedEvidence as Prisma.InputJsonValue,
          },
        });
      }

      return tx.courseModule.findUnique({
        where: { id: module.id },
        include: { lessons: { orderBy: { order: "asc" } }, practicals: true },
      });
    });
  }

  private async nextModuleOrder(courseId: string) {
    const last = await this.prisma.courseModule.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }
}

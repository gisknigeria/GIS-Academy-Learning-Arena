import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ForbiddenException,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AccessControlService, canAccessPaidContent, isPaymentExempt } from "../auth/access-control.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { QueryCoursesDto } from "./dto/query-courses.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { AnswerLessonDiscussionDto } from "./dto/answer-lesson-discussion.dto";
import { CreateLessonDiscussionDto } from "./dto/create-lesson-discussion.dto";
import { ImportLessonDto } from "./dto/import-lesson.dto";

const WRITE_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER, UserRole.TRAINER];
const LESSON_WRITE_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER, UserRole.TRAINER];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("courses")
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly accessControl: AccessControlService,
  ) {}

  /**
   * POST /api/courses
   * Create a new course. Admin+ only.
   */
  @Roles(...WRITE_ROLES)
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  /**
   * GET /api/courses
   * List courses. All authenticated users can browse.
   * Each course in the list gets an `accessStatus` field derived from the
   * caller's JWT paymentStatus — no extra DB query needed.
   *
   * Supports: ?search=, ?deliveryMode=, ?page=, ?limit=, ?includeArchived=true
   */
  @Get()
  async findAll(@Query() query: QueryCoursesDto, @Req() req: AuthenticatedRequest) {
    const result = await this.coursesService.findAll(query);
    const { role, paymentStatus } = req.user;

    // Annotate each course with whether the caller can access its content
    const exempt = isPaymentExempt(role);
    const paymentCheck = exempt ? { allowed: true as const } : canAccessPaidContent(paymentStatus);

    return {
      ...result,
      data: result.data.map((course) => ({
        ...course,
        accessStatus: course.requiresPayment && !exempt
          ? paymentCheck
          : { allowed: true as const },
      })),
    };
  }

  /**
   * GET /api/courses/:id
   * Get a single course. Response includes `accessStatus` for the caller.
   */
  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const course = await this.coursesService.findOne(id);
    const { role, paymentStatus } = req.user;

    const exempt = isPaymentExempt(role);
    const accessStatus = course.requiresPayment && !exempt
      ? canAccessPaidContent(paymentStatus)
      : { allowed: true as const };

    return { ...course, accessStatus };
  }

  /**
   * GET /api/courses/:id/access
   * Lightweight access check. Returns { allowed, reason? } for the caller.
   * Used by the frontend before rendering lesson content.
   */
  @Get(":id/access")
  async checkAccess(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.accessControl.checkCourseAccess(req.user.sub, id);
  }

  @Roles(...LESSON_WRITE_ROLES)
  @Get("lessons/library")
  searchLessonLibrary(@Query("search") search?: string, @Query("excludeCourseId") excludeCourseId?: string) {
    return this.coursesService.searchLessonLibrary(search, excludeCourseId);
  }

  @Roles(...LESSON_WRITE_ROLES)
  @Post(":id/lessons")
  createLesson(@Param("id") id: string, @Body() dto: CreateLessonDto) {
    return this.coursesService.createLesson(id, dto);
  }

  @Roles(...LESSON_WRITE_ROLES)
  @Post(":id/lessons/import")
  importLesson(@Param("id") id: string, @Body() dto: ImportLessonDto) {
    return this.coursesService.importLesson(id, dto);
  }

  @Get(":id/lessons")
  async listLessons(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const access = await this.accessControl.checkCourseAccess(req.user.sub, id);

    if (!access.allowed) {
      throw new ForbiddenException(access.reason);
    }
    if (!LESSON_WRITE_ROLES.includes(req.user.role) && !await this.coursesService.findEnrollment(id, req.user.sub)) {
      throw new ForbiddenException("Enrollment required before opening course content.");
    }

    return this.coursesService.listLessonsWithProgress(id, req.user.sub, LESSON_WRITE_ROLES.includes(req.user.role));
  }

  @Get(":id/progress")
  async getProgress(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const access = await this.accessControl.checkCourseAccess(req.user.sub, id);

    if (!access.allowed) {
      throw new ForbiddenException(access.reason);
    }
    if (!LESSON_WRITE_ROLES.includes(req.user.role) && !await this.coursesService.findEnrollment(id, req.user.sub)) {
      throw new ForbiddenException("Enrollment required before opening course progress.");
    }

    return this.coursesService.getCourseProgress(id, req.user.sub);
  }

  /**
   * POST /api/courses/:id/enroll
   * Self-enroll the authenticated user in this course.
   * Free courses: immediate access.
   * Paid courses: creates enrollment but access still requires payment.
   */
  @Post(":id/enroll")
  async enroll(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.coursesService.enrollSelf(id, req.user.sub);
  }

  /**
   * GET /api/courses/:id/enrollment
   * Returns whether the authenticated user is enrolled in the course.
   */
  @Get(":id/enrollment")
  async checkEnrollment(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const e = await this.coursesService.findEnrollment(id, req.user.sub);
    return { enrolled: Boolean(e) };
  }

  @Post(":id/lessons/:lessonId/complete")
  async markLessonComplete(
    @Param("id") id: string,
    @Param("lessonId") lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const access = await this.accessControl.checkCourseAccess(req.user.sub, id);

    if (!access.allowed) {
      throw new ForbiddenException(access.reason);
    }
    if (!LESSON_WRITE_ROLES.includes(req.user.role) && !await this.coursesService.findEnrollment(id, req.user.sub)) {
      throw new ForbiddenException("Enrollment required before completing lessons.");
    }

    return this.coursesService.markLessonComplete(id, lessonId, req.user.sub);
  }

  /**
   * PATCH /api/courses/:id
   * Update course fields. Admin+ only.
   */
  @Roles(...WRITE_ROLES)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  /**
   * DELETE /api/courses/:id
   * Soft-delete (archive) a course. Super admin + admin only.
   * Preserves enrollment history — use PATCH /api/courses/:id/restore to undo.
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(":id")
  archive(@Param("id") id: string) {
    return this.coursesService.archive(id);
  }

  /**
   * PATCH /api/courses/:id/restore
   * Restore a soft-deleted course.
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(":id/restore")
  restore(@Param("id") id: string) {
    return this.coursesService.restore(id);
  }

  /**
   * DELETE /api/courses/:id/destroy
   * Permanent delete. Super admin only.
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(":id/destroy")
  remove(@Param("id") id: string) {
    return this.coursesService.remove(id);
  }

  @Roles(...LESSON_WRITE_ROLES)
  @Patch("lessons/:lessonId")
  updateLesson(@Param("lessonId") lessonId: string, @Body() dto: UpdateLessonDto) {
    return this.coursesService.updateLesson(lessonId, dto);
  }

  @Get("lessons/:lessonId/discussions")
  async listLessonDiscussions(@Param("lessonId") lessonId: string, @Req() req: AuthenticatedRequest) {
    const courseId = await this.coursesService.getLessonCourseId(lessonId);
    const access = await this.accessControl.checkCourseAccess(req.user.sub, courseId);

    if (!access.allowed && !LESSON_WRITE_ROLES.includes(req.user.role)) {
      throw new ForbiddenException(access.reason);
    }

    return this.coursesService.listLessonDiscussions(lessonId, req.user.sub, LESSON_WRITE_ROLES.includes(req.user.role));
  }

  @Post("lessons/:lessonId/discussions")
  async createLessonDiscussion(
    @Param("lessonId") lessonId: string,
    @Body() dto: CreateLessonDiscussionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const courseId = await this.coursesService.getLessonCourseId(lessonId);
    const access = await this.accessControl.checkCourseAccess(req.user.sub, courseId);

    if (!access.allowed && !LESSON_WRITE_ROLES.includes(req.user.role)) {
      throw new ForbiddenException(access.reason);
    }

    return this.coursesService.createLessonDiscussion(lessonId, req.user.sub, dto, LESSON_WRITE_ROLES.includes(req.user.role));
  }

  @Roles(...LESSON_WRITE_ROLES)
  @Patch("lesson-discussions/:discussionId/answer")
  answerLessonDiscussion(
    @Param("discussionId") discussionId: string,
    @Body() dto: AnswerLessonDiscussionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.coursesService.answerLessonDiscussion(discussionId, req.user.sub, dto);
  }

  @Roles(...LESSON_WRITE_ROLES)
  @Delete("lessons/:lessonId")
  deleteLesson(@Param("lessonId") lessonId: string) {
    return this.coursesService.deleteLesson(lessonId);
  }
}

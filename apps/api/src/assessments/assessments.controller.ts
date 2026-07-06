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
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { isPaymentExempt } from "../auth/access-control.service";
import { AssessmentsService } from "./assessments.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";
import { UpdateAssessmentDto } from "./dto/update-assessment.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

const STAFF_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("assessments")
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // ─── Assessment CRUD ─────────────────────────────────────────────────────

  /** POST /api/assessments — staff only */
  @Roles(...STAFF_ROLES)
  @Post()
  create(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto);
  }

  /**
   * GET /api/assessments
   * Staff receive all (published + draft). Students receive published only.
   * ?all=true is only respected for staff.
   */
  @Get()
  findAll(@Query("all") all: string, @Req() req: AuthenticatedRequest) {
    const isStaff = isPaymentExempt(req.user.role);
    return this.assessmentsService.findAll(isStaff && all === "true");
  }

  /** GET /api/assessments/:id — full detail + questions (correct answers stripped for students) */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.assessmentsService.findOne(id);
  }

  /** PATCH /api/assessments/:id — staff only */
  @Roles(...STAFF_ROLES)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, dto);
  }

  /** DELETE /api/assessments/:id — admin+ only */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.assessmentsService.remove(id);
  }

  // ─── Questions ───────────────────────────────────────────────────────────

  /** POST /api/assessments/:id/questions */
  @Roles(...STAFF_ROLES)
  @Post(":id/questions")
  addQuestion(@Param("id") id: string, @Body() dto: CreateQuestionDto) {
    return this.assessmentsService.addQuestion(id, dto);
  }

  /** PATCH /api/assessments/questions/:questionId */
  @Roles(...STAFF_ROLES)
  @Patch("questions/:questionId")
  updateQuestion(@Param("questionId") questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.assessmentsService.updateQuestion(questionId, dto);
  }

  /** DELETE /api/assessments/questions/:questionId */
  @Roles(...STAFF_ROLES)
  @Delete("questions/:questionId")
  removeQuestion(@Param("questionId") questionId: string) {
    return this.assessmentsService.removeQuestion(questionId);
  }

  // ─── Attempts ────────────────────────────────────────────────────────────

  /** POST /api/assessments/:id/attempt — start or resume */
  @Post(":id/attempt")
  startAttempt(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.assessmentsService.startAttempt(id, req.user.sub);
  }

  /** POST /api/assessments/attempts/:attemptId/submit */
  @Post("attempts/:attemptId/submit")
  submitAttempt(
    @Param("attemptId") attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assessmentsService.submitAttempt(attemptId, req.user.sub, dto);
  }

  /** GET /api/assessments/attempts/mine — student's own history */
  @Get("attempts/mine")
  getMyAttempts(@Req() req: AuthenticatedRequest) {
    return this.assessmentsService.getMyAttempts(req.user.sub);
  }

  /** GET /api/assessments/attempts/:attemptId — result detail */
  @Get("attempts/:attemptId")
  getAttemptResult(@Param("attemptId") attemptId: string, @Req() req: AuthenticatedRequest) {
    const isStaff = isPaymentExempt(req.user.role);
    return this.assessmentsService.getAttemptResult(attemptId, req.user.sub, isStaff);
  }

  /** GET /api/assessments/:id/attempts — staff: all attempts for an assessment */
  @Roles(...STAFF_ROLES)
  @Get(":id/attempts")
  listAttempts(@Param("id") id: string) {
    return this.assessmentsService.listAttempts(id);
  }
}

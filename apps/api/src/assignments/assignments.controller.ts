import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { AssignmentsService } from "./assignments.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * POST /api/courses/:courseId/assignments
   * Create an assignment for a course. Staff only.
   */
  @Roles(...WRITE_ROLES)
  @Post("courses/:courseId/assignments")
  create(
    @Param("courseId") courseId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(courseId, dto);
  }

  /**
   * GET /api/courses/:courseId/assignments
   * List assignments. Staff see all + submission counts.
   * Students see published only + their own submission per assignment.
   */
  @Get("courses/:courseId/assignments")
  listForCourse(
    @Param("courseId") courseId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assignmentsService.listForCourse(courseId, req.user.sub, req.user.role);
  }

  /**
   * PATCH /api/assignments/:assignmentId
   * Update assignment fields. Staff only.
   */
  @Roles(...WRITE_ROLES)
  @Patch("assignments/:assignmentId")
  update(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(assignmentId, dto);
  }

  /**
   * DELETE /api/assignments/:assignmentId
   * Delete an assignment. Admin+ only.
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER)
  @Delete("assignments/:assignmentId")
  remove(@Param("assignmentId") assignmentId: string) {
    return this.assignmentsService.remove(assignmentId);
  }

  /**
   * POST /api/assignments/:assignmentId/submit
   * Student submits (or resubmits) an assignment.
   */
  @Post("assignments/:assignmentId/submit")
  submit(
    @Param("assignmentId") assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.assignmentsService.submit(assignmentId, req.user.sub, dto);
  }

  /**
   * GET /api/assignments/:assignmentId/submissions
   * List all submissions. Staff only.
   */
  @Roles(...WRITE_ROLES)
  @Get("assignments/:assignmentId/submissions")
  listSubmissions(@Param("assignmentId") assignmentId: string) {
    return this.assignmentsService.listSubmissions(assignmentId);
  }

  /**
   * PATCH /api/submissions/:submissionId/grade
   * Grade a submission. Staff only.
   */
  @Roles(...WRITE_ROLES)
  @Patch("submissions/:submissionId/grade")
  grade(
    @Param("submissionId") submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.grade(submissionId, dto);
  }
}

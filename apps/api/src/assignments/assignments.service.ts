import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { SubmissionStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { GradeSubmissionDto } from "./dto/grade-submission.dto";
import { SubmitAssignmentDto } from "./dto/submit-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";

/** Roles allowed to create / edit / grade assignments */
const GRADER_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
];

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}

  // ─── Assignments ──────────────────────────────────────────────────────────

  async create(courseId: string, dto: CreateAssignmentDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course "${courseId}" not found.`);

    return this.prisma.assignment.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxScore: dto.maxScore ?? 100,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async update(assignmentId: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Assignment "${assignmentId}" not found.`);

    return this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: dto.title,
        description: dto.description,
        maxScore: dto.maxScore,
        isPublished: dto.isPublished,
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
      },
    });
  }

  async remove(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException(`Assignment "${assignmentId}" not found.`);

    await this.prisma.assignment.delete({ where: { id: assignmentId } });
    return { deleted: true };
  }

  /**
   * List published assignments for learners; all for staff.
   * Each item includes a `_count.submissions` for staff and the
   * caller's own submission (if any) for students.
   */
  async listForCourse(courseId: string, requesterId: string, requesterRole: UserRole) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course "${courseId}" not found.`);

    const isStaff = GRADER_ROLES.includes(requesterRole);
    const where = isStaff ? { courseId } : { courseId, isPublished: true };

    const assignments = await this.prisma.assignment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { submissions: true } },
        ...(isStaff
          ? {}
          : {
              submissions: {
                where: { studentId: requesterId },
                select: {
                  id: true,
                  status: true,
                  score: true,
                  feedback: true,
                  submittedAt: true,
                  gradedAt: true,
                },
              },
            }),
      },
    });

    if (isStaff) return assignments;

    // For learners, flatten the submission into the top-level object
    return assignments.map((a) => {
      const { submissions, ...rest } = a as typeof a & {
        submissions: {
          id: string;
          status: SubmissionStatus;
          score: number | null;
          feedback: string | null;
          submittedAt: Date;
          gradedAt: Date | null;
        }[];
      };
      return { ...rest, mySubmission: submissions[0] ?? null };
    });
  }

  // ─── Submissions ──────────────────────────────────────────────────────────

  async submit(assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException(`Assignment "${assignmentId}" not found.`);
    if (!assignment.isPublished) throw new ForbiddenException("This assignment is not published.");

    // Check for existing submission
    const existing = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
    if (existing && existing.status === SubmissionStatus.GRADED) {
      throw new ConflictException("This assignment has already been graded and cannot be resubmitted.");
    }

    if (existing) {
      // Allow re-submission if returned or still pending/submitted
      return this.prisma.submission.update({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        data: {
          answer: dto.answer,
          fileUrl: dto.fileUrl,
          status: SubmissionStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });
    }

    return this.prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        answer: dto.answer,
        fileUrl: dto.fileUrl,
        status: SubmissionStatus.SUBMITTED,
      },
    });
  }

  async listSubmissions(assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException(`Assignment "${assignmentId}" not found.`);

    return this.prisma.submission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: "asc" },
      include: {
        student: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async grade(submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException(`Submission "${submissionId}" not found.`);
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        status: dto.status,
        gradedAt: new Date(),
      },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        assignment: { select: { title: true } },
      },
    });

    // Fire an email notification to the student (best-effort)
    try {
      await this.emailService.sendGradeNotification(
        updated.student.email,
        updated.student.fullName,
        updated.assignment?.title ?? "Assignment",
        updated.score ?? null,
        updated.feedback ?? undefined,
      );
    } catch (err) {
      // Swallow email errors — grading should still succeed
    }

    return updated;
  }
}

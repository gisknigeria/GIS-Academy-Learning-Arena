import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttemptStatus, QuestionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAssessmentDto } from "./dto/create-assessment.dto";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { SubmitAttemptDto } from "./dto/submit-attempt.dto";
import { UpdateAssessmentDto } from "./dto/update-assessment.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Assessments CRUD ────────────────────────────────────────────────────

  async create(dto: CreateAssessmentDto) {
    if (dto.courseId) {
      const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
      if (!course) throw new NotFoundException(`Course "${dto.courseId}" not found.`);
    }

    return this.prisma.assessment.create({
      data: {
        title: dto.title,
        description: dto.description,
        courseId: dto.courseId,
        durationMin: dto.durationMin ?? 30,
        passMark: dto.passMark ?? 50,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        isPublished: dto.isPublished ?? false,
      },
      include: { _count: { select: { questions: true, attempts: true } } },
    });
  }

  async findAll(includeUnpublished = false) {
    return this.prisma.assessment.findMany({
      where: includeUnpublished ? undefined : { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
        course: { select: { id: true, code: true, title: true } },
      },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        course: { select: { id: true, code: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
    if (!assessment) throw new NotFoundException(`Assessment "${id}" not found.`);
    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    await this.findOne(id);
    return this.prisma.assessment.update({
      where: { id },
      data: dto,
      include: { _count: { select: { questions: true, attempts: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.assessment.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Questions ───────────────────────────────────────────────────────────

  async addQuestion(assessmentId: string, dto: CreateQuestionDto) {
    await this.findOne(assessmentId);

    const maxOrder = await this.prisma.question.aggregate({
      where: { assessmentId },
      _max: { order: true },
    });

    return this.prisma.question.create({
      data: {
        assessmentId,
        text: dto.text,
        type: dto.type,
        options: dto.options ?? [],
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        points: dto.points ?? 1,
        order: dto.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: dto.text,
        type: dto.type,
        options: dto.options,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        points: dto.points,
        order: dto.order,
      },
    });
  }

  async removeQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);
    await this.prisma.question.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  // ─── Attempts ────────────────────────────────────────────────────────────

  /**
   * Start a new attempt. Only one IN_PROGRESS attempt is allowed at a time.
   * Returns the assessment without correct answers — students don't see them during the attempt.
   */
  async startAttempt(assessmentId: string, userId: string) {
    const assessment = await this.findOne(assessmentId);

    if (!assessment.isPublished) {
      throw new ForbiddenException("This assessment is not available yet.");
    }

    const existing = await this.prisma.attempt.findFirst({
      where: { assessmentId, userId, status: AttemptStatus.IN_PROGRESS },
    });

    if (existing) {
      // Resume the existing attempt — return it without revealing answers
      return this.safeAttemptResponse(assessment, existing);
    }

    const attempt = await this.prisma.attempt.create({
      data: { assessmentId, userId },
    });

    return this.safeAttemptResponse(assessment, attempt);
  }

  /**
   * Submit answers, auto-score MCQ and TRUE_FALSE, mark attempt as SUBMITTED.
   * SHORT_ANSWER questions are left unscored (0 pts) — manual grading can be added later.
   */
  async submitAttempt(attemptId: string, userId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: { questions: true },
        },
      },
    });

    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.userId !== userId) throw new ForbiddenException("Not your attempt.");
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException("This attempt has already been submitted.");
    }

    const questions = attempt.assessment.questions;
    let score = 0;
    let maxScore = 0;

    for (const question of questions) {
      maxScore += question.points;

      if (question.type === QuestionType.SHORT_ANSWER) continue; // skip auto-score

      const studentAnswer = (dto.answers[question.id] ?? "").trim().toLowerCase();
      const correct = (question.correctAnswer ?? "").trim().toLowerCase();

      if (studentAnswer === correct && studentAnswer !== "") {
        score += question.points;
      }
    }

    const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
    const passed = percentage >= attempt.assessment.passMark;

    const updated = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        answers: dto.answers,
        score,
        maxScore,
        percentage,
        passed,
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        assessment: {
          include: {
            questions: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    return this.buildResult(updated);
  }

  /** Force-submit a timed-out attempt — same scoring logic. */
  async timeoutAttempt(attemptId: string, userId: string, answers: Record<string, string>) {
    return this.submitAttempt(attemptId, userId, { answers });
  }

  async getMyAttempts(userId: string) {
    return this.prisma.attempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        assessment: { select: { id: true, title: true, passMark: true } },
      },
    });
  }

  async getAttemptResult(attemptId: string, userId: string, isStaff: boolean) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (!isStaff && attempt.userId !== userId) throw new ForbiddenException("Not your attempt.");
    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException("Attempt has not been submitted yet.");
    }

    return this.buildResult(attempt);
  }

  /** Staff: list all attempts for an assessment with student info. */
  async listAttempts(assessmentId: string) {
    await this.findOne(assessmentId);

    return this.prisma.attempt.findMany({
      where: { assessmentId },
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /** Strip correct answers from questions before sending to a student mid-attempt. */
  private safeAttemptResponse(
    assessment: Awaited<ReturnType<typeof this.findOne>>,
    attempt: { id: string; assessmentId: string; userId: string; answers: unknown; startedAt: Date; status: AttemptStatus },
  ) {
    const safeQuestions = assessment.questions.map(({ correctAnswer: _ca, explanation: _exp, ...q }) => q);

    const shuffled =
      assessment.shuffleQuestions
        ? [...safeQuestions].sort(() => Math.random() - 0.5)
        : safeQuestions;

    return {
      attemptId: attempt.id,
      assessmentId: assessment.id,
      title: assessment.title,
      description: assessment.description,
      durationMin: assessment.durationMin,
      startedAt: attempt.startedAt,
      savedAnswers: attempt.answers as Record<string, string>,
      questions: shuffled,
    };
  }

  /** Build a full result object with per-question breakdown. */
  private buildResult(attempt: {
    id: string;
    userId: string;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    passed: boolean | null;
    status: AttemptStatus;
    startedAt: Date;
    submittedAt: Date | null;
    answers: unknown;
    assessment: {
      id: string;
      title: string;
      passMark: number;
      questions: {
        id: string;
        text: string;
        type: QuestionType;
        options: unknown;
        correctAnswer: string | null;
        explanation: string | null;
        points: number;
        order: number;
      }[];
    };
  }) {
    const answers = attempt.answers as Record<string, string>;

    const breakdown = attempt.assessment.questions.map((q) => {
      const studentAnswer = answers[q.id] ?? null;
      const isAutoScored = q.type !== QuestionType.SHORT_ANSWER;
      const correct = isAutoScored
        ? studentAnswer?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()
        : null; // null = manually graded

      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        earnedPoints: correct ? q.points : 0,
        correct,
      };
    });

    return {
      attemptId: attempt.id,
      assessmentId: attempt.assessment.id,
      title: attempt.assessment.title,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      passMark: attempt.assessment.passMark,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      breakdown,
    };
  }
}

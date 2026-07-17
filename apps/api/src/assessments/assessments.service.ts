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
import { CheckAnswerDto } from "./dto/check-answer.dto";

type AssessmentAnswer = string | string[];

function parseCorrectAnswers(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Older questions store a single plain-text answer.
  }
  return [value];
}

function normalizeAnswers(value: AssessmentAnswer | null | undefined): string[] {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map((item) => item.trim().toLowerCase()).filter(Boolean).sort();
}

function answersMatch(type: QuestionType, answer: AssessmentAnswer | null | undefined, correctAnswer: string | null) {
  const submitted = normalizeAnswers(answer);
  const correct = normalizeAnswers(
    type === QuestionType.MULTIPLE_CHOICE ? parseCorrectAnswers(correctAnswer) : correctAnswer,
  );
  return submitted.length > 0 && submitted.length === correct.length && submitted.every((item, index) => item === correct[index]);
}

function isAutoScored(type: QuestionType, correctAnswer: string | null) {
  if (type === QuestionType.NOTE || type === QuestionType.FILE_UPLOAD || type === QuestionType.MAP_TASK) return false;
  return type !== QuestionType.SHORT_ANSWER || Boolean(correctAnswer?.trim());
}

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Question banks & random selection ───────────────────────────────────

  async createQuestionBank(title: string, description?: string) {
    return this.prisma.questionBank.create({ data: { title, description } });
  }

  async listQuestionBanks() {
    return this.prisma.questionBank.findMany({
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { text: "asc" }, include: { course: { select: { id: true, title: true } }, lesson: { select: { id: true, title: true } } } } },
    });
  }

  async createBankQuestion(bankId: string, dto: CreateQuestionDto) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) throw new NotFoundException(`Question bank "${bankId}" not found.`);

    return this.prisma.question.create({
      data: {
        text: dto.text,
        type: dto.type,
        options: dto.options ?? [],
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        points: dto.type === QuestionType.NOTE ? 0 : dto.points ?? 1,
        order: dto.order ?? 0,
        tags: dto.tags ?? [],
        difficulty: dto.difficulty ?? "MEDIUM",
        subject: dto.subject,
        courseId: dto.courseId || null,
        lessonId: dto.lessonId || null,
        questionBanks: { connect: { id: bankId } },
      },
    });
  }

  async importQuestions(assessmentId: string, questionIds: string[]) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException(`Assessment "${assessmentId}" not found.`);
    const templates = await this.prisma.question.findMany({ where: { id: { in: questionIds } } });
    if (templates.length === 0) throw new BadRequestException("Select at least one valid question.");
    const last = await this.prisma.question.findFirst({ where: { assessmentId }, orderBy: { order: "desc" } });
    const startOrder = (last?.order ?? -1) + 1;

    return this.prisma.$transaction(
      templates.map((question, index) => this.prisma.question.create({
        data: {
          assessmentId,
          text: question.text,
          type: question.type,
          options: question.options as any,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: question.points,
          order: startOrder + index,
          tags: question.tags,
          difficulty: question.difficulty,
          subject: question.subject,
          courseId: question.courseId,
          lessonId: question.lessonId,
        },
      })),
    );
  }

  async duplicateBankQuestion(bankId: string, questionId: string) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) throw new NotFoundException(`Question bank "${bankId}" not found.`);
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);

    return this.prisma.question.create({
      data: {
        text: `${question.text} (copy)`,
        type: question.type,
        options: question.options as any,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: question.points,
        order: question.order,
        tags: question.tags,
        difficulty: question.difficulty,
        subject: question.subject,
        courseId: question.courseId,
        lessonId: question.lessonId,
        questionBanks: { connect: { id: bankId } },
      },
    });
  }

  async addQuestionToBank(bankId: string, questionId: string) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) throw new NotFoundException(`Question bank "${bankId}" not found.`);

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);

    await this.prisma.question.update({ where: { id: questionId }, data: { questionBanks: { connect: { id: bankId } } } });
    return { added: true };
  }

  async drawFromBank(bankId: string, count = 10) {
    const questions = await this.prisma.question.findMany({ where: { questionBanks: { some: { id: bankId } } } });
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // ─── Grading & anti-cheat basics ─────────────────────────────────────────

  /** Staff: grade manual questions (short answer / file upload / map task) */
  async gradeAttempt(
    attemptId: string,
    graderId: string,
    grades: Record<string, number>,
    comments?: Record<string, string>,
  ) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId }, include: { assessment: { include: { questions: true } } } });
    if (!attempt) throw new NotFoundException("Attempt not found.");

    // Only non-in-progress attempts can be graded
    if (attempt.status === AttemptStatus.IN_PROGRESS) throw new BadRequestException("Attempt is still in progress.");

    // Build map of questions
    const qMap: Record<string, any> = {};
    for (const q of attempt.assessment.questions) qMap[q.id] = q;

    // Sum provided grades, cap at question.points
    let added = 0;
    for (const [qId, pts] of Object.entries(grades)) {
      const q = qMap[qId];
      if (!q) continue;
      const assign = Math.max(0, Math.min(q.points ?? 0, Math.floor(pts)));
      added += assign;
    }

    const prevScore = attempt.score ?? 0;
    const maxScore = attempt.maxScore ?? attempt.assessment.questions.reduce((s: number, q: any) => s + (q.points ?? 0), 0);
    const newScore = prevScore + added;
    const percentage = maxScore === 0 ? 0 : Math.round((newScore / maxScore) * 100);
    const passed = percentage >= attempt.assessment.passMark;

    const updated = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        score: newScore,
        percentage,
        passed,
        status: AttemptStatus.GRADED,
        gradedAt: new Date(),
        gradedBy: graderId,
        gradingComments: comments ?? undefined,
      },
    });
    return { updated: true, score: updated.score, percentage: updated.percentage, passed: updated.passed };
  }

  /** Staff: flag an attempt as suspicious */
  async flagAttempt(attemptId: string, staffId: string, reason?: string) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException("Attempt not found.");
    await this.prisma.attempt.update({ where: { id: attemptId }, data: { flagged: true, flagReason: reason ?? null, flaggedAt: new Date(), gradedBy: staffId } });
    return { flagged: true };
  }

  // ─── Assessments CRUD ────────────────────────────────────────────────────

  async create(dto: CreateAssessmentDto) {
    let courseId = dto.courseId;
    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
      if (!lesson) throw new NotFoundException(`Lesson "${dto.lessonId}" not found.`);
      if (courseId && courseId !== lesson.courseId) {
        throw new BadRequestException("The selected lesson does not belong to this course.");
      }
      courseId = lesson.courseId;
    }

    if (courseId) {
      const course = await this.prisma.course.findUnique({ where: { id: courseId } });
      if (!course) throw new NotFoundException(`Course "${dto.courseId}" not found.`);
    }

    return this.prisma.assessment.create({
      data: {
        title: dto.title,
        scope: dto.lessonId ? "LESSON" : dto.scope ?? "COURSE_FINAL",
        description: dto.description,
        courseId,
        lessonId: dto.lessonId,
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
        lesson: { select: { id: true, title: true, order: true } },
      },
    });
  }

  async findByLesson(lessonId: string, includeUnpublished = false) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) throw new NotFoundException(`Lesson "${lessonId}" not found.`);

    return this.prisma.assessment.findMany({
      where: { lessonId, ...(includeUnpublished ? {} : { isPublished: true }) },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
        lesson: { select: { id: true, title: true, order: true } },
      },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        course: { select: { id: true, code: true, title: true } },
        lesson: { select: { id: true, title: true, order: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });
    if (!assessment) throw new NotFoundException(`Assessment "${id}" not found.`);
    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    await this.findOne(id);
    if (dto.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
      if (!lesson) throw new NotFoundException(`Lesson "${dto.lessonId}" not found.`);
      if (dto.courseId && dto.courseId !== lesson.courseId) {
        throw new BadRequestException("The selected lesson does not belong to this course.");
      }
      dto.courseId = lesson.courseId;
    }
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
        points: dto.type === QuestionType.NOTE ? 0 : dto.points ?? 1,
        order: dto.order ?? (maxOrder._max.order ?? 0) + 1,
        tags: dto.tags ?? [],
        difficulty: dto.difficulty ?? "MEDIUM",
        subject: dto.subject,
        courseId: dto.courseId || null,
        lessonId: dto.lessonId || null,
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
        tags: dto.tags,
        difficulty: dto.difficulty,
        subject: dto.subject,
        courseId: dto.courseId === "" ? null : dto.courseId,
        lessonId: dto.lessonId === "" ? null : dto.lessonId,
      },
    });
  }

  async removeQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question "${questionId}" not found.`);
    await this.prisma.question.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  async checkAnswer(attemptId: string, userId: string, dto: CheckAnswerDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { assessment: { include: { questions: true } } },
    });
    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.userId !== userId) throw new ForbiddenException("Not your attempt.");
    if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new BadRequestException("This attempt is no longer active.");

    const question = attempt.assessment.questions.find((item) => item.id === dto.questionId);
    if (!question) throw new NotFoundException("Question not found in this assessment.");
    if (question.type === QuestionType.NOTE) {
      return { questionId: question.id, correct: null, correctAnswer: null, explanation: question.explanation };
    }

    const submitted: AssessmentAnswer = dto.answers ?? dto.answer ?? "";
    const autoScored = isAutoScored(question.type, question.correctAnswer);
    return {
      questionId: question.id,
      correct: autoScored ? answersMatch(question.type, submitted, question.correctAnswer) : null,
      correctAnswer: autoScored
        ? question.type === QuestionType.MULTIPLE_CHOICE
          ? parseCorrectAnswers(question.correctAnswer)
          : question.correctAnswer
        : null,
      explanation: question.explanation,
    };
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
      if (question.type === QuestionType.NOTE) continue;
      maxScore += question.points;

      if (!isAutoScored(question.type, question.correctAnswer)) continue;
      if (answersMatch(question.type, dto.answers[question.id], question.correctAnswer)) {
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
  async timeoutAttempt(attemptId: string, userId: string, answers: Record<string, AssessmentAnswer>) {
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
      savedAnswers: attempt.answers as Record<string, AssessmentAnswer>,
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
    const answers = attempt.answers as Record<string, AssessmentAnswer>;

const gradingComments = (attempt as any).gradingComments as Record<string, string> | undefined;
      const breakdown = attempt.assessment.questions.map((q) => {
      const studentAnswer = answers[q.id] ?? null;
      const autoScored = isAutoScored(q.type, q.correctAnswer);
      const correct = autoScored ? answersMatch(q.type, studentAnswer, q.correctAnswer) : null;

      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        studentAnswer,
        correctAnswer: q.type === QuestionType.MULTIPLE_CHOICE ? parseCorrectAnswers(q.correctAnswer) : q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        earnedPoints: correct ? q.points : 0,
        correct,
        gradingComment: gradingComments?.[q.id] ?? null,
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

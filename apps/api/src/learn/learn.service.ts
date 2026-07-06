import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LearnService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string) {
    // Run all queries in parallel for a single round-trip
    const [
      enrollments,
      assignmentSubmissions,
      assessments,
      classes,
    ] = await Promise.all([
      this.getEnrolledCourses(userId),
      this.getPendingAssignments(userId),
      this.getAvailableAssessments(userId),
      this.getUpcomingClasses(userId),
    ]);

    // Derive "continue learning" — the in-progress course with the most recent activity
    const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100);
    const notStarted = enrollments.filter((e) => e.progress === 0);
    const completed = enrollments.filter((e) => e.progress === 100);

    const continueCourse =
      inProgress[0] ??   // Most recently active incomplete course
      notStarted[0] ??   // Nothing started yet — suggest first enrolment
      null;

    return {
      continueCourse,
      enrollments,
      stats: {
        totalEnrolled: enrollments.length,
        inProgress: inProgress.length,
        completed: completed.length,
        pendingWork:
          assignmentSubmissions.filter((s) => s.pendingCount > 0).length +
          assessments.filter((a) => !a.attempted).length,
      },
      pendingAssignments: assignmentSubmissions,
      assessments,
      upcomingClasses: classes,
    };
  }

  // ─── Enrolled courses with progress + next lesson ─────────────────────────

  private async getEnrolledCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            deliveryMode: true,
            requiresPayment: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    // For each enrolled course, find the first incomplete lesson
    const results = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completedLessonIds = await this.prisma.lessonProgress
          .findMany({
            where: { userId, lesson: { courseId: enrollment.courseId } },
            select: { lessonId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.lessonId)));

        const nextLesson = await this.prisma.lesson.findFirst({
          where: {
            courseId: enrollment.courseId,
            id: { notIn: [...completedLessonIds] },
          },
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        });

        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.courseId,
          code: enrollment.course.code,
          title: enrollment.course.title,
          description: enrollment.course.description,
          deliveryMode: enrollment.course.deliveryMode,
          requiresPayment: enrollment.course.requiresPayment,
          totalLessons: enrollment.course._count.lessons,
          completedLessons: completedLessonIds.size,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          nextLesson: nextLesson ?? null,
        };
      }),
    );

    return results;
  }

  // ─── Assignments with pending submissions ─────────────────────────────────

  private async getPendingAssignments(userId: string) {
    // Get all published assignments for courses the user is enrolled in
    const enrolledCourseIds = await this.prisma.enrollment
      .findMany({ where: { userId }, select: { courseId: true } })
      .then((rows) => rows.map((r) => r.courseId));

    if (enrolledCourseIds.length === 0) return [];

    const assignments = await this.prisma.assignment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        isPublished: true,
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      include: {
        course: { select: { id: true, code: true, title: true } },
        submissions: {
          where: { studentId: userId },
          select: { id: true, status: true, score: true, submittedAt: true, gradedAt: true },
        },
      },
    });

    return assignments
      .map((assignment) => {
        const submission = assignment.submissions[0] ?? null;
        const isPending =
          !submission ||
          submission.status === "PENDING" ||
          submission.status === "RETURNED";

        return {
          assignmentId: assignment.id,
          courseId: assignment.courseId,
          courseCode: assignment.course.code,
          courseTitle: assignment.course.title,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          maxScore: assignment.maxScore,
          submission,
          isPending,
          pendingCount: isPending ? 1 : 0,
        };
      })
      .filter((a) => a.isPending); // Only surface things that need action
  }

  // ─── Published assessments with attempt status ────────────────────────────

  private async getAvailableAssessments(userId: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        course: { select: { id: true, code: true, title: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { userId },
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            percentage: true,
            passed: true,
            submittedAt: true,
          },
        },
      },
    });

    return assessments.map((assessment) => {
      const latestAttempt = assessment.attempts[0] ?? null;
      return {
        assessmentId: assessment.id,
        title: assessment.title,
        description: assessment.description,
        durationMin: assessment.durationMin,
        passMark: assessment.passMark,
        questionCount: assessment._count.questions,
        course: assessment.course,
        attempted: Boolean(latestAttempt?.submittedAt),
        passed: latestAttempt?.passed ?? null,
        percentage: latestAttempt?.percentage ?? null,
        latestAttemptId: latestAttempt?.id ?? null,
      };
    });
  }

  // ─── Upcoming classes the user is enrolled in ─────────────────────────────

  private async getUpcomingClasses(userId: string) {
    const now = new Date();

    return this.prisma.class.findMany({
      where: {
        students: { some: { userId } },
        OR: [
          { startsAt: { gte: now } },
          { endsAt: { gte: now } },
          { startsAt: null }, // Ongoing / no fixed date
        ],
      },
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      take: 5,
      include: {
        course: { select: { id: true, code: true, title: true } },
      },
    });
  }
}

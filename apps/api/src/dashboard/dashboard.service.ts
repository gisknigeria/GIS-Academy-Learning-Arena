import { Injectable } from "@nestjs/common";
import { AttemptStatus, PaymentStatus, SubmissionStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const LEARNER_ROLES: UserRole[] = [UserRole.STUDENT, UserRole.ALUMNI, UserRole.GUEST];
const STAFF_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER];
const TRAINER_ROLES: UserRole[] = [UserRole.TRAINER, UserRole.EXAMINER];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, role: UserRole) {
    if (LEARNER_ROLES.includes(role)) {
      return this.getLearnerStats(userId);
    }

    if (TRAINER_ROLES.includes(role)) {
      return this.getTrainerDashboard(userId, role);
    }

    if (STAFF_ROLES.includes(role)) {
      return this.getStaffDashboard(role);
    }

    // Coordinators + Olympiad roles
    return this.getCoordinatorStats(userId, role);
  }

  // ─── Learner stats ────────────────────────────────────────────────────────

  private async getLearnerStats(userId: string) {
    const today = new Date();

    const [enrollments, completedLessons, bestRank, competitionCount] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { id: true, code: true, title: true } } },
        orderBy: { enrolledAt: "desc" },
      }),
      this.prisma.lessonProgress.count({ where: { userId } }),
      this.prisma.competitionParticipant.findFirst({
        where: { userId, rank: { not: null } },
        orderBy: { score: "desc" },
        select: { rank: true, score: true },
      }),
      this.prisma.competitionParticipant.count({ where: { userId } }),
    ]);

    const totalEnrolled = enrollments.length;
    const avgProgress =
      totalEnrolled === 0
        ? 0
        : Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / totalEnrolled);

    const courseIds = enrollments.map((e) => e.courseId);

    // Next uncompleted lesson across enrolled courses
    const nextLesson =
      courseIds.length > 0
        ? await this.prisma.lesson.findFirst({
            where: { courseId: { in: courseIds }, NOT: { progress: { some: { userId } } } },
            orderBy: { order: "asc" },
            select: { id: true, title: true, courseId: true, order: true },
          })
        : null;

    // Pending assignments: published assignments with no completed/submitted/graded submission
    const pendingAssignments =
      courseIds.length > 0
        ? await this.prisma.assignment.findMany({
            where: {
              courseId: { in: courseIds },
              isPublished: true,
              NOT: {
                submissions: {
                  some: {
                    studentId: userId,
                    status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED, SubmissionStatus.RETURNED] },
                  },
                },
              },
            },
            orderBy: { dueDate: "asc" },
            take: 6,
            select: { id: true, title: true, dueDate: true, course: { select: { id: true, code: true, title: true } } },
          })
        : [];

    // Upcoming competitions the learner can join or is already registered for
    const upcomingCompetitions = await this.prisma.competition.findMany({
      where: {
        OR: [
          { isPublic: true, startsAt: { gte: today } },
          { participants: { some: { userId } } },
        ],
      },
      orderBy: { startsAt: "asc" },
      take: 6,
      select: { id: true, title: true, startsAt: true, endsAt: true, mode: true, status: true },
    });

    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      take: 6,
      include: { course: { select: { id: true, code: true, title: true } } },
    });

    const playerStats = await this.prisma.playerStats.findUnique({ where: { userId } });

    return {
      role: "learner",
      enrolledCourses: enrollments.map((e) => ({
        courseId: e.course.id,
        code: e.course.code,
        title: e.course.title,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
      })),
      stats: [
        {
          label: "Learning progress",
          value: `${avgProgress}%`,
          note: `${totalEnrolled} course${totalEnrolled !== 1 ? "s" : ""} enrolled`,
          key: "progress",
        },
        {
          label: "Lessons completed",
          value: String(completedLessons),
          note: "Total across all courses",
          key: "lessons",
        },
        {
          label: "Competitions joined",
          value: String(competitionCount),
          note: competitionCount > 0 ? "Keep competing!" : "Join your first challenge",
          key: "competitions",
        },
        {
          label: "Best arena rank",
          value: bestRank?.rank != null ? `#${bestRank.rank}` : "—",
          note: bestRank?.score != null ? `${bestRank.score} pts` : "Not ranked yet",
          key: "rank",
        },
      ],
      nextLesson: nextLesson && { id: nextLesson.id, title: nextLesson.title, courseId: nextLesson.courseId, order: nextLesson.order },
      pendingAssignments: pendingAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        course: { id: a.course.id, code: a.course.code, title: a.course.title },
      })),
      upcomingCompetitions: upcomingCompetitions.map((c) => ({
        id: c.id,
        title: c.title,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        mode: c.mode,
        status: c.status,
      })),
      certificates: certificates.map((c) => ({ id: c.id, title: c.title, issuedAt: c.issuedAt, course: c.course })),
      playerStats: playerStats
        ? { xp: playerStats.xp, points: playerStats.points, streak: playerStats.streak, level: playerStats.level }
        : { xp: 0, points: 0, streak: 0, level: 1 },
    };
  }

  // ─── Staff stats ──────────────────────────────────────────────────────────

  private async getStaffStats(role: UserRole) {
    const [users, courses, classes, certificates] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count({ where: { isArchived: false } }),
      this.prisma.class.count(),
      this.prisma.certificate.count(),
    ]);

    return {
      role: role === UserRole.TRAINER || role === UserRole.EXAMINER ? "trainer" : "staff",
      stats: [
        { label: "Users", value: String(users), note: "Registered accounts", key: "users" },
        { label: "Courses", value: String(courses), note: "Active course catalogue", key: "courses" },
        { label: "Classes", value: String(classes), note: "Cohorts and sessions", key: "classes" },
        { label: "Certificates", value: String(certificates), note: "Issued credentials", key: "certificates" },
      ],
    };
  }

  private async getStaffDashboard(role: UserRole) {
    const base = await this.getStaffStats(role);

    const [paymentProvider, recentUsers, recentSubmissions, activeCompetitions, paidLearners, pendingPayments, overduePayments] =
      await Promise.all([
        this.prisma.platformSetting.findUnique({ where: { key: "payment_provider" } }),
        this.prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        }),
        this.prisma.submission.findMany({
          where: { status: SubmissionStatus.SUBMITTED },
          orderBy: { submittedAt: "desc" },
          take: 6,
          include: {
            assignment: { select: { title: true } },
            student: { select: { fullName: true } },
          },
        }),
        this.prisma.competition.findMany({
          where: { status: { in: ["OPEN", "LIVE"] } },
          orderBy: [{ status: "asc" }, { startsAt: "asc" }],
          take: 6,
          select: {
            id: true,
            title: true,
            mode: true,
            status: true,
            startsAt: true,
            endsAt: true,
            _count: { select: { participants: true } },
          },
        }),
        this.prisma.user.count({ where: { role: { in: LEARNER_ROLES }, paymentStatus: PaymentStatus.PAID } }),
        this.prisma.user.count({
          where: { role: { in: LEARNER_ROLES }, paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } },
        }),
        this.prisma.user.count({ where: { role: { in: LEARNER_ROLES }, paymentStatus: PaymentStatus.OVERDUE } }),
      ]);

    const paymentSummary = {
      provider: paymentProvider?.value ?? "paystack",
      paidLearners,
      pendingPayments,
      overduePayments,
      revenueNote: "Revenue tracking is based on learner payment status.",
    };

    const platformHealth = {
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      dbConnected: true,
      apiHealthy: true,
    };

    return {
      ...base,
      recentUsers,
      recentSubmissions: recentSubmissions.map((submission) => ({
        id: submission.id,
        assignmentTitle: submission.assignment.title,
        studentName: submission.student.fullName,
        submittedAt: submission.submittedAt.toISOString(),
        status: submission.status,
      })),
      activeCompetitions: activeCompetitions.map((competition) => ({
        id: competition.id,
        title: competition.title,
        mode: competition.mode,
        status: competition.status,
        startsAt: competition.startsAt,
        endsAt: competition.endsAt,
        participants: competition._count.participants,
      })),
      paymentSummary,
      platformHealth,
    };
  }

  private async getTrainerDashboard(userId: string, role: UserRole) {
    const base = await this.getStaffStats(role);
    const today = new Date();

    const assignedClasses = await this.prisma.class.findMany({
      where: { trainerId: userId },
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      take: 6,
      include: {
        course: { select: { id: true, code: true, title: true } },
        _count: { select: { students: true, attendanceRecords: true } },
      },
    });

    const classIds = assignedClasses.map((cohort) => cohort.id);
    const courseIds = assignedClasses.map((cohort) => cohort.courseId);

    const [pendingSubmissions, attendanceGroups, progressAggregate, upcomingSessions] =
      await Promise.all([
        classIds.length
          ? this.prisma.submission.findMany({
              where: {
                status: SubmissionStatus.SUBMITTED,
                assignment: { courseId: { in: courseIds } },
              },
              orderBy: { submittedAt: "asc" },
              take: 6,
              include: {
                assignment: { select: { title: true } },
                student: { select: { fullName: true } },
              },
            })
          : [],
        classIds.length
          ? this.prisma.attendanceRecord.groupBy({
              by: ["status"],
              where: { classId: { in: classIds } },
              _count: { status: true },
            })
          : [],
        classIds.length
          ? this.prisma.enrollment.aggregate({
              where: { classId: { in: classIds } },
              _avg: { progress: true },
              _count: { _all: true },
            })
          : { _avg: { progress: 0 }, _count: { _all: 0 } },
        this.prisma.class.findMany({
          where: { trainerId: userId, startsAt: { gte: today } },
          orderBy: { startsAt: "asc" },
          take: 4,
          select: {
            id: true,
            name: true,
            startsAt: true,
            endsAt: true,
            course: { select: { code: true, title: true } },
            _count: { select: { students: true } },
          },
        }),
      ]);

    const learnerProgress = {
      averageProgress: Math.round(progressAggregate._avg.progress ?? 0),
      totalEnrollments: progressAggregate._count._all,
    };

    return {
      ...base,
      assignedClasses: assignedClasses.map((cohort) => ({
        id: cohort.id,
        name: cohort.name,
        courseCode: cohort.course.code,
        courseTitle: cohort.course.title,
        startsAt: cohort.startsAt,
        endsAt: cohort.endsAt,
        students: cohort._count.students,
        attendanceRecords: cohort._count.attendanceRecords,
      })),
      attendanceSummary: attendanceGroups.map((group) => ({
        status: group.status,
        count: group._count.status,
      })),
      learnerProgress,
      upcomingSessions: upcomingSessions.map((session) => ({
        id: session.id,
        title: session.name,
        courseCode: session.course.code,
        courseTitle: session.course.title,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        students: session._count.students,
      })),
      recentSubmissions: pendingSubmissions.map((submission) => ({
        id: submission.id,
        assignmentTitle: submission.assignment.title,
        studentName: submission.student.fullName,
        submittedAt: submission.submittedAt.toISOString(),
        status: submission.status,
      })),
      recentUsers: [],
      activeCompetitions: [],
      paymentSummary: {
        provider: "paystack",
        paidLearners: 0,
        pendingPayments: 0,
        overduePayments: 0,
        revenueNote: "Revenue data not available for instructor dashboard.",
      },
      platformHealth: {
        uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
        dbConnected: true,
        apiHealthy: true,
      },
    };
  }

  // ─── Coordinator stats ────────────────────────────────────────────────────

  private async getCoordinatorStats(userId: string, role: UserRole) {
    if (role === UserRole.OLYMPIAD_COORDINATOR || role === UserRole.JUDGE) {
      const [competitions, participants, liveComps] = await Promise.all([
        this.prisma.competition.count(),
        this.prisma.competitionParticipant.count(),
        this.prisma.competition.count({ where: { status: "LIVE" } }),
      ]);

      return {
        role: "olympiad",
        stats: [
          { label: "Competitions", value: String(competitions), note: "Total created", key: "competitions" },
          { label: "Participants", value: String(participants), note: "Across all competitions", key: "participants" },
          { label: "Live now", value: String(liveComps), note: "Currently running", key: "live" },
          { label: "Best rank", value: "—", note: "Check leaderboard", key: "rank" },
        ],
      };
    }

    // School / Corporate coordinator
    const [users, courses] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count({ where: { isArchived: false } }),
    ]);

    return {
      role: "coordinator",
      stats: [
        { label: "Platform users", value: String(users), note: "Active members", key: "users" },
        { label: "Available courses", value: String(courses), note: "Enroll your team", key: "courses" },
        { label: "Competitions joined", value: "—", note: "Check arena", key: "competitions" },
        { label: "Certificates", value: "—", note: "View in certificates", key: "certificates" },
      ],
    };
  }

  private getFallbackStats() {
    return {
      role: "guest",
      stats: [
        { label: "Platform users", value: "—", note: "Join the community", key: "users" },
        { label: "Courses", value: "—", note: "Browse the catalogue", key: "courses" },
        { label: "Competitions", value: "—", note: "Enter the arena", key: "competitions" },
        { label: "Certificates", value: "—", note: "Earn recognition", key: "certificates" },
      ],
    };
  }
}

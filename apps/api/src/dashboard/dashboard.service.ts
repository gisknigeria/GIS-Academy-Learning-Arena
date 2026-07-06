import { Injectable } from "@nestjs/common";
import { AttemptStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const LEARNER_ROLES: UserRole[] = [UserRole.STUDENT, UserRole.ALUMNI, UserRole.GUEST];
const STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, role: UserRole) {
    if (LEARNER_ROLES.includes(role)) {
      return this.getLearnerStats(userId);
    }

    if (STAFF_ROLES.includes(role)) {
      return this.getStaffStats(role);
    }

    // Coordinators + Olympiad roles
    return this.getCoordinatorStats(userId, role);
  }

  // ─── Learner stats ────────────────────────────────────────────────────────

  private async getLearnerStats(userId: string) {
    const [enrollments, completedLessons, bestRank, competitionCount] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
        select: { progress: true, enrolledAt: true },
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

    return {
      role: "learner",
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
    };
  }

  // ─── Staff stats ──────────────────────────────────────────────────────────

  private async getStaffStats(role: UserRole) {
    if (role === UserRole.SUPER_ADMIN) {
      const [users, courses, pendingUsers, certificates] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.course.count({ where: { isArchived: false } }),
        this.prisma.user.count({ where: { status: "PENDING" } }),
        this.prisma.certificate.count(),
      ]);

      return {
        role: "super_admin",
        stats: [
          { label: "Total users", value: String(users), note: "Platform-wide", key: "users" },
          { label: "Active courses", value: String(courses), note: "Published", key: "courses" },
          { label: "Pending approvals", value: String(pendingUsers), note: "Accounts awaiting review", key: "pending" },
          { label: "Certificates issued", value: String(certificates), note: "All time", key: "certificates" },
        ],
      };
    }

    if (role === UserRole.ADMIN || role === UserRole.TRAINING_MANAGER) {
      const [learners, courses, pendingSubmissions, certificates] = await Promise.all([
        this.prisma.user.count({
          where: { role: { in: [UserRole.STUDENT, UserRole.ALUMNI] } },
        }),
        this.prisma.course.count({ where: { isArchived: false } }),
        this.prisma.submission.count({ where: { status: "SUBMITTED" } }),
        this.prisma.certificate.count(),
      ]);

      return {
        role: "admin",
        stats: [
          { label: "Active learners", value: String(learners), note: "Students & alumni", key: "learners" },
          { label: "Courses", value: String(courses), note: "Published and active", key: "courses" },
          { label: "Submissions", value: String(pendingSubmissions), note: "Awaiting grading", key: "submissions" },
          { label: "Certificates issued", value: String(certificates), note: "All time", key: "certificates" },
        ],
      };
    }

    if (role === UserRole.TRAINER || role === UserRole.EXAMINER) {
      const [pendingSubmissions, attempts, classes, certificates] = await Promise.all([
        this.prisma.submission.count({ where: { status: "SUBMITTED" } }),
        this.prisma.attempt.count({ where: { status: AttemptStatus.SUBMITTED } }),
        this.prisma.class.count(),
        this.prisma.certificate.count(),
      ]);

      return {
        role: "trainer",
        stats: [
          { label: "Pending submissions", value: String(pendingSubmissions), note: "Awaiting your review", key: "submissions" },
          { label: "Assessment attempts", value: String(attempts), note: "Total submitted", key: "attempts" },
          { label: "Active classes", value: String(classes), note: "All cohorts", key: "classes" },
          { label: "Certificates issued", value: String(certificates), note: "All time", key: "certificates" },
        ],
      };
    }

    return this.getFallbackStats();
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

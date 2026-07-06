import { Injectable } from "@nestjs/common";
import { AttemptStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const LEARNER_ROLES: UserRole[] = [UserRole.STUDENT, UserRole.ALUMNI, UserRole.GUEST];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      users,
      activeUsers,
      learners,
      paidLearners,
      courses,
      lessons,
      lessonCompletions,
      enrollments,
      enrollmentAverage,
      assignments,
      submissions,
      assessments,
      submittedAttempts,
      competitions,
      participants,
      certificates,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.user.count({ where: { role: { in: LEARNER_ROLES } } }),
      this.prisma.user.count({ where: { role: { in: LEARNER_ROLES }, paymentStatus: "PAID" } }),
      this.prisma.course.count({ where: { isArchived: false } }),
      this.prisma.lesson.count(),
      this.prisma.lessonProgress.count(),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.aggregate({ _avg: { progress: true } }),
      this.prisma.assignment.count(),
      this.prisma.submission.count(),
      this.prisma.assessment.count(),
      this.prisma.attempt.count({ where: { status: AttemptStatus.SUBMITTED } }),
      this.prisma.competition.count(),
      this.prisma.competitionParticipant.count(),
      this.prisma.certificate.count(),
    ]);

    return {
      users,
      activeUsers,
      learners,
      paidLearners,
      courses,
      lessons,
      lessonCompletions,
      enrollments,
      averageProgress: Math.round(enrollmentAverage._avg.progress ?? 0),
      assignments,
      submissions,
      assessments,
      submittedAttempts,
      competitions,
      participants,
      certificates,
    };
  }

  async getCourses() {
    const [courses, progressGroups] = await Promise.all([
      this.prisma.course.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              assignments: true,
              assessments: true,
            },
          },
        },
      }),
      this.prisma.enrollment.groupBy({
        by: ["courseId"],
        _avg: { progress: true },
      }),
    ]);

    const progressByCourse = new Map(
      progressGroups.map((group) => [group.courseId, Math.round(group._avg.progress ?? 0)]),
    );

    return courses.map((course) => ({
      id: course.id,
      code: course.code,
      title: course.title,
      deliveryMode: course.deliveryMode,
      requiresPayment: course.requiresPayment,
      lessons: course._count.lessons,
      enrollments: course._count.enrollments,
      assignments: course._count.assignments,
      assessments: course._count.assessments,
      averageProgress: progressByCourse.get(course.id) ?? 0,
    }));
  }

  async getLearners() {
    const learners = await this.prisma.user.findMany({
      where: { role: { in: LEARNER_ROLES } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        enrollments: {
          select: { progress: true },
        },
        _count: {
          select: {
            lessonProgress: true,
            attempts: true,
            competitionParticipations: true,
          },
        },
      },
    });

    return learners.map((learner) => {
      const enrollmentCount = learner.enrollments.length;
      const averageProgress =
        enrollmentCount === 0
          ? 0
          : Math.round(
              learner.enrollments.reduce((total, enrollment) => total + enrollment.progress, 0) /
                enrollmentCount,
            );

      const { enrollments: _enrollments, _count, ...learnerData } = learner;

      return {
        ...learnerData,
        enrollments: enrollmentCount,
        averageProgress,
        completedLessons: _count.lessonProgress,
        assessmentAttempts: _count.attempts,
        competitionsJoined: _count.competitionParticipations,
      };
    });
  }

  async getCompetitions() {
    const [competitions, topParticipants] = await Promise.all([
      this.prisma.competition.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 30,
        include: {
          assessment: { select: { id: true, title: true } },
          _count: {
            select: {
              participants: true,
              competitionAttempts: true,
            },
          },
        },
      }),
      this.prisma.competitionParticipant.findMany({
        orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
        take: 10,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          competition: { select: { id: true, title: true, mode: true } },
        },
      }),
    ]);

    return {
      competitions: competitions.map((competition) => ({
        id: competition.id,
        title: competition.title,
        mode: competition.mode,
        status: competition.status,
        durationMin: competition.durationMin,
        assessment: competition.assessment,
        participants: competition._count.participants,
        attempts: competition._count.competitionAttempts,
        startsAt: competition.startsAt,
      })),
      topParticipants: topParticipants.map((participant, index) => ({
        rank: index + 1,
        score: participant.score,
        competition: participant.competition,
        user: participant.user,
      })),
    };
  }

  async getCertificates() {
    const certificates = await this.prisma.certificate.findMany({
      orderBy: { issuedAt: "desc" },
      take: 25,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: certificates.map((certificate) => certificate.userId) } },
      select: { id: true, fullName: true, email: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return {
      total: await this.prisma.certificate.count(),
      recent: certificates.map((certificate) => ({
        ...certificate,
        user: usersById.get(certificate.userId) ?? null,
      })),
    };
  }
}

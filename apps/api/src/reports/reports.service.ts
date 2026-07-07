import { Injectable } from "@nestjs/common";
import { AttemptStatus, CompetitionMode, CompetitionStatus, PaymentStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueryReportsDto } from "./dto/query-reports.dto";
import { ExportReportsDto } from "./dto/export-reports.dto";
import PDFDocument from "pdfkit";

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

  async getCourses(query?: QueryReportsDto) {
    const where: any = { isArchived: false };
    if (query?.from || query?.to) {
      where.createdAt = this.buildDateFilter(query.from, query.to);
    }
    if (query?.courseId) {
      where.id = query.courseId;
    }

    const [courses, progressGroups] = await Promise.all([
      this.prisma.course.findMany({
        where,
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
        where: query?.classId ? { classId: query.classId } : undefined,
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

  async getLearners(query?: QueryReportsDto) {
    const where: any = { role: { in: LEARNER_ROLES } };
    if (query?.from || query?.to) {
      where.createdAt = this.buildDateFilter(query.from, query.to);
    }
    if (query?.role) {
      where.role = query.role;
    }
    if (query?.classId) {
      where.enrollments = { some: { classId: query.classId } };
    }

    const learners = await this.prisma.user.findMany({
      where,
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

  async getCompetitions(query?: QueryReportsDto) {
    const where: any = {};
    if (query?.from || query?.to) {
      where.startsAt = this.buildDateFilter(query.from, query.to);
    }
    if (query?.competitionId) {
      where.id = query.competitionId;
    }

    const [competitions, topParticipants] = await Promise.all([
      this.prisma.competition.findMany({
        where,
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
        where: query?.competitionId ? { competitionId: query.competitionId } : undefined,
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

  async getCertificates(query?: QueryReportsDto) {
    const where: any = {};
    if (query?.from || query?.to) {
      where.issuedAt = this.buildDateFilter(query.from, query.to);
    }
    if (query?.courseId) {
      where.courseId = query.courseId;
    }
    if (query?.role) {
      where.user = { role: query.role };
    }

    const certificates = await this.prisma.certificate.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      take: 25,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: certificates.map((certificate) => certificate.userId) } },
      select: { id: true, fullName: true, email: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return {
      total: await this.prisma.certificate.count({ where }),
      recent: certificates.map((certificate) => ({
        ...certificate,
        user: usersById.get(certificate.userId) ?? null,
      })),
    };
  }

  async getPayments(query: QueryReportsDto) {
    const where: any = {};
    if (query.from || query.to) {
      where.enrolledAt = this.buildDateFilter(query.from, query.to);
    }
    if (query.courseId) {
      where.courseId = query.courseId;
    }
    if (query.classId) {
      where.classId = query.classId;
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        ...where,
        user: query.role ? { role: query.role } : undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, paymentStatus: true } },
        course: { select: { id: true, title: true, requiresPayment: true } },
      },
      orderBy: { enrolledAt: "desc" },
      take: 200,
    });

    return enrollments.map((enrollment) => ({
      userId: enrollment.user.id,
      fullName: enrollment.user.fullName,
      email: enrollment.user.email,
      paymentStatus: enrollment.user.paymentStatus,
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      amountDue: enrollment.course.requiresPayment ? null : null,
      dueDate: null,
    }));
  }

  async getTeams(query: QueryReportsDto) {
    const teams = await this.prisma.team.findMany({
      where: query.competitionId ? { competitionId: query.competitionId } : undefined,
      include: {
        competition: { select: { id: true, title: true } },
        members: { select: { id: true } },
      },
      orderBy: { score: "desc" },
      take: 100,
    });

    return teams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      competitionId: team.competition.id,
      competitionTitle: team.competition.title,
      members: team.members.length,
      score: team.score,
      rank: null,
    }));
  }

  async exportReport(query: ExportReportsDto) {
    let rows: any[] = [];
    let filename = `${query.reportType}-report.${query.format}`;
    let title = `${query.reportType.replace(/\b\w/g, (m) => m.toUpperCase())} Report`;

    switch (query.reportType) {
      case "overview": {
        const overview = await this.getOverview();
        rows = [overview];
        break;
      }
      case "courses": {
        rows = await this.getCourses(query);
        break;
      }
      case "learners": {
        rows = await this.getLearners(query);
        break;
      }
      case "competitions": {
        const report = await this.getCompetitions(query);
        rows = report.competitions;
        break;
      }
      case "certificates": {
        rows = (await this.getCertificates(query)).recent;
        break;
      }
      case "payments": {
        rows = await this.getPayments(query);
        break;
      }
      case "teams": {
        rows = await this.getTeams(query);
        break;
      }
      default:
        rows = [];
    }

    if (query.format === "csv") {
      return {
        buffer: Buffer.from(this.buildCsv(rows), "utf-8"),
        filename,
        type: "text/csv",
      };
    }

    return {
      buffer: await this.buildPdf(title, rows),
      filename,
      type: "application/pdf",
    };
  }

  private buildDateFilter(from?: string, to?: string) {
    const filter: any = {};
    if (from) filter.gte = new Date(from);
    if (to) filter.lte = new Date(to);
    return filter;
  }

  private buildCsv(rows: any[]) {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    };
    const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
    return csv;
  }

  private buildPdf(title: string, rows: any[]) {
    return new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers: Uint8Array[] = [];
      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc.fontSize(18).text(title, { underline: true });
      doc.moveDown();

      if (rows.length === 0) {
        doc.fontSize(12).text("No data available.");
        doc.end();
        return;
      }

      const headers = Object.keys(rows[0]);
      doc.fontSize(10);
      headers.forEach((header) => {
        doc.text(header, { continued: true, width: 90 });
      });
      doc.moveDown(0.5);

      rows.slice(0, 40).forEach((row) => {
        headers.forEach((header) => {
          let value = row[header];
          if (value && typeof value === "object") {
            value = JSON.stringify(value);
          }
          doc.text(String(value ?? ""), { continued: true, width: 90 });
        });
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}

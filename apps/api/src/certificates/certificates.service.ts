import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Certificate } from "@prisma/client";
import { UserRole } from "@prisma/client";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";
import { IssueCertificateDto } from "./dto/issue-certificate.dto";
import { EmailService } from "../email/email.service";
import { AccessControlService } from "../auth/access-control.service";

const ISSUE_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
  UserRole.JUDGE,
  UserRole.OLYMPIAD_COORDINATOR,
];

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly accessControl: AccessControlService,
  ) {}

  async listMine(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
    });
  }

  async listAll() {
    const certificates = await this.prisma.certificate.findMany({
      orderBy: { issuedAt: "desc" },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: certificates.map((certificate) => certificate.userId) } },
      select: { id: true, fullName: true, email: true },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return certificates.map((certificate) => ({
      ...certificate,
      user: usersById.get(certificate.userId) ?? null,
    }));
  }

  async issue(dto: IssueCertificateDto) {
    return this.createCertificate({
      userId: dto.userId,
      title: dto.title,
      courseId: dto.courseId,
    });
  }

  async issueAutoCompletion(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        assessments: {
          where: { isPublished: true, scope: "COURSE_FINAL" },
          select: { id: true },
        },
        assignments: {
          where: {
            isPublished: true,
            kind: { in: ["MODULE_PRACTICAL", "CAPSTONE_PROJECT"] },
          },
          select: { id: true, moduleId: true, maxScore: true },
        },
        modules: { select: { id: true } },
      },
    });

    if (!course) {
      return null;
    }

    const access = await this.accessControl.checkCourseAccess(userId, courseId);
    if (!access.allowed) {
      return null;
    }

    const existing = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      await this.issueEligibleStageCertificates(userId, courseId);
      return existing;
    }

    const [totalLessons, completedLessons] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          lesson: { courseId },
        },
      }),
    ]);

    const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    if (totalLessons === 0 || progress < 100) {
      return null;
    }

    if (course.assessments.length === 0) {
      return null;
    }

    if (course.assessments.length > 0) {
      const passedAssessments = await this.prisma.attempt.findMany({
        where: {
          assessmentId: { in: course.assessments.map((assessment) => assessment.id) },
          userId,
          passed: true,
        },
        distinct: ["assessmentId"],
        select: { assessmentId: true },
      });

      if (passedAssessments.length < course.assessments.length) {
        return null;
      }
    }

    const practicalModuleIds = new Set(
      course.assignments.flatMap((assignment) => assignment.moduleId ? [assignment.moduleId] : []),
    );
    if (course.modules.length === 0 || course.modules.some((module) => !practicalModuleIds.has(module.id))) {
      return null;
    }

    if (course.assignments.length > 0) {
      const submissions = await this.prisma.submission.findMany({
        where: {
          studentId: userId,
          assignmentId: { in: course.assignments.map((assignment) => assignment.id) },
          status: "GRADED",
        },
        select: { assignmentId: true, score: true },
      });
      const passingSubmissions = new Set(
        submissions
          .filter((submission) => {
            const assignment = course.assignments.find((item) => item.id === submission.assignmentId);
            return assignment && (submission.score ?? 0) >= assignment.maxScore * 0.5;
          })
          .map((submission) => submission.assignmentId),
      );
      if (passingSubmissions.size < course.assignments.length) {
        return null;
      }
    }

    const certificate = await this.createCertificate({
      userId,
      title: `Certificate of Completion: ${course.title}`,
      courseId,
    });
    await this.issueEligibleStageCertificates(userId, courseId);
    return certificate;
  }

  async verify(verificationId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationId },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException("Certificate not found.");
    }

    const verificationUrl = this.getVerificationUrl(certificate.verificationId);
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { type: "image/png" });

    return {
      certificateNo: certificate.certificateNo,
      title: certificate.title,
      verificationId: certificate.verificationId,
      issuedAt: certificate.issuedAt,
      learner: certificate.user ? { fullName: certificate.user.fullName, email: certificate.user.email } : null,
      courseTitle: certificate.course?.title ?? null,
      qrCodeDataUrl,
    };
  }

  async getCertificatePdf(certificateId: string, requesterId: string, requesterRole: UserRole) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException("Certificate not found.");
    }

    if (certificate.userId !== requesterId && !ISSUE_ROLES.includes(requesterRole)) {
      throw new ForbiddenException("Not authorized to download this certificate.");
    }

    return this.createCertificatePdf(certificate);
  }

  private async createCertificate({
    userId,
    title,
    courseId,
    stageId,
  }: {
    userId: string;
    title: string;
    courseId?: string;
    stageId?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`User "${userId}" not found.`);
    }

    const certificate = await this.prisma.certificate.create({
      data: {
        userId: user.id,
        courseId,
        stageId,
        title,
        certificateNo: await this.createCertificateNumber(),
        verificationId: randomUUID(),
      },
    });

    try {
      await this.emailService.sendCertificateIssued(user.email, user.fullName, certificate.certificateNo, certificate.title);
    } catch {
      // Ignore email errors
    }

    return { ...certificate, user };
  }

  private async issueEligibleStageCertificates(userId: string, completedCourseId: string) {
    const stages = await this.prisma.learningStage.findMany({
      where: { courses: { some: { courseId: completedCourseId } } },
      include: {
        pathway: { include: { category: true } },
        courses: { where: { required: true }, select: { courseId: true } },
      },
    });

    for (const stage of stages) {
      const existing = await this.prisma.certificate.findFirst({ where: { userId, stageId: stage.id } });
      if (existing) continue;

      const requiredCourseIds = stage.courses.map((item) => item.courseId);
      const completed = await this.prisma.certificate.count({
        where: { userId, courseId: { in: requiredCourseIds } },
      });
      if (requiredCourseIds.length > 0 && completed === requiredCourseIds.length) {
        await this.createCertificate({
          userId,
          stageId: stage.id,
          title: `${stage.pathway.category.name} - ${stage.name} Stage Certificate`,
        });
      }
    }
  }

  private async createCertificatePdf(certificate: Certificate & { user: { fullName: string; email: string } | null; course: { title: string } | null }) {
    const verificationUrl = this.getVerificationUrl(certificate.verificationId);
    const qrBuffer = await QRCode.toBuffer(verificationUrl, { type: "png", width: 180 });

    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));

    const ended = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    doc.fontSize(10).fillColor("#475569").text("GIS Konsult Knowledge Hub", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(24).fillColor("#0f172a").text("Certificate of Completion", { align: "center", underline: true });
    doc.moveDown(2);

    doc.fontSize(12).fillColor("#475569").text("This is to certify that", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(28).fillColor("#0f172a").text(certificate.user?.fullName ?? "Learner", {
      align: "center",
      continued: false,
    });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#475569").text("has successfully completed", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(20).fillColor("#0f172a").text(certificate.title, { align: "center" });

    if (certificate.course?.title) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor("#475569").text(`Course: ${certificate.course.title}`, { align: "center" });
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor("#64748b").text(`Issued on ${certificate.issuedAt.toISOString().slice(0, 10)}`, {
      align: "center",
    });
    doc.moveDown(1);
    doc.fontSize(10).fillColor("#475569").text(`Certificate No. ${certificate.certificateNo}`, {
      align: "center",
    });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#475569").text(`Verification ID ${certificate.verificationId}`, {
      align: "center",
    });

    const currentY = doc.y + 24;
    doc.image(qrBuffer, doc.page.width / 2 - 90, currentY, { width: 180 });
    doc.moveDown(10);
    doc.fontSize(10).fillColor("#475569").text("Scan to verify this certificate", {
      align: "center",
    });

    doc.end();
    return ended;
  }

  private getVerificationUrl(verificationId: string) {
    return `${process.env.FRONTEND_URL ?? "https://example.com"}/verify/${verificationId}`;
  }

  private async createCertificateNumber() {
    const year = new Date().getFullYear();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
      const certificateNo = `GIS-${year}-${suffix}`;
      const existing = await this.prisma.certificate.findUnique({ where: { certificateNo } });

      if (!existing) {
        return certificateNo;
      }
    }

    return `GIS-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { IssueCertificateDto } from "./dto/issue-certificate.dto";
import { EmailService } from "../email/email.service";

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}

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
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(`User "${dto.userId}" not found.`);
    }

    const certificate = await this.prisma.certificate.create({
      data: {
        userId: user.id,
        title: dto.title,
        certificateNo: await this.createCertificateNumber(),
        verificationId: randomUUID(),
      },
    });

    // Notify the user by email (best-effort)
    try {
      await this.emailService.sendCertificateIssued(user.email, user.fullName, certificate.certificateNo, certificate.title);
    } catch (err) {
      // Ignore email errors
    }

    return { ...certificate, user };
  }

  async verify(verificationId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verificationId },
    });

    if (!certificate) {
      throw new NotFoundException("Certificate not found.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: certificate.userId },
      select: { fullName: true, email: true },
    });

    return {
      certificateNo: certificate.certificateNo,
      title: certificate.title,
      verificationId: certificate.verificationId,
      issuedAt: certificate.issuedAt,
      learner: user ? { fullName: user.fullName, email: user.email } : null,
    };
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

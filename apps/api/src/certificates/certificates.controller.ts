import { Body, Controller, Get, Param, Post, Req, StreamableFile, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { CertificatesService } from "./certificates.service";
import { IssueCertificateDto } from "./dto/issue-certificate.dto";

const ISSUE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
  UserRole.JUDGE,
  UserRole.OLYMPIAD_COORDINATOR,
];

@Controller("certificates")
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get("verify/:verificationId")
  verify(@Param("verificationId") verificationId: string) {
    return this.certificatesService.verify(verificationId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("mine")
  listMine(@Req() req: AuthenticatedRequest) {
    return this.certificatesService.listMine(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ISSUE_ROLES)
  @Get()
  listAll() {
    return this.certificatesService.listAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ISSUE_ROLES)
  @Post("issue")
  issue(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issue(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(":id/pdf")
  async downloadPdf(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const buffer = await this.certificatesService.getCertificatePdf(id, req.user.sub, req.user.role);
    return new StreamableFile(buffer, {
      type: "application/pdf",
      disposition: `attachment; filename="certificate-${id}.pdf"`,
    });
  }
}

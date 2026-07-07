import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { CertificatesController } from "./certificates.controller";
import { CertificatesService } from "./certificates.service";

@Module({
  imports: [AuthModule, PrismaModule, EmailModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}

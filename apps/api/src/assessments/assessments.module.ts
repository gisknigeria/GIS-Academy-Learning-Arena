import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CertificatesModule } from "../certificates/certificates.module";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";

@Module({
  imports: [AuthModule, CertificatesModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}

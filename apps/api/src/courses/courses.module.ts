import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CertificatesModule } from "../certificates/certificates.module";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  imports: [AuthModule, CertificatesModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}

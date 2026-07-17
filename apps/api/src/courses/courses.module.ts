import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CertificatesModule } from "../certificates/certificates.module";
import { CurriculumModule } from "../curriculum/curriculum.module";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  imports: [AuthModule, CertificatesModule, CurriculumModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}

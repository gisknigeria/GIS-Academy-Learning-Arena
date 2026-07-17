import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CurriculumController } from "./curriculum.controller";
import { CurriculumService } from "./curriculum.service";

@Module({
  imports: [AuthModule],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}

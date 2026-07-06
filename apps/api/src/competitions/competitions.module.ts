import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { CompetitionsController } from "./competitions.controller";
import { CompetitionsService } from "./competitions.service";

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [CompetitionsController],
  providers: [CompetitionsService],
})
export class CompetitionsModule {}

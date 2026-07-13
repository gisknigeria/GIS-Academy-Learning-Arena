import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { LiveSessionsGateway } from "./live-sessions.gateway";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ClassesController],
  providers: [ClassesService, LiveSessionsGateway],
})
export class ClassesModule {}

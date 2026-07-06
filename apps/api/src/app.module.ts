import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AssignmentsModule } from "./assignments/assignments.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { AuthModule } from "./auth/auth.module";
import { CertificatesModule } from "./certificates/certificates.module";
import { ClassesModule } from "./classes/classes.module";
import { CompetitionsModule } from "./competitions/competitions.module";
import { CoursesModule } from "./courses/courses.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EmailModule } from "./email/email.module";
import { LearnModule } from "./learn/learn.module";
import { PlatformModule } from "./platform/platform.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", ".env.local"],
      isGlobal: true,
    }),
    PrismaModule,
    EmailModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    DashboardModule,
    ClassesModule,
    AssignmentsModule,
    AssessmentsModule,
    CompetitionsModule,
    CertificatesModule,
    PlatformModule,
    LearnModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

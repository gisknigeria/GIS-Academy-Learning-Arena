import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ReportsService } from "./reports.service";

const REPORT_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.CORPORATE_CLIENT,
  UserRole.SCHOOL_COORDINATOR,
  UserRole.OLYMPIAD_COORDINATOR,
  UserRole.EXAMINER,
  UserRole.JUDGE,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...REPORT_ROLES)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("overview")
  overview() {
    return this.reportsService.getOverview();
  }

  @Get("courses")
  courses() {
    return this.reportsService.getCourses();
  }

  @Get("learners")
  learners() {
    return this.reportsService.getLearners();
  }

  @Get("competitions")
  competitions() {
    return this.reportsService.getCompetitions();
  }

  @Get("certificates")
  certificates() {
    return this.reportsService.getCertificates();
  }
}

import { Controller, Get, Query, StreamableFile, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ReportsService } from "./reports.service";
import { QueryReportsDto } from "./dto/query-reports.dto";
import { ExportReportsDto } from "./dto/export-reports.dto";

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
  certificates(@Query() query: QueryReportsDto) {
    return this.reportsService.getCertificates(query);
  }

  @Get("payments")
  payments(@Query() query: QueryReportsDto) {
    return this.reportsService.getPayments(query);
  }

  @Get("teams")
  teams(@Query() query: QueryReportsDto) {
    return this.reportsService.getTeams(query);
  }

  @Get("export")
  async export(@Query() query: ExportReportsDto) {
    const { buffer, filename, type } = await this.reportsService.exportReport(query);
    return new StreamableFile(buffer, {
      type,
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

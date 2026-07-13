import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { DashboardService } from "./dashboard.service";

@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/stats
   * Role-aware stats:
   *   - Learners get personal progress, completions, challenge points, competition rank
   *   - Admin/staff get platform-wide counters
   */
  @Get("stats")
  getStats(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getStats(req.user.sub, req.user.role);
  }
}

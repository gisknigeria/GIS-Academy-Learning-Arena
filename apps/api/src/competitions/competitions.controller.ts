import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { CompetitionStatus, UserRole } from "@prisma/client";
import { isPaymentExempt } from "../auth/access-control.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { CompetitionsService } from "./competitions.service";
import { CreateCompetitionDto } from "./dto/create-competition.dto";
import { CreateTeamDto } from "./dto/create-team.dto";
import { JoinCompetitionDto } from "./dto/join-competition.dto";
import { JoinTeamDto } from "./dto/join-team.dto";
import { SubmitCompetitionAttemptDto } from "./dto/submit-competition-attempt.dto";
import { UpdateCompetitionDto } from "./dto/update-competition.dto";

const STAFF_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
  UserRole.JUDGE,
  UserRole.OLYMPIAD_COORDINATOR,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("competitions")
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  /** POST /api/competitions */
  @Roles(...STAFF_ROLES)
  @Post()
  create(@Body() dto: CreateCompetitionDto) {
    return this.competitionsService.create(dto);
  }

  /**
   * GET /api/competitions
   * Staff with ?all=true get DRAFT + COMPLETED + ARCHIVED too.
   * Everyone else sees OPEN + LIVE.
   */
  @Get()
  findAll(@Query("all") all: string, @Req() req: AuthenticatedRequest) {
    const isStaff = isPaymentExempt(req.user.role);
    return this.competitionsService.findAll(isStaff && all === "true");
  }

  /** GET /api/competitions/mine — competitions I've joined */
  @Get("mine")
  getMyParticipations(@Req() req: AuthenticatedRequest) {
    return this.competitionsService.getMyParticipations(req.user.sub);
  }

  /** GET /api/competitions/:id/teams */
  @Get(":id/teams")
  async listTeams(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    const teams = await this.competitionsService.listTeams(id);
    const isAdmin = isPaymentExempt(req.user.role);

    return teams.map((t) => {
      const out = { ...t } as any;
      if (!isAdmin && out.createdById !== req.user.sub) {
        // hide sensitive join code
        delete out.code;
      }
      return out;
    });
  }

  /** POST /api/competitions/:id/teams */
  @Post(":id/teams")
  createTeam(
    @Param("id") id: string,
    @Body() dto: CreateTeamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.competitionsService.createTeam(id, req.user.sub, dto);
  }

  /** POST /api/competitions/:id/teams/:teamId/invite */
  @Post(":id/teams/:teamId/invite")
  async createTeamInvite(
    @Param("id") id: string,
    @Param("teamId") teamId: string,
    @Body("expiresHours") expiresHours: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = isPaymentExempt(req.user.role);
    const invite = await this.competitionsService.createTeamInvite(id, teamId, req.user.sub, {
      expiresHours,
      isAdmin,
    });
    return invite;
  }

  /** POST /api/competitions/invitations/:token/join */
  @Post("invitations/:token/join")
  async acceptInvite(@Param("token") token: string, @Req() req: AuthenticatedRequest) {
    return this.competitionsService.acceptTeamInvite(token, req.user.sub);
  }

  /** PATCH /api/competitions/:id/teams/:teamId/lock */
  @Patch(":id/teams/:teamId/lock")
  async setTeamLock(
    @Param("id") id: string,
    @Param("teamId") teamId: string,
    @Body() body: { locked: boolean; maxMembers?: number },
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = isPaymentExempt(req.user.role);
    return this.competitionsService.setTeamLock(id, teamId, req.user.sub, body.locked, body.maxMembers, isAdmin);
  }

  /** PATCH /api/competitions/:id/teams/:teamId/captain */
  @Patch(":id/teams/:teamId/captain")
  async setTeamCaptain(
    @Param("id") id: string,
    @Param("teamId") teamId: string,
    @Body("captainId") captainId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const isAdmin = isPaymentExempt(req.user.role);
    return this.competitionsService.setTeamCaptain(id, teamId, captainId, req.user.sub, isAdmin);
  }

  /** POST /api/competitions/:id/teams/:teamId/move-member */
  @Roles(...STAFF_ROLES)
  @Post(":id/teams/:teamId/move-member")
  async moveMember(
    @Param("id") id: string,
    @Param("teamId") teamId: string,
    @Body("userId") userId: string,
  ) {
    return this.competitionsService.moveMember(id, userId, teamId);
  }

  /** GET /api/competitions/:id/teams/:teamId/members */
  @Get(":id/teams/:teamId/members")
  async getTeamMembers(@Param("id") id: string, @Param("teamId") teamId: string) {
    return this.competitionsService.getTeamMembers(id, teamId);
  }

  /** POST /api/competitions/:id/teams/:teamId/join */
  @Post(":id/teams/:teamId/join")
  joinTeam(
    @Param("id") id: string,
    @Param("teamId") teamId: string,
    @Body() dto: JoinTeamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.competitionsService.joinTeam(id, teamId, req.user.sub, dto);
  }

  /** GET /api/competitions/:id */
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.competitionsService.findOne(id);
  }

  /** PATCH /api/competitions/:id */
  @Roles(...STAFF_ROLES)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCompetitionDto) {
    return this.competitionsService.update(id, dto);
  }

  /** DELETE /api/competitions/:id */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OLYMPIAD_COORDINATOR)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.competitionsService.remove(id);
  }

  /** PATCH /api/competitions/:id/status — set OPEN / LIVE / COMPLETED etc. */
  @Roles(...STAFF_ROLES)
  @Patch(":id/status")
  setStatus(
    @Param("id") id: string,
    @Body("status") status: CompetitionStatus,
  ) {
    return this.competitionsService.setStatus(id, status);
  }

  /** POST /api/competitions/:id/join */
  @Post(":id/join")
  join(
    @Param("id") id: string,
    @Body() dto: JoinCompetitionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.competitionsService.join(id, req.user.sub, dto);
  }

  /** POST /api/competitions/:id/attempt — start or resume */
  @Post(":id/attempt")
  startAttempt(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    return this.competitionsService.startAttempt(id, req.user.sub);
  }

  /** POST /api/competitions/:id/attempts/:attemptId/submit */
  @Post(":id/attempts/:attemptId/submit")
  submitAttempt(
    @Param("id") id: string,
    @Param("attemptId") attemptId: string,
    @Body() dto: SubmitCompetitionAttemptDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.competitionsService.submitAttempt(id, attemptId, req.user.sub, dto);
  }

  /** GET /api/competitions/:id/leaderboard */
  @Get(":id/leaderboard")
  getLeaderboard(@Param("id") id: string) {
    return this.competitionsService.getLeaderboard(id);
  }
}

import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { QueryUsersDto } from "./dto/query-users.dto";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UpdatePaymentStatusDto } from "./dto/update-payment-status.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UsersService } from "./users.service";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Own profile ──────────────────────────────────────────────────────────

  /**
   * GET /api/users/me
   * Returns the authenticated user's full profile (including UserProfile).
   */
  @Get("me")
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMyProfile(req.user.sub);
  }

  /**
   * PATCH /api/users/me
   * Update own name and phone.
   */
  @Patch("me")
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  /**
   * PATCH /api/users/me/password
   * Change own password (requires current password verification).
   */
  @Patch("me/password")
  async changeMyPassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  /**
   * PATCH /api/users/me/profile
   * Create or update own UserProfile (institution, country, profession, etc.)
   */
  @Patch("me/profile")
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  /**
   * GET /api/users
   * Paginated, searchable user list.
   * Supports: ?search=, ?role=, ?status=, ?paymentStatus=, ?page=, ?limit=
   */
  @Roles(...ADMIN_ROLES)
  @Get()
  list(@Query() query: QueryUsersDto) {
    return this.usersService.list(query);
  }

  /**
   * GET /api/users/:id/progress
   * Returns enrollment + lesson completion summary for a user.
   */
  @Roles(...ADMIN_ROLES)
  @Get(":id/progress")
  getUserProgress(@Param("id") id: string) {
    return this.usersService.getUserProgress(id);
  }

  /**
   * PATCH /api/users/:id/role
   * Change a user's role. SUPER_ADMIN can set any role; ADMIN cannot elevate to SUPER_ADMIN.
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(":id/role")
  updateRole(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateRole(id, dto.role, req.user.sub, req.user.role);
  }

  /**
   * PATCH /api/users/:id/payment-status
   * Change a user's payment status. Admin+ only.
   */
  @Roles(...ADMIN_ROLES)
  @Patch(":id/payment-status")
  updatePaymentStatus(@Param("id") id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.usersService.updatePaymentStatus(id, dto.paymentStatus);
  }

  /**
   * PATCH /api/users/:id/status
   * Suspend / activate a user. Admin+ only.
   */
  @Roles(...ADMIN_ROLES)
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateStatus(id, dto.status, req.user.sub);
  }
}

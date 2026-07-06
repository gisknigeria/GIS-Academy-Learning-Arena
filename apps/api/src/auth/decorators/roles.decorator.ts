import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";

export const ROLES_KEY = "roles";

/**
 * Attach required roles to a route handler or controller.
 * Used together with RolesGuard.
 *
 * @example
 * @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
 * @Get()
 * list() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

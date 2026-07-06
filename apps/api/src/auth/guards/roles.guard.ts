import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthTokenPayload } from "../types/authenticated-request";

type RequestWithUser = {
  user?: AuthTokenPayload;
};

/**
 * RolesGuard enforces role-based access control.
 *
 * Must be applied AFTER JwtAuthGuard so that request.user is already populated
 * with the verified token payload (sub, email, role).
 *
 * If no @Roles() decorator is present on the handler or controller, the guard
 * allows the request through — this makes it safe to apply globally or at the
 * controller level without accidentally blocking undecorated routes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() on this handler — nothing to enforce
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      // JwtAuthGuard should have caught this first, but guard against missing user
      throw new ForbiddenException("Authentication required.");
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(", ")}.`,
      );
    }

    return true;
  }
}

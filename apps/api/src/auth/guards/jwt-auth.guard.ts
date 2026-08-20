import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthTokenPayload } from "../types/authenticated-request";

type RequestWithAuth = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthTokenPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      if (payload.tokenType === "refresh") {
        throw new UnauthorizedException("A refresh token cannot be used to access this resource.");
      }
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired token.");
    }
  }

  private extractTokenFromHeader(request: RequestWithAuth): string | undefined {
    const authorization = request.headers.authorization;

    if (Array.isArray(authorization)) {
      return undefined;
    }

    const [type, token] = authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}

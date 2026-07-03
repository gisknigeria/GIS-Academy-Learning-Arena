import { UserRole } from "@prisma/client";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user: AuthTokenPayload;
};

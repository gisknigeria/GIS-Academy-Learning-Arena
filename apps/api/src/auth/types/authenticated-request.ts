import { PaymentStatus, UserRole } from "@prisma/client";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  paymentStatus: PaymentStatus;
};

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  user: AuthTokenPayload;
};

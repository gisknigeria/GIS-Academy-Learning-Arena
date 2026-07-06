export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TRAINING_MANAGER"
  | "TRAINER"
  | "STUDENT"
  | "CORPORATE_CLIENT"
  | "SCHOOL_COORDINATOR"
  | "OLYMPIAD_COORDINATOR"
  | "EXAMINER"
  | "JUDGE"
  | "GUEST"
  | "ALUMNI";

export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "OVERDUE" | "BLOCKED";

export type AuthUser = {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: UserRole;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  paymentStatus: PaymentStatus;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

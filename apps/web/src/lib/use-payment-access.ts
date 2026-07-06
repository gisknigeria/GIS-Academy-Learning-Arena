import type { PaymentStatus, UserRole } from "../types/auth";
import type { AccessStatus, Course } from "../types/course";

/**
 * Roles that are never subject to payment gating.
 * Must stay in sync with the backend PAYMENT_EXEMPT_ROLES list.
 */
const PAYMENT_EXEMPT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TRAINING_MANAGER",
  "TRAINER",
  "EXAMINER",
  "JUDGE",
];

function isPaymentExempt(role: UserRole): boolean {
  return PAYMENT_EXEMPT_ROLES.includes(role);
}

function resolvePaymentStatus(status: PaymentStatus): AccessStatus {
  switch (status) {
    case "PAID":
    case "NOT_REQUIRED":
      return { allowed: true };
    case "OVERDUE":
      return { allowed: false, reason: "account_overdue" };
    case "BLOCKED":
      return { allowed: false, reason: "account_blocked" };
    case "PENDING":
    default:
      return { allowed: false, reason: "payment_required" };
  }
}

/**
 * Pure client-side access check — no network call.
 *
 * Priority order:
 *  1. Use the `accessStatus` already embedded in the course object by the API
 *  2. Fall back to deriving it locally from user role + paymentStatus
 *
 * Returns { allowed: true } when:
 *  - The course is free (requiresPayment = false)
 *  - The user role is payment-exempt
 *  - The user's paymentStatus is PAID or NOT_REQUIRED
 */
export function getCourseAccess(
  course: Course,
  role: UserRole,
  paymentStatus: PaymentStatus,
): AccessStatus {
  // If the API already resolved access for this user, trust it
  if (course.accessStatus !== undefined) {
    return course.accessStatus;
  }

  // Free course — always open
  if (!course.requiresPayment) {
    return { allowed: true };
  }

  // Exempt roles — always open
  if (isPaymentExempt(role)) {
    return { allowed: true };
  }

  return resolvePaymentStatus(paymentStatus);
}

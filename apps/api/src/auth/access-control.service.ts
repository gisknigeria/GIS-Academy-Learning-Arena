import { Injectable } from "@nestjs/common";
import { PaymentStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: "payment_required" | "account_blocked" | "account_overdue" };

/**
 * Pure, stateless check — no DB needed.
 * Returns whether a given paymentStatus grants access to paid content.
 *
 * PAID           → allowed (explicit payment confirmed)
 * NOT_REQUIRED   → allowed (admin / trainer / non-student roles)
 * PENDING        → denied  (registered but not yet paid)
 * OVERDUE        → denied  (payment lapsed)
 * BLOCKED        → denied  (manually blocked by admin)
 */
export function canAccessPaidContent(paymentStatus: PaymentStatus): AccessResult {
  switch (paymentStatus) {
    case PaymentStatus.PAID:
    case PaymentStatus.NOT_REQUIRED:
      return { allowed: true };

    case PaymentStatus.OVERDUE:
      return { allowed: false, reason: "account_overdue" };

    case PaymentStatus.BLOCKED:
      return { allowed: false, reason: "account_blocked" };

    case PaymentStatus.PENDING:
    default:
      return { allowed: false, reason: "payment_required" };
  }
}

/**
 * Roles that are never subject to payment gating —
 * they always have full content access.
 */
const PAYMENT_EXEMPT_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.EXAMINER,
  UserRole.JUDGE,
];

export function isPaymentExempt(role: UserRole): boolean {
  return PAYMENT_EXEMPT_ROLES.includes(role);
}

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Full DB-backed access check for a specific user + course combination.
   * Handles:
   *  - Role-based exemptions (admins/trainers always get access)
   *  - Free courses (always accessible)
   *  - Paid courses gated by paymentStatus
   */
  async checkCourseAccess(userId: string, courseId: string): Promise<AccessResult> {
    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, paymentStatus: true },
      }),
      this.prisma.course.findUnique({
        where: { id: courseId },
        select: { requiresPayment: true, isArchived: true },
      }),
    ]);

    if (!user || !course) {
      return { allowed: false, reason: "payment_required" };
    }

    // Admins / trainers always get access
    if (isPaymentExempt(user.role)) {
      return { allowed: true };
    }

    // Free courses are always accessible
    if (!course.requiresPayment) {
      return { allowed: true };
    }

    // Paid course — check payment status
    return canAccessPaidContent(user.paymentStatus);
  }
}

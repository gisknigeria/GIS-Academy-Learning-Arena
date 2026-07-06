export type DeliveryMode = "E_LEARNING" | "ONSITE" | "LIVE_VIRTUAL" | "HYBRID";

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  E_LEARNING: "E-Learning",
  ONSITE: "Onsite",
  LIVE_VIRTUAL: "Live Virtual",
  HYBRID: "Hybrid",
};

export type AccessStatus =
  | { allowed: true }
  | { allowed: false; reason: "payment_required" | "account_blocked" | "account_overdue" };

export type Course = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  level?: number | null;
  deliveryMode: DeliveryMode;
  requiresPayment: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  accessStatus?: AccessStatus;
  _count?: {
    lessons: number;
    enrollments: number;
    classes?: number;
  };
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  summary?: string | null;
  order: number;
  videoUrl?: string | null;
  resourceUrl?: string | null;
  completed?: boolean;
  completedAt?: string | null;
};

export type CourseListResponse = {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateCoursePayload = {
  code: string;
  title: string;
  description?: string;
  level?: number;
  deliveryMode: DeliveryMode;
  requiresPayment?: boolean;
};

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

export type CreateLessonPayload = {
  title: string;
  summary?: string;
  order: number;
  videoUrl?: string;
  resourceUrl?: string;
};

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

export type CourseProgress = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
};

// ─── Access reason labels ─────────────────────────────────────────────────────

export const ACCESS_REASON_LABELS: Record<
  "payment_required" | "account_blocked" | "account_overdue",
  { title: string; body: string; cta: string }
> = {
  payment_required: {
    title: "Payment required",
    body: "Complete your payment to unlock this course and all paid content.",
    cta: "Pay now",
  },
  account_overdue: {
    title: "Payment overdue",
    body: "Your account has an overdue balance. Please settle it to regain access.",
    cta: "Resolve payment",
  },
  account_blocked: {
    title: "Account restricted",
    body: "Your account has been restricted. Contact support to restore access.",
    cta: "Contact support",
  },
};

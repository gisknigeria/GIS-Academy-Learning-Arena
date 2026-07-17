export type DeliveryMode = "E_LEARNING" | "ONSITE" | "LIVE_VIRTUAL" | "HYBRID";

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  E_LEARNING: "E-Learning",
  ONSITE: "Onsite",
  LIVE_VIRTUAL: "E-Learning",
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
  trainingCategory?: string | null;
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
  moduleId?: string | null;
  title: string;
  summary?: string | null;
  content?: string | null;
  order: number;
  videoUrl?: string | null;
  resourceUrl?: string | null;
  subtitleUrl?: string | null;
  slideUrl?: string | null;
  mapUrl?: string | null;
  attachments?: LessonAttachment[] | null;
  completed?: boolean;
  completedAt?: string | null;
  locked?: boolean;
  lockReason?: "trainer_locked" | "previous_lesson" | null;
};

export type LessonLibraryItem = Lesson & {
  course: Pick<Course, "id" | "code" | "title" | "deliveryMode">;
};

export type LessonAttachment = {
  name: string;
  url: string;
  type?: string;
};

export type LessonDiscussionUser = {
  id: string;
  fullName: string;
  role: string;
};

export type LessonDiscussion = {
  id: string;
  lessonId: string;
  authorId: string;
  question: string;
  answer?: string | null;
  answeredById?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author: LessonDiscussionUser;
  answeredBy?: LessonDiscussionUser | null;
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
  trainingCategory?: string;
  level?: number;
  deliveryMode: DeliveryMode;
  requiresPayment?: boolean;
};

export type UpdateCoursePayload = Partial<CreateCoursePayload>;

export type CreateLessonPayload = {
  moduleId?: string;
  title: string;
  summary?: string;
  content?: string;
  order: number;
  videoUrl?: string;
  resourceUrl?: string;
  subtitleUrl?: string;
  slideUrl?: string;
  mapUrl?: string;
  attachments?: LessonAttachment[];
};

export type UpdateLessonPayload = Partial<CreateLessonPayload>;

export type ImportLessonPayload = {
  sourceLessonId: string;
  moduleId?: string;
  order?: number;
};

export type CourseProgress = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  totalModules: number;
  completedPracticalModules: number;
  totalFinalAssessments: number;
  passedFinalAssessments: number;
  courseCompleted: boolean;
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

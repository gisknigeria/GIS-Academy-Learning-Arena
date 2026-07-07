import type { PaymentStatus, UserRole } from "./auth";
import type { CompetitionMode, CompetitionStatus } from "./competition";
import type { DeliveryMode } from "./course";

export type ReportsOverview = {
  users: number;
  activeUsers: number;
  learners: number;
  paidLearners: number;
  courses: number;
  lessons: number;
  lessonCompletions: number;
  enrollments: number;
  averageProgress: number;
  assignments: number;
  submissions: number;
  assessments: number;
  submittedAttempts: number;
  competitions: number;
  participants: number;
  certificates: number;
};

export type CourseReport = {
  id: string;
  code: string;
  title: string;
  deliveryMode: DeliveryMode;
  requiresPayment: boolean;
  lessons: number;
  enrollments: number;
  assignments: number;
  assessments: number;
  averageProgress: number;
};

export type LearnerReport = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  paymentStatus: PaymentStatus;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt: string;
  enrollments: number;
  averageProgress: number;
  completedLessons: number;
  assessmentAttempts: number;
  competitionsJoined: number;
};

export type CompetitionReports = {
  competitions: {
    id: string;
    title: string;
    mode: CompetitionMode;
    status: CompetitionStatus;
    durationMin: number;
    participants: number;
    attempts: number;
    startsAt?: string | null;
    assessment?: { id: string; title: string } | null;
  }[];
  topParticipants: {
    rank: number;
    score: number;
    competition: { id: string; title: string; mode: CompetitionMode };
    user: { id: string; fullName: string; email: string };
  }[];
};

export type CertificateReports = {
  total: number;
  recent: {
    id: string;
    certificateNo: string;
    title: string;
    verificationId: string;
    issuedAt: string;
    user: { id: string; fullName: string; email: string } | null;
  }[];
};

export type ReportFilters = {
  from?: string;
  to?: string;
  courseId?: string;
  classId?: string;
  role?: UserRole;
  competitionId?: string;
};

export type PaymentReport = {
  userId: string;
  fullName: string;
  email: string;
  paymentStatus: PaymentStatus;
  courseId?: string;
  courseTitle?: string;
  amountDue?: number | null;
  dueDate?: string | null;
};

export type TeamReport = {
  teamId: string;
  teamName: string;
  competitionId: string;
  competitionTitle: string;
  members: number;
  score: number;
  rank?: number | null;
};

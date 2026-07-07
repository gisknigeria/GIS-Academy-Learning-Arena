import { apiRequest } from "./api";

export type DashboardStat = {
  label: string;
  value: string;
  note: string;
  key: string;
};

export type DashboardStats = {
  role: string;
  stats: DashboardStat[];
};

export type RecentUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

export type CompetitionSummary = {
  id: string;
  title: string;
  status: string;
  mode: string;
  startsAt?: string | null;
  endsAt?: string | null;
  participants: number;
};

export type AssignedClassSummary = {
  id: string;
  name: string;
  courseCode: string;
  courseTitle: string;
  startsAt?: string | null;
  endsAt?: string | null;
  students: number;
  attendanceRecords: number;
};

export type AttendanceSummary = {
  status: string;
  count: number;
};

export type LearnerProgressSummary = {
  averageProgress: number;
  totalEnrollments: number;
};

export type UpcomingSessionSummary = {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  startsAt?: string | null;
  endsAt?: string | null;
  students: number;
};

export type PaymentSummary = {
  provider: string;
  paidLearners: number;
  pendingPayments: number;
  overduePayments: number;
  revenueNote: string;
};

export type DashboardPublicStats = {
  role: string;
  stats: DashboardStat[];
  recentUsers: RecentUser[];
  recentSubmissions: { id: string; assignmentTitle: string; studentName: string; submittedAt: string; status: string }[];
  activeCompetitions: CompetitionSummary[];
  assignedClasses: AssignedClassSummary[];
  attendanceSummary: AttendanceSummary[];
  learnerProgress: LearnerProgressSummary;
  upcomingSessions: UpcomingSessionSummary[];
  paymentSummary: PaymentSummary;
  platformHealth: { uptime: string; dbConnected: boolean; apiHealthy: boolean };
  // Student-specific
  enrolledCourses?: { courseId: string; code: string; title: string; progress: number; enrolledAt: string }[];
  nextLesson?: { id: string; title: string; courseId: string; order: number } | null;
  pendingAssignments?: { id: string; title: string; dueDate?: string | null; course: { id: string; code: string; title: string } }[];
  upcomingCompetitions?: CompetitionSummary[];
  certificates?: { id: string; title: string; issuedAt: string; course?: { id: string; code: string; title: string } | null }[];
  playerStats?: { xp: number; points: number; streak: number; level: number };
};

export const dashboardApi = {
  getStats(token: string): Promise<DashboardPublicStats> {
    return apiRequest<DashboardPublicStats>("/dashboard/stats", { token });
  },
};

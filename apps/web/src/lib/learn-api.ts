import { apiRequest } from "./api";
import type { DeliveryMode } from "../types/course";

// ─── Feed types ───────────────────────────────────────────────────────────────

export type EnrolledCourse = {
  enrollmentId: string;
  courseId: string;
  code: string;
  title: string;
  description?: string | null;
  deliveryMode: DeliveryMode;
  requiresPayment: boolean;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  enrolledAt: string;
  nextLesson: { id: string; title: string; order: number } | null;
};

export type PendingAssignment = {
  assignmentId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  maxScore: number;
  submission: {
    id: string;
    status: string;
    score?: number | null;
    submittedAt: string;
    gradedAt?: string | null;
  } | null;
  isPending: boolean;
};

export type FeedAssessment = {
  assessmentId: string;
  title: string;
  description?: string | null;
  durationMin: number;
  passMark: number;
  questionCount: number;
  course?: { id: string; code: string; title: string } | null;
  attempted: boolean;
  passed?: boolean | null;
  percentage?: number | null;
  latestAttemptId?: string | null;
};

export type UpcomingClass = {
  id: string;
  name: string;
  mode: DeliveryMode;
  startsAt?: string | null;
  endsAt?: string | null;
  course: { id: string; code: string; title: string };
};

export type UpcomingLiveSession = {
  id: string;
  classId: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  status: string;
  meetingUrl?: string | null;
  presentationUrl?: string | null;
  bookUrl?: string | null;
  class: {
    id: string;
    name: string;
    mode: DeliveryMode;
    course: { id: string; code: string; title: string };
    trainer?: { id: string; fullName: string } | null;
  };
};

export type LearnFeed = {
  continueCourse: EnrolledCourse | null;
  enrollments: EnrolledCourse[];
  stats: {
    totalEnrolled: number;
    inProgress: number;
    completed: number;
    pendingWork: number;
  };
  pendingAssignments: PendingAssignment[];
  assessments: FeedAssessment[];
  upcomingClasses: UpcomingClass[];
  upcomingLiveSessions: UpcomingLiveSession[];
};

export const learnApi = {
  getFeed(token: string): Promise<LearnFeed> {
    return apiRequest<LearnFeed>("/learn/feed", { token });
  },
};

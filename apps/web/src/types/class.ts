import type { PaymentStatus, UserRole } from "./auth";
import type { Course, DeliveryMode } from "./course";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

export type Cohort = {
  id: string;
  courseId: string;
  name: string;
  mode: DeliveryMode;
  startsAt?: string | null;
  endsAt?: string | null;
  course: Pick<Course, "id" | "code" | "title" | "deliveryMode">;
  _count: {
    students: number;
    attendanceRecords: number;
  };
};

export type ClassStudent = {
  id: string;
  userId: string;
  courseId: string;
  classId?: string | null;
  progress: number;
  points: number;
  enrolledAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    paymentStatus: PaymentStatus;
  };
  course: {
    id: string;
    code: string;
    title: string;
  };
};

export type ClassLessonUnlock = {
  id: string;
  classId: string;
  lessonId: string;
  unlockedAt: string;
  lesson: {
    id: string;
    title: string;
    order: number;
    courseId: string;
  };
};

export type LiveSession = {
  id: string;
  classId: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  status: string;
  meetingUrl?: string | null;
  location?: string | null;
  presentationUrl?: string | null;
  bookUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  class: {
    id: string;
    name: string;
    mode: DeliveryMode;
    course: { id: string; code: string; title: string };
    trainer?: { id: string; fullName: string; email?: string | null } | null;
  };
  createdBy?: { id: string; fullName: string; role: string } | null;
};

export type ClassMessage = {
  id: string;
  classId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
  };
};

export type CreateLiveSessionPayload = {
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  meetingUrl?: string;
  location?: string;
  presentationUrl?: string;
  bookUrl?: string;
};

export type UpdateLiveSessionPayload = Partial<CreateLiveSessionPayload> & {
  status?: string;
};

export type AttendanceRecord = {
  id: string;
  classId: string;
  userId: string;
  date: string;
  status: AttendanceStatus;
  note?: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type CreateClassPayload = {
  courseId: string;
  name: string;
  mode: DeliveryMode;
  startsAt?: string;
  endsAt?: string;
};

export type UpdateClassPayload = Partial<CreateClassPayload>;

export type MarkAttendancePayload = {
  date: string;
  records: {
    userId: string;
    status: AttendanceStatus;
    note?: string;
  }[];
};

export const CLASS_WRITE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TRAINING_MANAGER",
  "TRAINER",
  "SCHOOL_COORDINATOR",
];

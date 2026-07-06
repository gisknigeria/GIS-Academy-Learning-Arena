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

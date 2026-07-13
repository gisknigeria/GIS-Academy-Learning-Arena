import { apiRequest } from "./api";
import type {
  AttendanceRecord,
  Cohort,
  ClassLessonUnlock,
  ClassMessage,
  ClassStudent,
  CreateClassPayload,
  CreateLiveSessionPayload,
  LiveSession,
  MarkAttendancePayload,
  UpdateClassPayload,
  UpdateLiveSessionPayload,
} from "../types/class";

export type ScheduleSummary = {
  id: string;
  name: string;
  course: { id: string; code: string; title: string };
  trainer?: { id: string; fullName: string } | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type AttendanceAnalytics = {
  totalRecords: number;
  breakdown: { status: string; count: number }[];
};

export type Announcement = {
  id: string;
  classId: string;
  authorId?: string | null;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; fullName: string } | null;
};

export const classesApi = {
  // ── Core CRUD ────────────────────────────────────────────────────────────
  list(token: string): Promise<Cohort[]> {
    return apiRequest<Cohort[]>("/classes", { token });
  },

  get(token: string, id: string): Promise<Cohort> {
    return apiRequest<Cohort>(`/classes/${id}`, { token });
  },

  create(token: string, payload: CreateClassPayload): Promise<Cohort> {
    return apiRequest<Cohort>("/classes", { method: "POST", token, body: payload });
  },

  update(token: string, id: string, payload: UpdateClassPayload): Promise<Cohort> {
    return apiRequest<Cohort>(`/classes/${id}`, { method: "PATCH", token, body: payload });
  },

  remove(token: string, id: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/classes/${id}`, { method: "DELETE", token });
  },

  // ── Students / enrollment ─────────────────────────────────────────────
  enroll(token: string, classId: string, userId: string): Promise<ClassStudent> {
    return apiRequest<ClassStudent>(`/classes/${classId}/enroll`, {
      method: "POST",
      token,
      body: { userId },
    });
  },

  students(token: string, classId: string): Promise<ClassStudent[]> {
    return apiRequest<ClassStudent[]>(`/classes/${classId}/students`, { token });
  },

  bulkEnroll(token: string, classId: string, userIds: string[]) {
    return apiRequest<{ enrolled: number }>(`/classes/${classId}/enroll/bulk`, {
      token,
      method: "POST",
      body: { userIds },
    });
  },

  lessonUnlocks(token: string, classId: string): Promise<ClassLessonUnlock[]> {
    return apiRequest<ClassLessonUnlock[]>(`/classes/${classId}/lesson-unlocks`, { token });
  },

  setLessonUnlocks(token: string, classId: string, lessonIds: string[]): Promise<ClassLessonUnlock[]> {
    return apiRequest<ClassLessonUnlock[]>(`/classes/${classId}/lesson-unlocks`, {
      token,
      method: "PATCH",
      body: { lessonIds },
    });
  },

  // ── Attendance ────────────────────────────────────────────────────────
  attendance(token: string, classId: string, date?: string): Promise<AttendanceRecord[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return apiRequest<AttendanceRecord[]>(`/classes/${classId}/attendance${query}`, { token });
  },

  markAttendance(
    token: string,
    classId: string,
    payload: MarkAttendancePayload,
  ): Promise<AttendanceRecord[]> {
    return apiRequest<AttendanceRecord[]>(`/classes/${classId}/attendance`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  getAttendanceAnalytics(token: string, classId: string, from?: string, to?: string) {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const url = `/classes/${classId}/attendance/analytics${qs.toString() ? `?${qs.toString()}` : ""}`;
    return apiRequest<AttendanceAnalytics>(url, { token });
  },

  exportAttendanceCsv(token: string, classId: string, date?: string) {
    const url = `/classes/${classId}/attendance/export${date ? `?date=${encodeURIComponent(date)}` : ""}`;
    return apiRequest<string>(url, { token });
  },

  // ── Schedule ──────────────────────────────────────────────────────────
  getSchedule(token: string, classId: string) {
    return apiRequest<ScheduleSummary>(`/classes/${classId}/schedule`, { token });
  },

  // ── Announcements ─────────────────────────────────────────────────────
  createAnnouncement(
    token: string,
    classId: string,
    body: { title: string; body: string; pinned?: boolean },
    author?: string,
  ) {
    const qs = author ? `?author=${encodeURIComponent(author)}` : "";
    return apiRequest<Announcement>(`/classes/${classId}/announcements${qs}`, {
      token,
      method: "POST",
      body,
    });
  },

  listAnnouncements(token: string, classId: string) {
    return apiRequest<Announcement[]>(`/classes/${classId}/announcements`, { token });
  },

  deleteAnnouncement(token: string, announcementId: string) {
    return apiRequest(`/classes/announcements/${announcementId}`, { token, method: "DELETE" });
  },

  messages(token: string, classId: string): Promise<ClassMessage[]> {
    return apiRequest<ClassMessage[]>(`/classes/${classId}/messages`, { token });
  },

  createMessage(token: string, classId: string, body: string): Promise<ClassMessage> {
    return apiRequest<ClassMessage>(`/classes/${classId}/messages`, {
      token,
      method: "POST",
      body: { body },
    });
  },

  listLiveSessions(token: string, classId: string): Promise<LiveSession[]> {
    return apiRequest<LiveSession[]>(`/classes/${classId}/live-sessions`, { token });
  },

  createLiveSession(token: string, classId: string, payload: CreateLiveSessionPayload): Promise<LiveSession> {
    return apiRequest<LiveSession>(`/classes/${classId}/live-sessions`, {
      token,
      method: "POST",
      body: payload,
    });
  },

  getLiveSession(token: string, sessionId: string): Promise<LiveSession> {
    return apiRequest<LiveSession>(`/classes/live-sessions/${sessionId}`, { token });
  },

  updateLiveSession(token: string, sessionId: string, payload: UpdateLiveSessionPayload): Promise<LiveSession> {
    return apiRequest<LiveSession>(`/classes/live-sessions/${sessionId}`, {
      token,
      method: "PATCH",
      body: payload,
    });
  },
};

export default classesApi;

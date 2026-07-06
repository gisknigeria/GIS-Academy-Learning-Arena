import { apiRequest } from "./api";
import type {
  AttendanceRecord,
  Cohort,
  ClassStudent,
  CreateClassPayload,
  MarkAttendancePayload,
  UpdateClassPayload,
} from "../types/class";

export const classesApi = {
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
};

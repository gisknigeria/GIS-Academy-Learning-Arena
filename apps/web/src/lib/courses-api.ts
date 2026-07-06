import { apiRequest } from "./api";
import type {
  Course,
  CourseListResponse,
  CourseProgress,
  CreateCoursePayload,
  CreateLessonPayload,
  Lesson,
  UpdateCoursePayload,
  UpdateLessonPayload,
} from "../types/course";

type ListCoursesParams = {
  search?: string;
  deliveryMode?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
};

export const coursesApi = {
  list(token: string, params: ListCoursesParams = {}): Promise<CourseListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.deliveryMode) query.set("deliveryMode", params.deliveryMode);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.includeArchived) query.set("includeArchived", "true");
    const qs = query.toString();
    return apiRequest<CourseListResponse>(`/courses${qs ? `?${qs}` : ""}`, { token });
  },

  get(token: string, id: string): Promise<Course> {
    return apiRequest<Course>(`/courses/${id}`, { token });
  },

  create(token: string, payload: CreateCoursePayload): Promise<Course> {
    return apiRequest<Course>("/courses", { method: "POST", token, body: payload });
  },

  update(token: string, id: string, payload: UpdateCoursePayload): Promise<Course> {
    return apiRequest<Course>(`/courses/${id}`, { method: "PATCH", token, body: payload });
  },

  archive(token: string, id: string): Promise<Course> {
    return apiRequest<Course>(`/courses/${id}`, { method: "DELETE", token });
  },

  restore(token: string, id: string): Promise<Course> {
    return apiRequest<Course>(`/courses/${id}/restore`, { method: "PATCH", token });
  },

  listLessons(token: string, courseId: string): Promise<Lesson[]> {
    return apiRequest<Lesson[]>(`/courses/${courseId}/lessons`, { token });
  },

  createLesson(token: string, courseId: string, payload: CreateLessonPayload): Promise<Lesson> {
    return apiRequest<Lesson>(`/courses/${courseId}/lessons`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateLesson(token: string, lessonId: string, payload: UpdateLessonPayload): Promise<Lesson> {
    return apiRequest<Lesson>(`/courses/lessons/${lessonId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  deleteLesson(token: string, lessonId: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/courses/lessons/${lessonId}`, {
      method: "DELETE",
      token,
    });
  },

  getProgress(token: string, courseId: string): Promise<CourseProgress> {
    return apiRequest<CourseProgress>(`/courses/${courseId}/progress`, { token });
  },

  markLessonComplete(token: string, courseId: string, lessonId: string): Promise<CourseProgress> {
    return apiRequest<CourseProgress>(`/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: "POST",
      token,
    });
  },

  enroll(token: string, courseId: string) {
    return apiRequest(`/courses/${courseId}/enroll`, { method: "POST", token });
  },

  isEnrolled(token: string, courseId: string): Promise<{ enrolled: boolean }> {
    return apiRequest<{ enrolled: boolean }>(`/courses/${courseId}/enrollment`, { token });
  },
};

import { API_BASE_URL, apiRequest } from "./api";
import type {
  Course,
  CourseListResponse,
  CourseProgress,
  CreateCoursePayload,
  CreateLessonPayload,
  ImportLessonPayload,
  Lesson,
  LessonDiscussion,
  LessonLibraryItem,
  UpdateCoursePayload,
  UpdateLessonPayload,
} from "../types/course";

type ListCoursesParams = {
  search?: string;
  deliveryMode?: string;
  trainingCategory?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
};

export const coursesApi = {
  list(token: string, params: ListCoursesParams = {}): Promise<CourseListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.deliveryMode) query.set("deliveryMode", params.deliveryMode);
    if (params.trainingCategory) query.set("trainingCategory", params.trainingCategory);
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

  remove(token: string, id: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/courses/${id}/destroy`, { method: "DELETE", token });
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

  searchLessonLibrary(token: string, params: { search?: string; excludeCourseId?: string } = {}): Promise<LessonLibraryItem[]> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.excludeCourseId) query.set("excludeCourseId", params.excludeCourseId);
    const qs = query.toString();
    return apiRequest<LessonLibraryItem[]>(`/courses/lessons/library${qs ? `?${qs}` : ""}`, { token });
  },

  importLesson(token: string, courseId: string, payload: ImportLessonPayload): Promise<Lesson> {
    return apiRequest<Lesson>(`/courses/${courseId}/lessons/import`, {
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

  listLessonDiscussions(token: string, lessonId: string): Promise<LessonDiscussion[]> {
    return apiRequest<LessonDiscussion[]>(`/courses/lessons/${lessonId}/discussions`, { token });
  },

  createLessonDiscussion(token: string, lessonId: string, question: string): Promise<LessonDiscussion> {
    return apiRequest<LessonDiscussion>(`/courses/lessons/${lessonId}/discussions`, {
      method: "POST",
      token,
      body: { question },
    });
  },

  answerLessonDiscussion(token: string, discussionId: string, answer: string): Promise<LessonDiscussion> {
    return apiRequest<LessonDiscussion>(`/courses/lesson-discussions/${discussionId}/answer`, {
      method: "PATCH",
      token,
      body: { answer },
    });
  },

  enroll(token: string, courseId: string) {
    return apiRequest(`/courses/${courseId}/enroll`, { method: "POST", token });
  },

  isEnrolled(token: string, courseId: string): Promise<{ enrolled: boolean }> {
    return apiRequest<{ enrolled: boolean }>(`/courses/${courseId}/enrollment`, { token });
  },

  async uploadLessonResource(token: string, file: File, lessonId?: string): Promise<{ url: string; key?: string }> {
    const form = new FormData();
    form.append("file", file);
    if (lessonId) form.append("lessonId", lessonId);

    const response = await fetch(`${API_BASE_URL}/uploads/lesson-resource`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Upload failed");
    }

    return response.json() as Promise<{ url: string; key?: string }>;
  },
};

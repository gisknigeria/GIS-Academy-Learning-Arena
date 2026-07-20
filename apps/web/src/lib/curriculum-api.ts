import { apiRequest } from "./api";
import type { CourseModule, TrainingCategory } from "../types/curriculum";

export const curriculumApi = {
  catalogue(token: string): Promise<TrainingCategory[]> {
    return apiRequest<TrainingCategory[]>("/curriculum/catalogue", { token });
  },

  createProgramme(token: string, payload: {
    categoryId: string;
    name: string;
    description?: string;
    courseIds: string[];
  }) {
    return apiRequest("/curriculum/programmes", {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateProgramme(token: string, programmeId: string, payload: {
    categoryId?: string;
    name?: string;
    description?: string;
  }) {
    return apiRequest(`/curriculum/programmes/${programmeId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  placeCourse(token: string, stageId: string, courseId: string, order = 0) {
    return apiRequest(`/curriculum/stages/${stageId}/courses`, {
      method: "POST",
      token,
      body: { courseId, order, required: true },
    });
  },

  removeCoursePlacement(token: string, placementId: string) {
    return apiRequest(`/curriculum/course-placements/${placementId}`, { method: "DELETE", token });
  },

  listModules(token: string, courseId: string): Promise<CourseModule[]> {
    return apiRequest<CourseModule[]>(`/curriculum/courses/${courseId}/modules`, { token });
  },

  moduleLibrary(token: string, search = "", excludeCourseId?: string): Promise<CourseModule[]> {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (excludeCourseId) query.set("excludeCourseId", excludeCourseId);
    return apiRequest<CourseModule[]>(`/curriculum/module-library?${query}`, { token });
  },

  createModule(token: string, courseId: string, payload: { title: string; description?: string; order?: number }) {
    return apiRequest<CourseModule>(`/curriculum/courses/${courseId}/modules`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  importModule(token: string, courseId: string, sourceModuleId: string) {
    return apiRequest<CourseModule>(`/curriculum/courses/${courseId}/modules/import`, {
      method: "POST",
      token,
      body: { sourceModuleId },
    });
  },

  deleteModule(token: string, moduleId: string) {
    return apiRequest(`/curriculum/modules/${moduleId}`, { method: "DELETE", token });
  },
};

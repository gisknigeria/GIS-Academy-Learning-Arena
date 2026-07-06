import { apiRequest } from "./api";
import type {
  Assignment,
  CreateAssignmentPayload,
  GradeSubmissionPayload,
  Submission,
  SubmitAssignmentPayload,
  UpdateAssignmentPayload,
} from "../types/assignment";

export const assignmentsApi = {
  list(token: string, courseId: string): Promise<Assignment[]> {
    return apiRequest<Assignment[]>(`/courses/${courseId}/assignments`, { token });
  },

  create(token: string, courseId: string, payload: CreateAssignmentPayload): Promise<Assignment> {
    return apiRequest<Assignment>(`/courses/${courseId}/assignments`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  update(token: string, assignmentId: string, payload: UpdateAssignmentPayload): Promise<Assignment> {
    return apiRequest<Assignment>(`/assignments/${assignmentId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  remove(token: string, assignmentId: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/assignments/${assignmentId}`, {
      method: "DELETE",
      token,
    });
  },

  submit(token: string, assignmentId: string, payload: SubmitAssignmentPayload): Promise<Submission> {
    return apiRequest<Submission>(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  listSubmissions(token: string, assignmentId: string): Promise<Submission[]> {
    return apiRequest<Submission[]>(`/assignments/${assignmentId}/submissions`, { token });
  },

  grade(token: string, submissionId: string, payload: GradeSubmissionPayload): Promise<Submission> {
    return apiRequest<Submission>(`/submissions/${submissionId}/grade`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
};

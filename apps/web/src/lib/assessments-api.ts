import { apiRequest } from "./api";
import type {
  Assessment,
  AttemptResult,
  AttemptSession,
  AttemptSummary,
  CreateAssessmentPayload,
  CreateQuestionPayload,
  Question,
  UpdateAssessmentPayload,
  UpdateQuestionPayload,
} from "../types/assessment";

export const assessmentsApi = {
  createBank(token: string, title: string, description?: string) {
    return apiRequest(`/assessments/banks`, { token, method: "POST", body: { title, description } });
  },

  listBanks(token: string) {
    return apiRequest<any[]>(`/assessments/banks`, { token });
  },

  addQuestionToBank(token: string, bankId: string, questionId: string) {
    return apiRequest(`/assessments/banks/${bankId}/questions`, { token, method: "POST", body: { questionId } });
  },

  drawFromBank(token: string, bankId: string, n = 10) {
    return apiRequest(`/assessments/banks/${bankId}/draw?n=${n}`, { token });
  },

  gradeAttempt(token: string, attemptId: string, grades: Record<string, number>, comments?: Record<string, string>) {
    return apiRequest(`/assessments/attempts/${attemptId}/grade`, {
      token,
      method: "POST",
      body: { grades, comments },
    });
  },

  flagAttempt(token: string, attemptId: string, reason?: string) {
    return apiRequest(`/assessments/attempts/${attemptId}/flag`, { token, method: "POST", body: { reason } });
  },

  list(token: string, all = false): Promise<Assessment[]> {
    return apiRequest<Assessment[]>(`/assessments${all ? "?all=true" : ""}`, { token });
  },

  get(token: string, id: string): Promise<Assessment> {
    return apiRequest<Assessment>(`/assessments/${id}`, { token });
  },

  create(token: string, payload: CreateAssessmentPayload): Promise<Assessment> {
    return apiRequest<Assessment>("/assessments", { method: "POST", token, body: payload });
  },

  update(token: string, id: string, payload: UpdateAssessmentPayload): Promise<Assessment> {
    return apiRequest<Assessment>(`/assessments/${id}`, { method: "PATCH", token, body: payload });
  },

  remove(token: string, id: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/assessments/${id}`, { method: "DELETE", token });
  },

  addQuestion(token: string, assessmentId: string, payload: CreateQuestionPayload): Promise<Question> {
    return apiRequest<Question>(`/assessments/${assessmentId}/questions`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateQuestion(token: string, questionId: string, payload: UpdateQuestionPayload): Promise<Question> {
    return apiRequest<Question>(`/assessments/questions/${questionId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  removeQuestion(token: string, questionId: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/assessments/questions/${questionId}`, {
      method: "DELETE",
      token,
    });
  },

  startAttempt(token: string, assessmentId: string): Promise<AttemptSession> {
    return apiRequest<AttemptSession>(`/assessments/${assessmentId}/attempt`, {
      method: "POST",
      token,
    });
  },

  submitAttempt(token: string, attemptId: string, answers: Record<string, string>): Promise<AttemptResult> {
    return apiRequest<AttemptResult>(`/assessments/attempts/${attemptId}/submit`, {
      method: "POST",
      token,
      body: { answers },
    });
  },

  getMyAttempts(token: string): Promise<AttemptSummary[]> {
    return apiRequest<AttemptSummary[]>("/assessments/attempts/mine", { token });
  },

  getAttemptResult(token: string, attemptId: string): Promise<AttemptResult> {
    return apiRequest<AttemptResult>(`/assessments/attempts/${attemptId}`, { token });
  },

  listAttempts(token: string, assessmentId: string): Promise<AttemptSummary[]> {
    return apiRequest<AttemptSummary[]>(`/assessments/${assessmentId}/attempts`, { token });
  },
};

export default assessmentsApi;

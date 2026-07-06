import { apiRequest } from "./api";
import type {
  Competition,
  CompetitionAttemptResult,
  CompetitionParticipant,
  CompetitionSession,
  CompetitionStatus,
  CompetitionTeam,
  CreateTeamPayload,
  CreateCompetitionPayload,
  JoinCompetitionPayload,
  MyParticipation,
  UpdateCompetitionPayload,
} from "../types/competition";

export const competitionsApi = {
  list(token: string, all = false): Promise<Competition[]> {
    return apiRequest<Competition[]>(`/competitions${all ? "?all=true" : ""}`, { token });
  },

  get(token: string, id: string): Promise<Competition> {
    return apiRequest<Competition>(`/competitions/${id}`, { token });
  },

  create(token: string, payload: CreateCompetitionPayload): Promise<Competition> {
    return apiRequest<Competition>("/competitions", { method: "POST", token, body: payload });
  },

  update(token: string, id: string, payload: UpdateCompetitionPayload): Promise<Competition> {
    return apiRequest<Competition>(`/competitions/${id}`, { method: "PATCH", token, body: payload });
  },

  remove(token: string, id: string): Promise<{ deleted: true }> {
    return apiRequest<{ deleted: true }>(`/competitions/${id}`, { method: "DELETE", token });
  },

  setStatus(token: string, id: string, status: CompetitionStatus): Promise<Competition> {
    return apiRequest<Competition>(`/competitions/${id}/status`, {
      method: "PATCH",
      token,
      body: { status },
    });
  },

  join(
    token: string,
    id: string,
    payload?: string | JoinCompetitionPayload,
  ): Promise<CompetitionParticipant> {
    const body = typeof payload === "string" ? { joinCode: payload } : payload ?? {};
    return apiRequest<CompetitionParticipant>(`/competitions/${id}/join`, {
      method: "POST",
      token,
      body,
    });
  },

  listTeams(token: string, id: string): Promise<CompetitionTeam[]> {
    return apiRequest<CompetitionTeam[]>(`/competitions/${id}/teams`, { token });
  },

  createTeam(token: string, id: string, payload: CreateTeamPayload): Promise<CompetitionTeam> {
    return apiRequest<CompetitionTeam>(`/competitions/${id}/teams`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  joinTeam(token: string, competitionId: string, teamId: string, code?: string): Promise<CompetitionTeam> {
    return apiRequest<CompetitionTeam>(`/competitions/${competitionId}/teams/${teamId}/join`, {
      method: "POST",
      token,
      body: { code },
    });
  },

  startAttempt(token: string, id: string): Promise<CompetitionSession> {
    return apiRequest<CompetitionSession>(`/competitions/${id}/attempt`, {
      method: "POST",
      token,
    });
  },

  submitAttempt(
    token: string,
    competitionId: string,
    attemptId: string,
    answers: Record<string, string>,
    durationSec?: number,
  ): Promise<CompetitionAttemptResult> {
    return apiRequest<CompetitionAttemptResult>(
      `/competitions/${competitionId}/attempts/${attemptId}/submit`,
      { method: "POST", token, body: { answers, durationSec } },
    );
  },

  getLeaderboard(token: string, id: string): Promise<CompetitionParticipant[]> {
    return apiRequest<CompetitionParticipant[]>(`/competitions/${id}/leaderboard`, { token });
  },

  getMyParticipations(token: string): Promise<MyParticipation[]> {
    return apiRequest<MyParticipation[]>("/competitions/mine", { token });
  },
};

import type { SafeQuestion } from "./assessment";

export type CompetitionMode =
  | "INDIVIDUAL"
  | "HEAD_TO_HEAD"
  | "TEAM"
  | "SCHOOL"
  | "CORPORATE"
  | "LIVE_TIMED"
  | "OPEN_CHALLENGE"
  | "OLYMPIAD";

export type CompetitionStatus = "DRAFT" | "OPEN" | "LIVE" | "COMPLETED" | "ARCHIVED";

export type Competition = {
  id: string;
  title: string;
  description?: string | null;
  mode: CompetitionMode;
  status: CompetitionStatus;
  assessmentId?: string | null;
  durationMin: number;
  maxParticipants?: number | null;
  isPublic: boolean;
  joinCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  assessment?: { id: string; title: string } | null;
  _count?: { participants: number; teams?: number };
};

export type CompetitionTeamMember = {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
  user?: { id: string; fullName: string; email: string };
};

export type CompetitionTeam = {
  id: string;
  competitionId: string;
  name: string;
  code?: string | null;
  score: number;
  rank?: number | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: CompetitionTeamMember[];
  _count?: { members: number; participants: number };
};

export type CompetitionParticipant = {
  id: string;
  competitionId: string;
  userId: string;
  teamId?: string | null;
  score: number;
  rank?: number | null;
  joinedAt: string;
  user?: { id: string; fullName: string; email: string };
  team?: { id: string; name: string; score: number; rank?: number | null } | null;
};

export type CompetitionSession = {
  attemptId: string;
  competitionId: string;
  title: string;
  description?: string | null;
  durationMin: number;
  questions: SafeQuestion[];
  savedAnswers: Record<string, string>;
};

export type CompetitionAttemptResult = {
  id: string;
  competitionId: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  durationSec?: number | null;
  submittedAt?: string | null;
};

export type MyParticipation = {
  id: string;
  competitionId: string;
  teamId?: string | null;
  score: number;
  rank?: number | null;
  joinedAt: string;
  team?: { id: string; name: string; score: number; rank?: number | null } | null;
  competition: {
    id: string;
    title: string;
    mode: CompetitionMode;
    status: CompetitionStatus;
    durationMin: number;
    startsAt?: string | null;
  };
};

export const COMPETITION_MODE_LABELS: Record<CompetitionMode, string> = {
  INDIVIDUAL: "Individual",
  HEAD_TO_HEAD: "Head-to-Head",
  TEAM: "Team Battle",
  SCHOOL: "School",
  CORPORATE: "Corporate",
  LIVE_TIMED: "Live Timed",
  OPEN_CHALLENGE: "Open Challenge",
  OLYMPIAD: "Olympiad",
};

export const COMPETITION_STATUS_LABELS: Record<CompetitionStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open – Registering",
  LIVE: "Live Now",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const COMPETITION_STATUS_COLOURS: Record<CompetitionStatus, string> = {
  DRAFT: "status-pending",
  OPEN: "status-submitted",
  LIVE: "comp-status-live",
  COMPLETED: "status-graded",
  ARCHIVED: "badge-neutral",
};

export type CreateCompetitionPayload = {
  title: string;
  description?: string;
  mode: CompetitionMode;
  assessmentId?: string;
  durationMin?: number;
  maxParticipants?: number;
  isPublic?: boolean;
  joinCode?: string;
  startsAt?: string;
  endsAt?: string;
};

export type UpdateCompetitionPayload = Partial<CreateCompetitionPayload> & {
  status?: CompetitionStatus;
};

export type JoinCompetitionPayload = {
  joinCode?: string;
  teamId?: string;
  teamName?: string;
  teamCode?: string;
};

export type CreateTeamPayload = {
  name: string;
  code?: string;
};

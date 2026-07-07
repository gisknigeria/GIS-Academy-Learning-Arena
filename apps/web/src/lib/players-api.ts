import { apiRequest } from "./api";

export type PlayerStatsResponse = {
  id: string;
  userId: string;
  xp: number;
  level: number;
  points: number;
  streak: number;
  longestStreak: number | null;
  wins: number;
  losses: number;
  achievementsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserBadgeResponse = {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  badge: {
    id: string;
    key: string;
    title: string;
    description: string | null;
    iconUrl: string | null;
    points: number;
  };
};

export const playersApi = {
  getMyStats(token: string): Promise<PlayerStatsResponse> {
    return apiRequest<PlayerStatsResponse>("/players/me/stats", { token });
  },

  addPoints(
    token: string,
    userId: string,
    amount: number,
    reason?: string,
    meta?: Record<string, unknown>,
  ): Promise<PlayerStatsResponse> {
    return apiRequest<PlayerStatsResponse>(`/players/${userId}/points`, {
      method: "POST",
      token,
      body: { amount, reason, meta },
    });
  },

  awardBadge(token: string, userId: string, badgeKey: string): Promise<UserBadgeResponse> {
    return apiRequest<UserBadgeResponse>(`/players/${userId}/award-badge`, {
      method: "POST",
      token,
      body: { badgeKey },
    });
  },
};

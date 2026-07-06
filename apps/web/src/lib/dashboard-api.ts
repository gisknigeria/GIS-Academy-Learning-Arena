import { apiRequest } from "./api";

export type DashboardStat = {
  label: string;
  value: string;
  note: string;
  key: string;
};

export type DashboardStats = {
  role: string;
  stats: DashboardStat[];
};

export const dashboardApi = {
  getStats(token: string): Promise<DashboardStats> {
    return apiRequest<DashboardStats>("/dashboard/stats", { token });
  },
};

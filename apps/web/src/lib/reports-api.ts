import { apiRequest } from "./api";
import type {
  CertificateReports,
  CompetitionReports,
  CourseReport,
  LearnerReport,
  ReportsOverview,
} from "../types/report";

export const reportsApi = {
  overview(token: string): Promise<ReportsOverview> {
    return apiRequest<ReportsOverview>("/reports/overview", { token });
  },

  courses(token: string): Promise<CourseReport[]> {
    return apiRequest<CourseReport[]>("/reports/courses", { token });
  },

  learners(token: string): Promise<LearnerReport[]> {
    return apiRequest<LearnerReport[]>("/reports/learners", { token });
  },

  competitions(token: string): Promise<CompetitionReports> {
    return apiRequest<CompetitionReports>("/reports/competitions", { token });
  },

  certificates(token: string): Promise<CertificateReports> {
    return apiRequest<CertificateReports>("/reports/certificates", { token });
  },
};

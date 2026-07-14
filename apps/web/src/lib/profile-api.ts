import { apiRequest } from "./api";
import type { AuthUser } from "../types/auth";

export type UserProfile = {
  id: string;
  userId: string;
  gender?: string | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  community?: string | null;
  institution?: string | null;
  profession?: string | null;
  highestQualification?: string | null;
  preferredMode?: string | null;
  ageBand?: string | null;
  trainingCategory?: string | null;
  learningGoal?: string | null;
  fanCategory?: string | null;
  favorite?: string | null;
  learningStyle?: string | null;
  competitionType?: string | null;
  courseInterest?: string | null;
  notificationPreference?: string | null;
  languagePreference?: string | null;
  fontPreference?: string | null;
  appearanceMode?: string | null;
  avatarUrl?: string | null;
};

export type FullUser = AuthUser & {
  profile: UserProfile | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateMePayload = {
  fullName?: string;
  phone?: string;
};

export type UpdateProfilePayload = Partial<Omit<UserProfile, "id" | "userId">>;

export const profileApi = {
  getMe(token: string): Promise<FullUser> {
    return apiRequest<FullUser>("/users/me", { token });
  },

  updateMe(token: string, payload: UpdateMePayload): Promise<AuthUser> {
    return apiRequest<AuthUser>("/users/me", { method: "PATCH", token, body: payload });
  },

  updateProfile(token: string, payload: UpdateProfilePayload): Promise<UserProfile> {
    return apiRequest<UserProfile>("/users/me/profile", {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return apiRequest("/users/me/password", {
      method: "PATCH",
      token,
      body: { currentPassword, newPassword },
    });
  },
};

import { apiRequest } from "./api";
import type { PaymentStatus, UserRole } from "../types/auth";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  _count: {
    enrollments: number;
    lessonProgress: number;
  };
};

export type UserListResponse = {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UserProgressResponse = {
  user: { id: string; fullName: string; email: string };
  totalCompleted: number;
  enrollments: {
    courseId: string;
    code: string;
    title: string;
    progress: number;
    enrolledAt: string;
  }[];
};

type ListUsersParams = {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
};

export const usersApi = {
  list(token: string, params: ListUsersParams = {}): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.role) query.set("role", params.role);
    if (params.status) query.set("status", params.status);
    if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiRequest<UserListResponse>(`/users${qs ? `?${qs}` : ""}`, { token });
  },

  getProgress(token: string, userId: string): Promise<UserProgressResponse> {
    return apiRequest<UserProgressResponse>(`/users/${userId}/progress`, { token });
  },

  updateRole(token: string, userId: string, role: UserRole): Promise<AdminUser> {
    return apiRequest<AdminUser>(`/users/${userId}/role`, {
      method: "PATCH",
      token,
      body: { role },
    });
  },

  updatePaymentStatus(token: string, userId: string, paymentStatus: PaymentStatus): Promise<AdminUser> {
    return apiRequest<AdminUser>(`/users/${userId}/payment-status`, {
      method: "PATCH",
      token,
      body: { paymentStatus },
    });
  },

  updateStatus(token: string, userId: string, status: UserStatus): Promise<AdminUser> {
    return apiRequest<AdminUser>(`/users/${userId}/status`, {
      method: "PATCH",
      token,
      body: { status },
    });
  },
};

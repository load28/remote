import { fetchJson } from "./httpClient";

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  status: "pending_verification" | "pending_approval" | "active" | "rejected";
  email_verified_at: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

const TOKEN_KEY = "sst_monitor_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const authApi = {
  register: (email: string, password: string) =>
    fetchJson<{ message: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    fetchJson<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (token: string) =>
    fetchJson<{ message: string; user: User }>(`/api/auth/verify-email`, {
      params: { token },
    }),

  me: () => fetchJson<User>("/api/auth/me"),

  // Admin endpoints
  listUsers: () => fetchJson<User[]>("/api/admin/users"),

  approveUser: (userId: string) =>
    fetchJson<{ message: string; user: User }>(`/api/admin/users/${userId}/approve`, {
      method: "POST",
    }),

  rejectUser: (userId: string) =>
    fetchJson<{ message: string }>(`/api/admin/users/${userId}/reject`, {
      method: "POST",
    }),
};

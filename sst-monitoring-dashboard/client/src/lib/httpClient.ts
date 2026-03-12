import { clearToken, getToken } from "./auth";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchJson<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> },
): Promise<T> {
  const url = new URL(path, API_BASE);
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const { params: _, ...fetchOpts } = options ?? {};
  const contentType = fetchOpts.body ? { "Content-Type": "application/json" } : {};

  const res = await fetch(url.toString(), {
    ...fetchOpts,
    headers: authHeaders({
      ...contentType,
      ...(fetchOpts.headers as Record<string, string>),
    }),
  });

  if (res.status === 401) {
    clearToken();
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, data.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

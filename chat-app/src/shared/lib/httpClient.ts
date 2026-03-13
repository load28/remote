// shared/lib/httpClient.ts — fetch 기반 HTTP 클라이언트 (A-06, A-09)

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export interface RequestConfig {
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

function buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return url;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  return `${url}?${searchParams.toString()}`;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const httpClient: HttpClient = {
  get: (url, config) =>
    request(buildUrl(url, config?.params), {
      method: 'GET',
      signal: config?.signal,
      headers: config?.headers,
    }),
  post: (url, data, config) =>
    request(url, {
      method: 'POST',
      signal: config?.signal,
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      body: JSON.stringify(data),
    }),
  put: (url, data, config) =>
    request(url, {
      method: 'PUT',
      signal: config?.signal,
      headers: { 'Content-Type': 'application/json', ...config?.headers },
      body: JSON.stringify(data),
    }),
  delete: (url, config) =>
    request(url, {
      method: 'DELETE',
      signal: config?.signal,
      headers: config?.headers,
    }),
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface SstApp {
  name: string;
  stage: string;
  region: string;
  stack_name: string;
  status: string;
  last_updated: string | null;
  outputs: { key: string; value: string }[];
}

export interface SstResource {
  logical_id: string;
  physical_id: string;
  resource_type: string;
  status: string;
  last_updated: string | null;
}

export interface LogEvent {
  timestamp: number;
  message: string;
  log_stream: string;
}

export interface LogGroup {
  name: string;
  arn: string;
  stored_bytes: number;
  retention_days: number | null;
}

export interface FunctionInfo {
  function_name: string;
  runtime: string | null;
  memory_size: number | null;
  timeout: number | null;
  last_modified: string | null;
  code_size: number;
  handler: string | null;
  log_group: string;
}

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} - ${text}`);
  }
  return res.json();
}

export const api = {
  listApps: (stage?: string) =>
    fetchApi<SstApp[]>("/api/apps", stage ? { stage } : undefined),

  getResources: (stackName: string) =>
    fetchApi<SstResource[]>(`/api/apps/${encodeURIComponent(stackName)}/resources`),

  getFunctions: (stackName: string) =>
    fetchApi<FunctionInfo[]>(`/api/apps/${encodeURIComponent(stackName)}/functions`),

  listLogGroups: (prefix?: string) =>
    fetchApi<LogGroup[]>("/api/logs/groups", prefix ? { log_group: prefix } : undefined),

  getLogs: (logGroup: string, opts?: { start_time?: string; end_time?: string; filter_pattern?: string; limit?: string }) =>
    fetchApi<LogEvent[]>("/api/logs/events", { log_group: logGroup, ...opts }),
};

export function getWsUrl(): string {
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}/ws`;
}

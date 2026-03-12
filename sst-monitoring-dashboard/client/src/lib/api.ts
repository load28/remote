import { getToken } from "./auth";
import { API_BASE, fetchJson } from "./httpClient";

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

export const api = {
  listApps: (stage?: string) =>
    fetchJson<SstApp[]>("/api/apps", stage ? { params: { stage } } : undefined),

  getResources: (stackName: string) =>
    fetchJson<SstResource[]>(`/api/apps/${encodeURIComponent(stackName)}/resources`),

  getFunctions: (stackName: string) =>
    fetchJson<FunctionInfo[]>(`/api/apps/${encodeURIComponent(stackName)}/functions`),

  listLogGroups: (prefix?: string) =>
    fetchJson<LogGroup[]>("/api/logs/groups", prefix ? { params: { log_group: prefix } } : undefined),

  getLogs: (logGroup: string, opts?: { start_time?: string; end_time?: string; filter_pattern?: string; limit?: string }) =>
    fetchJson<LogEvent[]>("/api/logs/events", { params: { log_group: logGroup, ...opts } }),
};

export function getWsUrl(): string {
  const token = getToken();
  const base = API_BASE.replace(/^http/, "ws");
  return `${base}/ws${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

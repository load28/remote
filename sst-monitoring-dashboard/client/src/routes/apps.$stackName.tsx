import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type SstResource,
  type FunctionInfo,
  api,
} from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { LogViewer } from "../components/LogViewer";
import { formatBytes } from "../lib/format";

export const Route = createFileRoute("/apps/$stackName")({
  component: AppDetailPage,
});

function AppDetailPage() {
  const { stackName } = Route.useParams();
  const [resources, setResources] = useState<SstResource[]>([]);
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resources" | "functions" | "logs">("resources");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, fns] = await Promise.all([
        api.getResources(stackName),
        api.getFunctions(stackName),
      ]);
      setResources(res);
      setFunctions(fns);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [stackName]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 15000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, 15000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  // Group resources by type
  const resourcesByType = resources.reduce<Record<string, SstResource[]>>(
    (acc, r) => {
      const type = r.resource_type.split("::").pop() || r.resource_type;
      (acc[type] ??= []).push(r);
      return acc;
    },
    {}
  );

  const lambdaCount = resources.filter((r) =>
    r.resource_type.includes("Lambda::Function")
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Link
            to="/"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            Apps
          </Link>
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{stackName}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            {stackName}
          </h1>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            <span>{resources.length} resources</span>
            <span>{lambdaCount} functions</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 16 }}>
          {(["resources", "functions", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === tab ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: 16,
            margin: "16px 32px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 8,
            color: "var(--error)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && resources.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>
          Loading...
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {activeTab === "resources" && (
          <div style={{ padding: "20px 32px" }}>
            {Object.entries(resourcesByType).map(([type, items]) => (
              <div key={type} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      margin: 0,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {type}
                  </h3>
                  <span
                    style={{
                      fontSize: 11,
                      backgroundColor: "var(--bg-tertiary)",
                      padding: "1px 6px",
                      borderRadius: 9999,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {items.map((r, i) => (
                    <div
                      key={r.logical_id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr auto",
                        gap: 16,
                        padding: "10px 16px",
                        fontSize: 13,
                        borderTop: i > 0 ? "1px solid var(--border)" : "none",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{r.logical_id}</div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.physical_id}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {r.resource_type}
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "functions" && (
          <div style={{ padding: "20px 32px" }}>
            <div
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {functions.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: 13,
                  }}
                >
                  No Lambda functions found for this stack
                </div>
              ) : (
                functions.map((fn, i) => (
                  <div
                    key={fn.function_name}
                    style={{
                      padding: "14px 16px",
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {fn.function_name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          marginTop: 4,
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {fn.runtime && <span>{fn.runtime}</span>}
                        {fn.memory_size && <span>{fn.memory_size}MB</span>}
                        {fn.timeout && <span>{fn.timeout}s timeout</span>}
                        <span>{formatBytes(fn.code_size)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLogGroup(fn.log_group);
                        setActiveTab("logs");
                      }}
                      style={{
                        padding: "6px 12px",
                        fontSize: 12,
                        backgroundColor: "var(--bg-tertiary)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      View Logs
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div style={{ height: "calc(100vh - 180px)" }}>
            {/* Log group selector */}
            <div
              style={{
                padding: "12px 32px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <select
                value={selectedLogGroup || ""}
                onChange={(e) => setSelectedLogGroup(e.target.value || null)}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  minWidth: 300,
                }}
              >
                <option value="">Select a log group...</option>
                {functions.map((fn) => (
                  <option key={fn.log_group} value={fn.log_group}>
                    {fn.log_group}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ height: "calc(100% - 50px)" }}>
              <LogViewer logGroup={selectedLogGroup} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

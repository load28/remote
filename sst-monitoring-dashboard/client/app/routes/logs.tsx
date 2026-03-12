import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type LogGroup, api } from "../lib/api";
import { LogViewer } from "../components/LogViewer";

export const Route = createFileRoute("/logs")({
  component: LogsPage,
});

function LogsPage() {
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchPrefix, setSearchPrefix] = useState("/aws/lambda/");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const data = await api.listLogGroups(searchPrefix || undefined);
        setLogGroups(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch log groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [searchPrefix]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left panel - Log group list */}
      <div
        style={{
          width: 360,
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <div style={{ padding: "20px 16px 12px" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px" }}>
            Log Groups
          </h1>
          <input
            type="text"
            placeholder="Filter by prefix..."
            value={searchPrefix}
            onChange={(e) => setSearchPrefix(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 13,
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: "8px 16px",
              color: "var(--error)",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: 13,
              }}
            >
              Loading...
            </div>
          ) : logGroups.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: 13,
              }}
            >
              No log groups found
            </div>
          ) : (
            logGroups.map((group) => (
              <button
                key={group.name}
                onClick={() => setSelectedGroup(group.name)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  textAlign: "left",
                  backgroundColor:
                    selectedGroup === group.name
                      ? "var(--bg-tertiary)"
                      : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  borderLeft:
                    selectedGroup === group.name
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {group.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 4,
                    fontSize: 11,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>{formatBytes(group.stored_bytes)}</span>
                  {group.retention_days && (
                    <span>{group.retention_days}d retention</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel - Log viewer */}
      <div style={{ flex: 1 }}>
        <LogViewer logGroup={selectedGroup} />
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

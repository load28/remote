import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { type SstApp, api } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

export const Route = createFileRoute("/")({
  component: AppsPage,
});

function AppsPage() {
  const [apps, setApps] = useState<SstApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listApps(stageFilter || undefined);
      setApps(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch apps");
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => {
    fetchApps();
    intervalRef.current = setInterval(fetchApps, 10000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        fetchApps();
        intervalRef.current = setInterval(fetchApps, 10000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchApps]);

  // Group apps by stage
  const stages = apps.reduce<Record<string, SstApp[]>>((acc, app) => {
    (acc[app.stage] ??= []).push(app);
    return acc;
  }, {});

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Applications
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
            }}
          >
            Monitor your SST deployments across all stages
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Filter by stage..."
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              fontSize: 13,
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              outline: "none",
              width: 180,
            }}
          />
          <button
            onClick={fetchApps}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              backgroundColor: "var(--accent)",
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 8,
            color: "var(--error)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && apps.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--text-secondary)",
          }}
        >
          Loading applications...
        </div>
      )}

      {/* Apps grouped by stage */}
      {Object.entries(stages).map(([stage, stageApps]) => (
        <div key={stage} style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-secondary)",
              }}
            >
              {stage}
            </h2>
            <span
              style={{
                fontSize: 11,
                backgroundColor: "var(--bg-tertiary)",
                padding: "2px 8px",
                borderRadius: 9999,
                color: "var(--text-secondary)",
              }}
            >
              {stageApps.length}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 12,
            }}
          >
            {stageApps.map((app) => (
              <AppCard key={app.stack_name} app={app} />
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {!loading && apps.length === 0 && !error && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--text-secondary)",
          }}
        >
          <p style={{ fontSize: 15, marginBottom: 8 }}>No applications found</p>
          <p style={{ fontSize: 13 }}>
            Make sure your AWS credentials are configured and SST apps are
            deployed
          </p>
        </div>
      )}
    </div>
  );
}

function AppCard({ app }: { app: SstApp }) {
  return (
    <Link
      to="/apps/$stackName"
      params={{ stackName: app.stack_name }}
      style={{
        display: "block",
        padding: 16,
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
            {app.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {app.stack_name}
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        <span>{app.region}</span>
        {app.last_updated && (
          <span>
            Updated{" "}
            {new Date(app.last_updated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Outputs preview */}
      {app.outputs.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Outputs
          </div>
          {app.outputs.slice(0, 3).map((o) => (
            <div
              key={o.key}
              style={{
                fontSize: 12,
                display: "flex",
                gap: 8,
                marginBottom: 2,
              }}
            >
              <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                {o.key}:
              </span>
              <span
                style={{
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {o.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

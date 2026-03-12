import { useEffect, useRef } from "react";
import { useLogStream } from "../lib/useLogStream";

interface LogViewerProps {
  logGroup: string | null;
}

export function LogViewer({ logGroup }: LogViewerProps) {
  const { logs, isConnected, isStreaming, error, clearLogs } = useLogStream({
    logGroup,
    maxLines: 2000,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 50;
  };

  if (!logGroup) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        Select a function or log group to view logs
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{logGroup}</span>
          {isStreaming && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--success)",
                fontWeight: 500,
              }}
            >
              <span
                className="live-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--success)",
                }}
              />
              LIVE
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              color: isConnected ? "var(--success)" : "var(--error)",
            }}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <button
            onClick={clearLogs}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--error)",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Logs */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 0",
          backgroundColor: "var(--bg-primary)",
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            {isStreaming
              ? "Waiting for new log events..."
              : "No logs available"}
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={`${log.timestamp}-${i}`}
              className="log-line"
              style={{
                display: "flex",
                padding: "1px 16px",
                gap: 16,
              }}
            >
              <span className="log-timestamp">
                {new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 23)}
              </span>
              <span style={{ flex: 1 }}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { type LogEvent, getWsUrl } from "./api";

interface UseLogStreamOptions {
  logGroup: string | null;
  maxLines?: number;
}

interface UseLogStreamReturn {
  logs: LogEvent[];
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  clearLogs: () => void;
}

export function useLogStream({ logGroup, maxLines = 1000 }: UseLogStreamOptions): UseLogStreamReturn {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const logGroupRef = useRef(logGroup);
  const maxLinesRef = useRef(maxLines);

  // Keep refs in sync
  logGroupRef.current = logGroup;
  maxLinesRef.current = maxLines;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);

      // Subscribe to current log group on connect
      const currentGroup = logGroupRef.current;
      if (currentGroup) {
        ws.send(JSON.stringify({ action: "subscribe", log_group: currentGroup }));
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.event) {
        case "logs":
          setLogs((prev) => {
            const newLogs = [...prev, ...msg.data];
            return newLogs.slice(-maxLinesRef.current);
          });
          break;
        case "subscribed":
          setIsStreaming(true);
          break;
        case "error":
          setError(msg.data.message);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsStreaming(false);
      wsRef.current = null;
      // Reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
    };
  }, []); // No dependencies - stable reference

  // Connect once on mount
  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Subscribe to new log group when it changes (without reconnecting)
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && logGroup) {
      setLogs([]);
      setIsStreaming(false);
      wsRef.current.send(JSON.stringify({ action: "subscribe", log_group: logGroup }));
    } else if (wsRef.current?.readyState === WebSocket.OPEN && !logGroup) {
      wsRef.current.send(JSON.stringify({ action: "unsubscribe" }));
      setIsStreaming(false);
    }
  }, [logGroup]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, isConnected, isStreaming, error, clearLogs };
}

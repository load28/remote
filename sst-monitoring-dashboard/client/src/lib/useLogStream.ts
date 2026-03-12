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
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // Keep refs in sync
  logGroupRef.current = logGroup;
  maxLinesRef.current = maxLines;

  const connect = useCallback(() => {
    // Don't connect if unmounted or already connected
    if (!mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Don't connect if there's no log group to subscribe to
    if (!logGroupRef.current) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }

      setIsConnected(true);
      setError(null);
      retryCountRef.current = 0; // Reset backoff on successful connect

      // Subscribe to current log group on connect
      const currentGroup = logGroupRef.current;
      if (currentGroup) {
        ws.send(JSON.stringify({ action: "subscribe", log_group: currentGroup }));
      }
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;

      const msg = JSON.parse(event.data);

      switch (msg.event) {
        case "connected":
          // Server welcome message - connection confirmed
          break;
        case "logs":
          // Set streaming before appending logs to avoid "No logs" flash
          setIsStreaming(true);
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
      if (!mountedRef.current) return;

      setIsConnected(false);
      setIsStreaming(false);
      wsRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setError("WebSocket connection error");
    };
  }, []); // Stable reference - no dependencies

  // Connect when logGroup becomes non-null, disconnect when null
  useEffect(() => {
    mountedRef.current = true;

    if (logGroup) {
      // Connect if not already connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
      }
    }

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Subscribe to new log group when it changes (without reconnecting)
  useEffect(() => {
    if (!logGroup) {
      // No log group - close connection if open
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "unsubscribe" }));
      }
      setIsStreaming(false);
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setLogs([]);
      setIsStreaming(false);
      wsRef.current.send(JSON.stringify({ action: "subscribe", log_group: logGroup }));
    } else {
      // Not connected yet - initiate connection (will subscribe on open)
      connect();
    }
  }, [logGroup, connect]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, isConnected, isStreaming, error, clearLogs };
}

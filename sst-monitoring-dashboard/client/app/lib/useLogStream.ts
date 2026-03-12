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

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);

      if (logGroup) {
        ws.send(JSON.stringify({ action: "subscribe", log_group: logGroup }));
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.event) {
        case "logs":
          setLogs((prev) => {
            const newLogs = [...prev, ...msg.data];
            return newLogs.slice(-maxLines);
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
      // Reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
    };
  }, [logGroup, maxLines]);

  // Connect and subscribe when logGroup changes
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

  // Subscribe to new log group if already connected
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && logGroup) {
      setLogs([]);
      wsRef.current.send(JSON.stringify({ action: "subscribe", log_group: logGroup }));
    }
  }, [logGroup]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, isConnected, isStreaming, error, clearLogs };
}

import { useState, useEffect, useTransition, useSyncExternalStore } from "react";

// 외부 스토어 (React가 관리하지 않음)
let externalColor = "lightblue";
const colorListeners = new Set<() => void>();

function setExternalColor(color: string) {
  externalColor = color;
  colorListeners.forEach((l) => l());
}

function subscribeColor(callback: () => void) {
  colorListeners.add(callback);
  return () => colorListeners.delete(callback);
}

function getColorSnapshot() {
  return externalColor;
}

// 의도적으로 무거운 컴포넌트 — 렌더링 도중 시간이 걸림
function HeavyCell({ label }: { label: string }) {
  // 의도적으로 느린 렌더링 시뮬레이션
  const start = performance.now();
  while (performance.now() - start < 2) {
    // 2ms blocking per cell
  }
  // 직접 외부 스토어를 읽음 (Tearing 가능)
  const color = externalColor;
  return (
    <div
      style={{
        background: color,
        padding: "8px 12px",
        margin: 2,
        borderRadius: 4,
        fontSize: 12,
        display: "inline-block",
        minWidth: 60,
        textAlign: "center",
      }}
    >
      {label}: {color}
    </div>
  );
}

// useSyncExternalStore로 안전하게 읽는 컴포넌트
function SafeCell({ label }: { label: string }) {
  const start = performance.now();
  while (performance.now() - start < 2) {}
  const color = useSyncExternalStore(subscribeColor, getColorSnapshot);
  return (
    <div
      style={{
        background: color,
        padding: "8px 12px",
        margin: 2,
        borderRadius: 4,
        fontSize: 12,
        display: "inline-block",
        minWidth: 60,
        textAlign: "center",
      }}
    >
      {label}: {color}
    </div>
  );
}

function TearingDemo() {
  const [, startTransition] = useTransition();
  const [renderKey, setRenderKey] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  // 렌더 중간에 색 변경을 시뮬레이션하는 Effect
  useEffect(() => {
    // 색 변경을 반복해서 tearing 가능성을 높임
    const interval = setInterval(() => {
      const colors = ["lightblue", "lightcoral", "lightgreen", "lightyellow"];
      const next = colors[Math.floor(Math.random() * colors.length)];
      setExternalColor(next);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const triggerRender = () => {
    startTransition(() => {
      setRenderKey((k) => k + 1);
      setLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] startTransition으로 리렌더 트리거 (key: ${renderKey + 1})`,
      ]);
    });
  };

  const cells = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div>
      <button
        onClick={triggerRender}
        style={{
          padding: "10px 20px",
          background: "#3498db",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        startTransition 리렌더 트리거 (빠르게 여러번 클릭)
      </button>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 400 }}>
          <div style={{ border: "2px solid #e74c3c", padding: 12, borderRadius: 8 }}>
            <h4>❌ 직접 외부 스토어 읽기 (Tearing 가능)</h4>
            <p style={{ fontSize: 12, color: "#666" }}>
              각 셀이 렌더링 시점에 외부 스토어를 직접 읽음 — 렌더 도중 값이 바뀌면 셀마다 다른 색상 표시
            </p>
            <div key={renderKey} style={{ display: "flex", flexWrap: "wrap" }}>
              {cells.map((i) => (
                <HeavyCell key={i} label={`${i}`} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 400 }}>
          <div style={{ border: "2px solid #27ae60", padding: 12, borderRadius: 8 }}>
            <h4>✅ useSyncExternalStore (Tearing 방지)</h4>
            <p style={{ fontSize: 12, color: "#666" }}>
              useSyncExternalStore가 SyncLane으로 동기 렌더링 — 모든 셀이 동일한 색상
            </p>
            <div key={renderKey} style={{ display: "flex", flexWrap: "wrap" }}>
              {cells.map((i) => (
                <SafeCell key={i} label={`${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#f8f9fa",
          padding: 8,
          borderRadius: 4,
          maxHeight: 100,
          overflow: "auto",
          fontSize: 12,
          marginTop: 12,
        }}
      >
        <strong>로그:</strong>
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}

export default function Demo2_Tearing() {
  return (
    <div>
      <h2>Demo 2: Concurrent 모드의 Tearing 문제</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        외부 스토어 색상이 50ms마다 랜덤 변경됩니다. 리렌더 버튼을 빠르게 클릭하면, 직접 읽기 쪽에서 셀마다
        다른 색상이 보일 수 있습니다 (Tearing).
      </p>
      <TearingDemo />
    </div>
  );
}

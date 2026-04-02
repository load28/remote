import { useState } from "react";
import Demo1_RaceCondition from "./demos/Demo1_RaceCondition";
import Demo2_Tearing from "./demos/Demo2_Tearing";
import Demo3_LocalStorage from "./demos/Demo3_LocalStorage";
import Demo4_DeferredValue from "./demos/Demo4_DeferredValue";
import Demo5_SuspenseFallback from "./demos/Demo5_SuspenseFallback";

const demos = [
  { id: 1, title: "Race Condition", component: Demo1_RaceCondition },
  { id: 2, title: "Tearing", component: Demo2_Tearing },
  { id: 3, title: "localStorage + useSyncExternalStore", component: Demo3_LocalStorage },
  { id: 4, title: "useDeferredValue 조합", component: Demo4_DeferredValue },
  { id: 5, title: "Suspense Fallback 문제", component: Demo5_SuspenseFallback },
] as const;

export default function App() {
  const [activeDemo, setActiveDemo] = useState(1);
  const ActiveComponent = demos.find((d) => d.id === activeDemo)!.component;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      <header style={{ marginBottom: 24, borderBottom: "2px solid #eee", paddingBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>
          React 외부 스토어 완전 가이드 — 검증 데모
        </h1>
        <p style={{ color: "#666", margin: "8px 0 0" }}>
          useEffect의 한계부터 useSyncExternalStore의 내부 동작까지 — 실제 동작 검증
        </p>
      </header>

      <nav style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {demos.map((demo) => (
          <button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            style={{
              padding: "10px 20px",
              background: activeDemo === demo.id ? "#2c3e50" : "#ecf0f1",
              color: activeDemo === demo.id ? "white" : "#2c3e50",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeDemo === demo.id ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Demo {demo.id}: {demo.title}
          </button>
        ))}
      </nav>

      <main style={{ minHeight: 600 }}>
        <ActiveComponent />
      </main>

      <footer style={{ marginTop: 40, padding: "16px 0", borderTop: "1px solid #eee", color: "#999", fontSize: 12 }}>
        React 19 | useSyncExternalStore + useDeferredValue + Suspense 검증 프로젝트
      </footer>
    </div>
  );
}

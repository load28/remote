import { useMemo, useSyncExternalStore } from "react";
import { createLocalStorageStore } from "../stores/localStorageStore";

function useLocalStorage(key: string) {
  const store = useMemo(() => createLocalStorageStore(key), [key]);

  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return [value, store.setValue] as const;
}

// 같은 key를 구독하는 두 개의 독립 컴포넌트
function ThemeDisplay() {
  const [theme] = useLocalStorage("demo-theme");
  return (
    <div
      style={{
        padding: 20,
        background: theme === "dark" ? "#2c3e50" : "#ecf0f1",
        color: theme === "dark" ? "white" : "black",
        borderRadius: 8,
        transition: "all 0.3s",
      }}
    >
      <h4>컴포넌트 A — ThemeDisplay</h4>
      <p>
        현재 테마: <strong>{theme ?? "설정 없음"}</strong>
      </p>
      <p style={{ fontSize: 12 }}>useSyncExternalStore로 localStorage 구독 중</p>
    </div>
  );
}

function ThemeStatus() {
  const [theme] = useLocalStorage("demo-theme");
  return (
    <div
      style={{
        padding: 20,
        background: theme === "dark" ? "#34495e" : "#dfe6e9",
        color: theme === "dark" ? "white" : "black",
        borderRadius: 8,
        transition: "all 0.3s",
      }}
    >
      <h4>컴포넌트 B — ThemeStatus</h4>
      <p>
        테마 상태: {theme === "dark" ? "🌙 다크 모드" : theme === "light" ? "☀️ 라이트 모드" : "❓ 미설정"}
      </p>
      <p style={{ fontSize: 12 }}>
        동일한 key를 구독하는 별도의 컴포넌트 — 값이 동기화됨
      </p>
    </div>
  );
}

function UserNameInput() {
  const [name, setName] = useLocalStorage("demo-username");
  return (
    <div style={{ padding: 20, background: "#f8f9fa", borderRadius: 8 }}>
      <h4>컴포넌트 C — UserName</h4>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={name ?? ""}
          onChange={(e) => setName(e.target.value || null)}
          placeholder="이름을 입력하세요"
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc", fontSize: 14 }}
        />
        <span>저장된 값: {name ?? "(없음)"}</span>
      </div>
      <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        입력 즉시 localStorage에 저장 → 같은 key를 구독하는 모든 컴포넌트에 반영
      </p>
    </div>
  );
}

function UserNameDisplay() {
  const [name] = useLocalStorage("demo-username");
  return (
    <div style={{ padding: 20, background: "#f0f0f0", borderRadius: 8 }}>
      <h4>컴포넌트 D — UserNameDisplay</h4>
      <p style={{ fontSize: 18 }}>
        안녕하세요, <strong>{name || "방문자"}</strong>님!
      </p>
    </div>
  );
}

export default function Demo3_LocalStorage() {
  const [, setTheme] = useLocalStorage("demo-theme");

  return (
    <div>
      <h2>Demo 3: localStorage를 useSyncExternalStore로 다루기</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        같은 localStorage key를 구독하는 여러 컴포넌트가 자동으로 동기화됩니다. 같은 탭 내 변경도 감지합니다.
      </p>

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => setTheme("light")}
          style={{
            padding: "10px 20px",
            background: "#f1c40f",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ☀️ Light 테마
        </button>
        <button
          onClick={() => setTheme("dark")}
          style={{
            padding: "10px 20px",
            background: "#2c3e50",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          🌙 Dark 테마
        </button>
        <button
          onClick={() => setTheme(null)}
          style={{
            padding: "10px 20px",
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ❌ 테마 삭제
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <ThemeDisplay />
        <ThemeStatus />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <UserNameInput />
        <UserNameDisplay />
      </div>
    </div>
  );
}

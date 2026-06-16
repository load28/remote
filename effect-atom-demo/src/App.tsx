import { useState } from "react"
import { RegistryContext, Registry } from "@effect-atom/atom-react"
import { CounterDemo } from "./components/CounterDemo"
import { UsersDemo } from "./components/UsersDemo"
import { StreamDemo } from "./components/StreamDemo"
import { TodoDemo } from "./components/TodoDemo"
import "./App.css"

type Tab = "counter" | "users" | "stream" | "todo"

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "counter", label: "기본 아톰", icon: "🔢" },
  { key: "users", label: "Effectful & Family", icon: "👥" },
  { key: "stream", label: "Stream", icon: "⏱" },
  { key: "todo", label: "Atom.fn & 뮤테이션", icon: "📝" },
]

function AppContent() {
  const [tab, setTab] = useState<Tab>("counter")

  return (
    <div className="app">
      <header className="app-header">
        <h1>Effect Atom 데모</h1>
        <p className="subtitle">
          <code>@effect-atom/atom-react</code> — Effect의 타입 안전성과 React의 반응성을 결합
        </p>
      </header>

      <nav className="tab-nav">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            <span className="tab-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === "counter" && <CounterDemo />}
        {tab === "users" && <UsersDemo />}
        {tab === "stream" && <StreamDemo />}
        {tab === "todo" && <TodoDemo />}
      </main>

      <footer className="app-footer">
        <div className="features-summary">
          <h3>Effect Atom이 해결하는 문제들</h3>
          <div className="feature-grid">
            <div className="feature">
              <strong>타입 안전한 에러 핸들링</strong>
              <p>Result&lt;A, E&gt;로 loading/success/failure를 컴파일 타임에 보장</p>
            </div>
            <div className="feature">
              <strong>선언적 의존성 주입</strong>
              <p>Effect Layer/Service를 Atom.runtime으로 React에 자연스럽게 연결</p>
            </div>
            <div className="feature">
              <strong>자동 리소스 관리</strong>
              <p>Scope를 통해 Stream 구독, WebSocket 등 리소스를 자동 정리</p>
            </div>
            <div className="feature">
              <strong>구조적 동시성</strong>
              <p>Effect의 Fiber 기반 동시성으로 경쟁 조건 없는 비동기 처리</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const registry = Registry.make()

export default function App() {
  return (
    <RegistryContext.Provider value={registry}>
      <AppContent />
    </RegistryContext.Provider>
  )
}

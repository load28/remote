import { useAtom, useAtomValue } from "@effect-atom/atom-react"
import { countAtom, doubleCountAtom, countLabelAtom, persistentCountAtom } from "../atoms/counter"

export function CounterDemo() {
  const [count, setCount] = useAtom(countAtom)
  const doubleCount = useAtomValue(doubleCountAtom)
  const label = useAtomValue(countLabelAtom)
  const [persistent, setPersistent] = useAtom(persistentCountAtom)

  return (
    <section className="demo-section">
      <h2>1. 기본 아톰 & 파생 상태</h2>
      <p className="demo-desc">
        <code>Atom.make(value)</code>로 상태를 만들고, <code>Atom.make(get =&gt; ...)</code>로 파생 상태를 자동 계산합니다.
      </p>

      <div className="card-row">
        <div className="card">
          <h3>카운터</h3>
          <div className="counter-display">{count}</div>
          <div className="button-row">
            <button onClick={() => setCount((c) => c - 1)}>-1</button>
            <button onClick={() => setCount(0)}>리셋</button>
            <button onClick={() => setCount((c) => c + 1)}>+1</button>
          </div>
        </div>

        <div className="card">
          <h3>파생 상태</h3>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">2배 값</span>
              <span className="stat-value">{doubleCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">메시지</span>
              <span className="stat-value text-sm">{label}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>keepAlive 아톰</h3>
          <p className="text-muted">탭을 전환해도 값이 유지됩니다</p>
          <div className="counter-display">{persistent}</div>
          <div className="button-row">
            <button onClick={() => setPersistent((c) => c - 1)}>-1</button>
            <button onClick={() => setPersistent((c) => c + 1)}>+1</button>
          </div>
        </div>
      </div>

      <details className="code-hint">
        <summary>코드 보기</summary>
        <pre>{`// 기본 Writable 아톰
const countAtom = Atom.make(0)

// 파생 읽기 전용 아톰
const doubleCountAtom = Atom.make((get) => get(countAtom) * 2)

// 언마운트 후에도 상태 유지
const persistentCountAtom = Atom.keepAlive(Atom.make(0))`}</pre>
      </details>
    </section>
  )
}

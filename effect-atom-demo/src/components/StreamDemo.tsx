import { useAtom, useAtomValue, useAtomSet } from "@effect-atom/atom-react"
import { Result } from "@effect-atom/atom"
import { clockAtom, stopwatchRunningAtom, stopwatchAtom, infiniteNumbersAtom } from "../atoms/stream"

function formatTime(date: Date) {
  return date.toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function formatStopwatch(ms: number) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const centiseconds = Math.floor((ms % 1000) / 10)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`
}

function Clock() {
  const result = useAtomValue(clockAtom)

  return Result.match(result, {
    onInitial: () => <span className="clock">--:--:--</span>,
    onWaiting: () => <span className="clock">--:--:--</span>,
    onFailure: () => <span className="clock error">오류</span>,
    onSuccess: (date) => <span className="clock">{formatTime(date)}</span>,
  })
}

function Stopwatch() {
  const result = useAtomValue(stopwatchAtom)
  const [running, setRunning] = useAtom(stopwatchRunningAtom)

  const elapsed = Result.match(result, {
    onInitial: () => 0,
    onWaiting: (prev) => prev ?? 0,
    onFailure: () => 0,
    onSuccess: (ms) => ms,
  })

  return (
    <div>
      <div className="stopwatch-display">{formatStopwatch(elapsed)}</div>
      <div className="button-row">
        <button onClick={() => setRunning(!running)}>
          {running ? "⏸ 정지" : "▶ 시작"}
        </button>
      </div>
    </div>
  )
}

function InfiniteNumbers() {
  const result = useAtomValue(infiniteNumbersAtom)
  const pull = useAtomSet(infiniteNumbersAtom)

  const items = Result.match(result, {
    onInitial: () => ({ items: [] as Array<{ id: number; value: number }>, done: false }),
    onWaiting: (prev) => prev ?? { items: [] as Array<{ id: number; value: number }>, done: false },
    onFailure: () => ({ items: [] as Array<{ id: number; value: number }>, done: false }),
    onSuccess: (data) => data,
  })

  return (
    <div>
      <button onClick={() => pull()} className="btn-primary">
        다음 값 가져오기 →
      </button>
      <div className="number-list">
        {items.items.map((item) => (
          <div key={item.id} className="number-item">
            <span className="number-id">#{item.id}</span>
            <span className="number-value">{item.value.toFixed(2)}</span>
          </div>
        ))}
        {items.items.length === 0 && (
          <p className="text-muted">버튼을 눌러 스트림에서 값을 가져오세요</p>
        )}
      </div>
    </div>
  )
}

export function StreamDemo() {
  return (
    <section className="demo-section">
      <h2>3. Stream 아톰</h2>
      <p className="demo-desc">
        <code>Stream</code>을 반환하면 실시간 값을 자동 구독합니다.
        <code>Atom.pull</code>로 무한 스크롤/페이지네이션 패턴을 구현합니다.
        언마운트 시 <code>Scope</code>를 통해 자동 정리됩니다.
      </p>

      <div className="card-row">
        <div className="card">
          <h3>실시간 시계 (Stream)</h3>
          <Clock />
        </div>

        <div className="card">
          <h3>스톱워치 (조건부 Stream)</h3>
          <Stopwatch />
        </div>

        <div className="card">
          <h3>Pull 스트림 (페이지네이션)</h3>
          <InfiniteNumbers />
        </div>
      </div>

      <details className="code-hint">
        <summary>코드 보기</summary>
        <pre>{`// Stream 아톰 - 1초마다 현재 시간 방출
const clockAtom = Atom.make(
  Stream.fromSchedule(Schedule.spaced("1 second")).pipe(
    Stream.map(() => new Date()),
  )
)

// Pull 아톰 - 수동으로 다음 값 가져오기
const infiniteNumbersAtom = Atom.pull(
  Stream.fromSchedule(Schedule.forever).pipe(
    Stream.map(() => ({ id: ++counter, value: Math.random() * 100 })),
    Stream.tap(() => Effect.sleep("300 millis")),
  )
)`}</pre>
      </details>
    </section>
  )
}

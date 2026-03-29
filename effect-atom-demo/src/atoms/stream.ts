import { Atom } from "@effect-atom/atom-react"
import { Effect, Stream, Schedule } from "effect"

// Stream 아톰 - Effect Stream을 구독하여 실시간 값을 받음
// 컴포넌트 언마운트 시 자동 정리 (Scope를 통한 리소스 관리)
export const clockAtom = Atom.make(
  Stream.fromSchedule(Schedule.spaced("1 second")).pipe(
    Stream.map(() => new Date()),
  )
)

// 스톱워치 - 시작/중지 가능한 스트림 아톰
export const stopwatchRunningAtom = Atom.make(false)

export const stopwatchAtom = Atom.make((get) => {
  const running = get(stopwatchRunningAtom)
  if (!running) {
    return Effect.succeed(get.self<number>() ?? 0)
  }
  const start = Date.now() - (get.self<number>() ?? 0)
  return Stream.fromSchedule(Schedule.spaced("10 millis")).pipe(
    Stream.map(() => Date.now() - start),
  )
})

// Pull 아톰 - 무한 스크롤/페이지네이션 패턴
// "다음 값 가져오기" 패턴을 스트림으로 우아하게 구현
let pullCounter = 0
export const infiniteNumbersAtom = Atom.pull(
  Stream.fromSchedule(Schedule.forever).pipe(
    Stream.map(() => {
      pullCounter++
      return { id: pullCounter, value: Math.random() * 100 }
    }),
    Stream.tap(() => Effect.sleep("300 millis")), // 로딩 시뮬레이션
  )
)

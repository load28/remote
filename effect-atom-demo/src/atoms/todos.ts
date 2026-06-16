import { Atom } from "@effect-atom/atom-react"
import { Effect } from "effect"
import { TodoService } from "../services/TodoService"
import { AppRuntime } from "./runtime"

// 리프레시 트리거 아톰
const todoRefreshAtom = Atom.make(0)

// Effectful 아톰 - Todo 목록 로딩
// AppRuntime.atom()으로 Layer가 자동 제공됨
export const todosAtom = AppRuntime.atom((get) =>
  Effect.gen(function* () {
    // todoRefreshAtom이 변경되면 이 아톰이 재실행됨
    get(todoRefreshAtom)
    const service = yield* TodoService
    return yield* service.getAll
  })
)

// Atom.fn - Effect를 실행하는 함수형 아톰
// 파라미터를 받아 Effect를 실행하고 Result를 반환
// AppRuntime.fn()으로 Layer 자동 제공 + 뮤테이션 후 목록 새로고침
export const addTodoAtom = AppRuntime.fn((title: string, get) =>
  Effect.gen(function* () {
    const service = yield* TodoService
    const result = yield* service.add(title)
    get.set(todoRefreshAtom, (n) => n + 1)
    return result
  })
)

export const toggleTodoAtom = AppRuntime.fn((id: string, get) =>
  Effect.gen(function* () {
    const service = yield* TodoService
    yield* service.toggle(id)
    get.set(todoRefreshAtom, (n) => n + 1)
  })
)

export const removeTodoAtom = AppRuntime.fn((id: string, get) =>
  Effect.gen(function* () {
    const service = yield* TodoService
    yield* service.remove(id)
    get.set(todoRefreshAtom, (n) => n + 1)
  })
)

// 필터 아톰
export type TodoFilter = "all" | "active" | "completed"
export const todoFilterAtom = Atom.make<TodoFilter>("all")

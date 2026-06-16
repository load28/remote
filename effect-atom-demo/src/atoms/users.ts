import { Atom } from "@effect-atom/atom-react"
import { Effect } from "effect"
import { UserService } from "../services/UserService"
import { AppRuntime } from "./runtime"

// Effectful 아톰 - Effect를 실행하고 Result<A, E> 타입을 반환
// loading | success | failure 상태를 타입 안전하게 관리
// AppRuntime.atom()을 사용하면 자동으로 Layer가 제공됨
export const usersAtom = AppRuntime.atom(
  Effect.gen(function* () {
    const service = yield* UserService
    return yield* service.fetchUsers
  })
)

// Atom.family - 파라미터별로 독립적인 아톰 인스턴스 생성
// 같은 id로 호출하면 항상 같은 아톰 참조 반환 (메모이제이션)
export const userByIdAtom = Atom.family((id: number) =>
  AppRuntime.atom(
    Effect.gen(function* () {
      const service = yield* UserService
      return yield* service.fetchUser(id)
    })
  )
)

// 선택된 유저 ID 아톰
export const selectedUserIdAtom = Atom.make<number | null>(null)

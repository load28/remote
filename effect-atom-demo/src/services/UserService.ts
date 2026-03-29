import { Context, Effect, Layer, Schedule } from "effect"

export interface User {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly avatar: string
}

export class UserNotFoundError {
  readonly _tag = "UserNotFoundError"
  constructor(readonly id: number) {}
}

export class NetworkError {
  readonly _tag = "NetworkError"
  constructor(readonly message: string) {}
}

export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    readonly fetchUsers: Effect.Effect<ReadonlyArray<User>, NetworkError>
    readonly fetchUser: (id: number) => Effect.Effect<User, UserNotFoundError | NetworkError>
  }
>() {}

const MOCK_USERS: ReadonlyArray<User> = [
  { id: 1, name: "김민수", email: "minsu@example.com", avatar: "👨‍💻" },
  { id: 2, name: "이서연", email: "seoyeon@example.com", avatar: "👩‍🔬" },
  { id: 3, name: "박지호", email: "jiho@example.com", avatar: "👨‍🎨" },
  { id: 4, name: "최유진", email: "yujin@example.com", avatar: "👩‍🚀" },
  { id: 5, name: "정태현", email: "taehyun@example.com", avatar: "👨‍🏫" },
]

const makeUserService = Effect.sync(() => {
  let requestCount = 0

  return UserService.of({
    fetchUsers: Effect.gen(function* () {
      requestCount++
      yield* Effect.sleep("800 millis")
      // 세 번째 요청마다 네트워크 에러 시뮬레이션
      if (requestCount % 3 === 0) {
        return yield* Effect.fail(new NetworkError("서버 연결이 불안정합니다"))
      }
      return MOCK_USERS
    }).pipe(
      Effect.retry(Schedule.recurs(1).pipe(Schedule.addDelay(() => "500 millis")))
    ),
    fetchUser: (id: number) =>
      Effect.gen(function* () {
        yield* Effect.sleep("400 millis")
        const user = MOCK_USERS.find((u) => u.id === id)
        if (!user) return yield* Effect.fail(new UserNotFoundError(id))
        return user
      }),
  })
})

export const UserServiceLive = Layer.effect(UserService, makeUserService)

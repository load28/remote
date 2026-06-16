import { useAtom, useAtomValue, useAtomRefresh } from "@effect-atom/atom-react"
import { Result } from "@effect-atom/atom"
import { usersAtom, selectedUserIdAtom, userByIdAtom } from "../atoms/users"

function UserCard({ id }: { id: number }) {
  const result = useAtomValue(userByIdAtom(id))

  return Result.match(result, {
    onInitial: () => <div className="user-detail loading">로딩 준비 중...</div>,
    onWaiting: () => <div className="user-detail loading">불러오는 중...</div>,
    onFailure: (error) => (
      <div className="user-detail error">
        <span>❌ {error._tag === "UserNotFoundError" ? `유저 #${error.id}를 찾을 수 없습니다` : error.message}</span>
      </div>
    ),
    onSuccess: (user) => (
      <div className="user-detail">
        <span className="avatar-large">{user.avatar}</span>
        <h4>{user.name}</h4>
        <p>{user.email}</p>
      </div>
    ),
  })
}

export function UsersDemo() {
  const result = useAtomValue(usersAtom)
  const [selectedId, setSelectedId] = useAtom(selectedUserIdAtom)
  const refreshUsers = useAtomRefresh(usersAtom)

  return (
    <section className="demo-section">
      <h2>2. Effectful 아톰 & Family</h2>
      <p className="demo-desc">
        <code>Effect</code>를 반환하면 자동으로 <code>Result&lt;A, E&gt;</code> 타입이 됩니다.
        loading/success/failure 상태를 타입 안전하게 패턴 매칭합니다.
        <code>Atom.family</code>로 파라미터별 독립 아톰을 생성합니다.
      </p>

      <div className="card-row">
        <div className="card wide">
          <div className="card-header">
            <h3>유저 목록</h3>
            <button onClick={refreshUsers} className="btn-icon" title="새로고침">🔄</button>
          </div>

          {Result.match(result, {
            onInitial: () => <div className="loading-bar">초기화 중...</div>,
            onWaiting: () => <div className="loading-bar">불러오는 중...</div>,
            onFailure: (error) => (
              <div className="error-box">
                <p>⚠️ {error.message}</p>
                <button onClick={refreshUsers}>다시 시도</button>
              </div>
            ),
            onSuccess: (users) => (
              <div className="user-list">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`user-item ${selectedId === user.id ? "selected" : ""}`}
                    onClick={() => setSelectedId(user.id)}
                  >
                    <span className="avatar">{user.avatar}</span>
                    <span>{user.name}</span>
                  </div>
                ))}
              </div>
            ),
          })}
        </div>

        <div className="card">
          <h3>유저 상세 (Family)</h3>
          {selectedId === null ? (
            <p className="text-muted">유저를 선택하세요</p>
          ) : (
            <UserCard id={selectedId} />
          )}
        </div>
      </div>

      <details className="code-hint">
        <summary>코드 보기</summary>
        <pre>{`// Effectful 아톰 - Result<User[], NetworkError> 반환
const usersAtom = Atom.make((get) => {
  const runtime = get(AppRuntime)
  return Effect.gen(function* () {
    const service = yield* UserService
    return yield* service.fetchUsers
  }).pipe(Effect.provide(runtime))
})

// Atom.family - id별 독립 인스턴스
const userByIdAtom = Atom.family((id: number) =>
  Atom.make((get) => ...)
)

// 패턴 매칭으로 모든 상태를 타입 안전하게 처리
Result.match(result, {
  onInitial: () => ...,
  onWaiting: () => ...,
  onFailure: (error) => ...,  // error: NetworkError
  onSuccess: (users) => ...,  // users: User[]
})`}</pre>
      </details>
    </section>
  )
}

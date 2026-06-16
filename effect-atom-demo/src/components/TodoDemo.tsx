import { useState } from "react"
import { useAtom, useAtomValue, useAtomSet } from "@effect-atom/atom-react"
import { Result } from "@effect-atom/atom"
import { todosAtom, addTodoAtom, toggleTodoAtom, removeTodoAtom, todoFilterAtom, type TodoFilter } from "../atoms/todos"
import type { Todo } from "../services/TodoService"

const FILTER_LABELS: Record<TodoFilter, string> = {
  all: "전체",
  active: "미완료",
  completed: "완료",
}

function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useAtomSet(toggleTodoAtom)
  const removeTodo = useAtomSet(removeTodoAtom)

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <button className="todo-check" onClick={() => toggleTodo(todo.id)}>
        {todo.completed ? "✅" : "⬜"}
      </button>
      <span className="todo-title">{todo.title}</span>
      <button className="todo-delete" onClick={() => removeTodo(todo.id)}>✕</button>
    </div>
  )
}

export function TodoDemo() {
  const [newTitle, setNewTitle] = useState("")
  const result = useAtomValue(todosAtom)
  const addTodo = useAtomSet(addTodoAtom)
  const [filter, setFilter] = useAtom(todoFilterAtom)

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    addTodo(title)
    setNewTitle("")
  }

  const todos = Result.match(result, {
    onInitial: () => null,
    onWaiting: () => null,
    onFailure: () => null,
    onSuccess: (todos) => todos,
  })

  const filteredTodos = todos?.filter((todo) => {
    if (filter === "active") return !todo.completed
    if (filter === "completed") return todo.completed
    return true
  })

  const stats = todos
    ? { total: todos.length, active: todos.filter((t) => !t.completed).length, completed: todos.filter((t) => t.completed).length }
    : null

  return (
    <section className="demo-section">
      <h2>4. Atom.fn & 뮤테이션</h2>
      <p className="demo-desc">
        <code>Atom.fn</code>으로 파라미터를 받는 Effect 함수를 만듭니다.
        서비스 레이어를 통한 의존성 주입과 <code>Atom.runtime</code>으로 Effect Layer를 React에 연결합니다.
      </p>

      <div className="card-row">
        <div className="card wide">
          <h3>할 일 목록</h3>

          <div className="todo-input-row">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="새 할 일을 입력하세요..."
              className="todo-input"
            />
            <button onClick={handleAdd} className="btn-primary">추가</button>
          </div>

          <div className="filter-row">
            {(Object.entries(FILTER_LABELS) as Array<[TodoFilter, string]>).map(([key, label]) => (
              <button
                key={key}
                className={`filter-btn ${filter === key ? "active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
                {stats && key === "active" && ` (${stats.active})`}
                {stats && key === "completed" && ` (${stats.completed})`}
              </button>
            ))}
          </div>

          {Result.match(result, {
            onInitial: () => <div className="loading-bar">초기화 중...</div>,
            onWaiting: () => <div className="loading-bar">불러오는 중...</div>,
            onFailure: (error) => <div className="error-box">⚠️ {String(error)}</div>,
            onSuccess: () => (
              <div className="todo-list">
                {filteredTodos && filteredTodos.length > 0 ? (
                  filteredTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
                ) : (
                  <p className="text-muted">
                    {filter === "all" ? "할 일이 없습니다" : `${FILTER_LABELS[filter]} 항목이 없습니다`}
                  </p>
                )}
              </div>
            ),
          })}
        </div>

        <div className="card">
          <h3>아키텍처</h3>
          <div className="architecture-diagram">
            <div className="arch-layer">
              <span className="arch-label">React</span>
              <code>useAtomValue / useAtomSet</code>
            </div>
            <div className="arch-arrow">↕</div>
            <div className="arch-layer">
              <span className="arch-label">Atom</span>
              <code>todosAtom / addTodoAtom</code>
            </div>
            <div className="arch-arrow">↕</div>
            <div className="arch-layer">
              <span className="arch-label">Effect</span>
              <code>Effect.gen / Effect.provide</code>
            </div>
            <div className="arch-arrow">↕</div>
            <div className="arch-layer">
              <span className="arch-label">Service</span>
              <code>TodoService (Layer)</code>
            </div>
          </div>
        </div>
      </div>

      <details className="code-hint">
        <summary>코드 보기</summary>
        <pre>{`// Atom.fn - 파라미터를 받아 Effect 실행
const addTodoAtom = Atom.fn((title: string, get) =>
  Effect.gen(function* () {
    const runtime = get(AppRuntime)
    const result = yield* Effect.gen(function* () {
      const service = yield* TodoService
      return yield* service.add(title)
    }).pipe(Effect.provide(runtime))
    get.set(todoRefreshAtom, (n) => n + 1)
    return result
  })
)

// Runtime - Layer를 React에 연결
const AppRuntime = Atom.runtime(
  Layer.mergeAll(TodoServiceLive, UserServiceLive)
)

// 컴포넌트에서 사용
const addTodo = useAtomSet(addTodoAtom)
addTodo("새 할 일")`}</pre>
      </details>
    </section>
  )
}

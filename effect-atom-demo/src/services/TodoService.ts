import { Context, Effect, Layer } from "effect"

export interface Todo {
  readonly id: string
  readonly title: string
  readonly completed: boolean
  readonly createdAt: number
}

export class TodoService extends Context.Tag("TodoService")<
  TodoService,
  {
    readonly getAll: Effect.Effect<ReadonlyArray<Todo>>
    readonly add: (title: string) => Effect.Effect<Todo>
    readonly toggle: (id: string) => Effect.Effect<Todo>
    readonly remove: (id: string) => Effect.Effect<void>
  }
>() {}

const makeTodoService = Effect.sync(() => {
  let todos: Array<Todo> = [
    { id: "1", title: "Effect Atom 배우기", completed: false, createdAt: Date.now() - 3000 },
    { id: "2", title: "데모 앱 만들기", completed: true, createdAt: Date.now() - 2000 },
    { id: "3", title: "Effect 패턴 익히기", completed: false, createdAt: Date.now() - 1000 },
  ]

  return TodoService.of({
    getAll: Effect.sync(() => [...todos]),
    add: (title: string) =>
      Effect.sync(() => {
        const todo: Todo = {
          id: crypto.randomUUID(),
          title,
          completed: false,
          createdAt: Date.now(),
        }
        todos = [todo, ...todos]
        return todo
      }),
    toggle: (id: string) =>
      Effect.sync(() => {
        const index = todos.findIndex((t) => t.id === id)
        if (index === -1) throw new Error(`Todo not found: ${id}`)
        todos[index] = { ...todos[index], completed: !todos[index].completed }
        return todos[index]
      }),
    remove: (id: string) =>
      Effect.sync(() => {
        todos = todos.filter((t) => t.id !== id)
      }),
  })
})

export const TodoServiceLive = Layer.effect(TodoService, makeTodoService)

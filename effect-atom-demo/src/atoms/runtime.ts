import { Atom } from "@effect-atom/atom-react"
import { Layer } from "effect"
import { TodoServiceLive } from "../services/TodoService"
import { UserServiceLive } from "../services/UserService"

const MainLayer = Layer.mergeAll(TodoServiceLive, UserServiceLive)

export const AppRuntime = Atom.runtime(MainLayer)

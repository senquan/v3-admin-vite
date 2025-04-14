import type * as Todo from "./type"
import { request } from "@/http/axios"

export function toggleTodo(id: number) {
  return request<Todo.TodoActionResponseData>({
    url: `todolist/${id}/toggle`,
    method: "patch"
  })
}

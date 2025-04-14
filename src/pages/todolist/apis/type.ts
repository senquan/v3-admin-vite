export interface UpdateTodoRequestParams {
  id: number
  done?: number
}

export interface TodoActionResponseData {
  code: number
  message: string
}
export interface Notification {
  id: number
  avatar?: string
  title: string
  datetime?: string
  description?: string
  status?: "primary" | "success" | "info" | "warning" | "danger"
  extra?: string
  type?: NotifyType
  is_read?: boolean
}

export type NotifyType = "notification" | "message" | "todo"

export interface NotifyListResponseData {
  code: number
  message: string
  data: {
    notifications: Notification[]
  }
}

export interface NotifyDetailResponseData {
  code: number
  message: string
  data: Notification
}

export interface NotifyUnreadCountResponseData {
  code: number
  message: string
  data: {
    type: NotifyType
    count: number
  }
}

export interface NotifyListRequestParams {
  ids?: string
  keyword?: string
  type?: "notification" | "message" | "todo"
  sort?: string
  is_read?: boolean
  page?: number
  pageSize?: number
}

export interface NotifyActionResponseData {
  code: number
  message: string
}

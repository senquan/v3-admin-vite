import type { NotifyItem } from "./type"
import { fetchList, fetchUnreadCounts, updateReadStatusBatch } from "@@/apis/notify"

// 响应式数据存储
export const notifyData = ref<NotifyItem[]>([])
export const messageData = ref<NotifyItem[]>([])
export const todoData = ref<NotifyItem[]>([])

// 加载状态
export const loading = ref(false)

// 未读数量统计
export const unreadCounts = reactive({
  notification: 0,
  message: 0,
  todo: 0
})

// 转换后端数据格式到前端格式
function transformNotificationData(backendData: any): NotifyItem {
  return {
    id: backendData.id,
    type: backendData.type,
    avatar: backendData.avatar,
    title: backendData.title,
    datetime: backendData.extra || formatRelativeTime(backendData.created_at),
    description: backendData.description,
    status: backendData.status,
    extra: backendData.extra,
    unread: backendData.unread === 0
  }
}

// 格式化相对时间
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "刚刚"
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 获取通知列表
export async function fetchNotifications(params: {
  type?: "notification" | "message" | "todo"
  page?: number
  pageSize?: number
  is_read?: boolean
} = {}) {
  try {
    loading.value = true
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value))
      }
    })

    const response = await fetchList({
      page: params.page,
      pageSize: params.pageSize,
      is_read: params.is_read
    })

    if (response.code === 0) {
      notifyData.value = []
      messageData.value = []
      todoData.value = []
      const transformedData = response.data.notifications.map(transformNotificationData)

      for (const item of transformedData) {
        switch (item.type) {
          case "notification":
            notifyData.value.push(item)
            break
          case "message":
            messageData.value.push(item)
            break
          case "todo":
            todoData.value.push(item)
            break
          default:
            notifyData.value.push(item)
        }
      }
      return response.data
    }
    throw new Error(response.message || "获取通知失败")
  } catch (error) {
    console.error("获取通知失败:", error)
    throw error
  } finally {
    loading.value = false
  }
}

// 获取未读通知数量
export async function getUnreadCounts() {
  try {
    const response = await fetchUnreadCounts({})
    if (response.code === 0) {
      const results = response.data
      Object.entries(results).forEach(([type, count]) => {
        unreadCounts[type as keyof typeof unreadCounts] = Number(count)
      })
    }
    return unreadCounts
  } catch (error) {
    console.error("获取未读数量失败:", error)
    throw error
  }
}

// 批量标记为已读
export async function markBatchAsRead(ids: number[]) {
  try {
    const response = await updateReadStatusBatch({ ids })

    if (response.code === 0) {
      await getUnreadCounts()
      return true
    }
    throw new Error(response.message || "批量标记已读失败")
  } catch (error) {
    console.error("批量标记已读失败:", error)
    throw error
  }
}

// 全部标记为已读
export async function markAllAsRead(type?: "notification" | "message" | "todo") {
  try {
    const body = type ? { type } : {}
    const response = await updateReadStatusBatch(body)

    if (response.code === 0) {
      await getUnreadCounts()
      return true
    }
    throw new Error(response.message || "全部标记已读失败")
  } catch (error) {
    console.error("全部标记已读失败:", error)
    throw error
  }
}

// 初始化数据
export async function initNotificationData() {
  try {
    await fetchNotifications({ pageSize: 10 })
  } catch (error) {
    console.error("初始化通知数据失败:", error)
  }
}

// 自动刷新通知数据（可选）
export function startAutoRefresh(interval: number = 30000): ReturnType<typeof setInterval> {
  return setInterval(async () => {
    await getUnreadCounts().catch(console.error)
  }, interval)
}

// 停止自动刷新
export function stopAutoRefresh(intervalId: ReturnType<typeof setInterval>) {
  clearInterval(intervalId)
}

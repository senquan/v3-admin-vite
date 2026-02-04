import { useWebsocket } from "@@/composables/useWebsocket"
import { defineStore } from "pinia"
import { ref } from "vue"

// 消息订阅回调类型
export type MessageCallback<T = any> = (data: T) => void

export interface WebSocketState {
  url: string | null
}

export const useWebsocketStore = defineStore("websocket", () => {
  const websocket = useWebsocket()
  const url = ref<string | null>(null)

  // 订阅管理
  const subscriptions = ref<Map<string, Set<MessageCallback>>>(new Map())

  const _connect = (wsUrl: string, opts?: Parameters<typeof websocket.connect>[1]) => {
    // 避免重复连接到相同URL
    if (url.value === wsUrl && websocket.isConnected) return

    url.value = wsUrl
    opts &&= {
      ...opts,
      onMessage: (data: any) => {
        // 调用原始的onMessage
        opts?.onMessage?.(data)

        // 处理订阅的消息
        handleMessage(data)
      }
    }
    websocket.connect(wsUrl, opts)
  }

  const _reconnect = () => {
    if (url.value) {
      websocket.disconnect()
      websocket.connect(url.value)
    }
  }

  // 处理接收到的消息
  const handleMessage = (data: any) => {
    // 如果消息包含类型信息，根据类型分发给订阅者
    if (data && typeof data === "object" && data.type) {
      const messageType = data.type
      const subscribers = subscriptions.value.get(messageType)

      if (subscribers) {
        subscribers.forEach((callback) => {
          try {
            callback(data)
          } catch (error) {
            console.error(`Error in message callback for type ${messageType}:`, error)
          }
        })
      }
    }
  }

  // 订阅特定类型的消息
  const subscribe = <T = any>(messageType: string, callback: MessageCallback<T>) => {
    if (!subscriptions.value.has(messageType)) {
      subscriptions.value.set(messageType, new Set())
    }

    const subscribers = subscriptions.value.get(messageType)!
    subscribers.add(callback)

    // 返回取消订阅函数
    return () => {
      unsubscribe(messageType, callback)
    }
  }

  // 取消订阅特定类型的消息
  const unsubscribe = (messageType: string, callback: MessageCallback) => {
    const subscribers = subscriptions.value.get(messageType)
    if (subscribers) {
      subscribers.delete(callback)

      // 如果没有订阅者了，删除该类型
      if (subscribers.size === 0) {
        subscriptions.value.delete(messageType)
      }
    }
  }

  // 取消订阅特定类型的所有消息
  const unsubscribeAll = (messageType: string) => {
    subscriptions.value.delete(messageType)
  }

  // 获取订阅统计
  const getSubscriptionCount = (messageType: string) => {
    const subscribers = subscriptions.value.get(messageType)
    return subscribers ? subscribers.size : 0
  }

  // 自动连接WebSocket
  const defaultUrl = import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:5101"
  _connect(defaultUrl)

  return {
    // 状态
    readyState: websocket.readyState,
    isConnected: websocket.isConnected,
    error: websocket.error,
    lastMessage: websocket.lastMessage,
    url: url.value,
    message: [],
    // 方法
    connect: _connect,
    disconnect: websocket.disconnect,
    send: websocket.send,
    reconnect: _reconnect,
    // 订阅功能
    subscribe,
    unsubscribe,
    unsubscribeAll,
    getSubscriptionCount,
    // 配置
    options: {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      autoReconnect: true,
      timeout: 10000,
      onOpen: () => {},
      onMessage: () => {},
      onClose: () => {},
      onError: () => {}
    }
  }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useWebsocketStoreOutside() {
  return useWebsocketStore()
}

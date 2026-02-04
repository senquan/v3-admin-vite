import { onUnmounted, ref } from "vue"

const WS_OPEN = 1 // WebSocket.OPEN
const WS_CLOSED = 3 // WebSocket.CLOSED

interface WebSocketOptions {
  // 重连间隔时间
  reconnectInterval?: number
  // 最大重连次数
  maxReconnectAttempts?: number
  // 是否自动重连
  autoReconnect?: boolean
  // 自定义请求头
  headers?: Record<string, string>
  // 连接超时时间
  timeout?: number
  // 消息回调
  onOpen?: (event: Event) => void
  onMessage?: (data: any) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export interface WebSocketReturn {
  connect: (url: string, options?: WebSocketOptions) => void
  disconnect: () => void
  send: (data: string | ArrayBuffer | Blob) => void
  reconnect: () => void
  readyState: number
  isConnected: boolean
  error: Error | null
  lastMessage: any
}

export function useWebsocket(): WebSocketReturn {
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimeout: NodeJS.Timeout | null = null
  let connectTimeout: NodeJS.Timeout | null = null

  // 状态和数据
  const readyState = ref(WS_CLOSED)
  const isConnected = ref(false)
  const error = ref<Error | null>(null)
  const lastMessage = ref<any>(null)

  // 配置选项
  let options: Required<WebSocketOptions> = {
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    autoReconnect: true,
    headers: {},
    timeout: 10000,
    onOpen: () => {},
    onMessage: () => {},
    onClose: () => {},
    onError: () => {}
  }

  // 连接WebSocket
  const connect = (url: string, opts?: WebSocketOptions) => {
    if (ws) {
      disconnect()
    }

    // 合并选项
    if (opts) {
      options = { ...options, ...opts }
    }

    try {
      // 创建WebSocket连接
      ws = new WebSocket(url)

      // 设置连接超时
      connectTimeout = setTimeout(() => {
        if (readyState.value !== WS_OPEN) {
          disconnect()
          error.value = new Error("WebSocket连接超时")
        }
      }, options.timeout)

      // 监听连接打开
      ws.onopen = (event: Event) => {
        if (connectTimeout) {
          clearTimeout(connectTimeout)
          connectTimeout = null
        }
        readyState.value = ws?.readyState ?? WS_CLOSED
        isConnected.value = true
        error.value = null
        reconnectAttempts = 0
        options.onOpen?.(event)
      }

      // 监听消息
      ws.onmessage = (event: MessageEvent) => {
        try {
          // 尝试解析JSON数据
          const data = JSON.parse(event.data as string)
          lastMessage.value = data
          options.onMessage?.(data)
        } catch {
          // 如果不是JSON格式，直接返回原始数据
          lastMessage.value = event.data
          options.onMessage?.(event.data)
        }
      }

      // 监听连接关闭
      ws.onclose = (event: CloseEvent) => {
        readyState.value = WS_CLOSED
        isConnected.value = false
        options.onClose?.(event)

        // 如果是正常断开（主动调用disconnect），不进行重连
        if (options.autoReconnect && event.code !== 1000) {
          handleReconnect()
        }
      }

      // 监听连接错误
      ws.onerror = (event: Event) => {
        readyState.value = ws?.readyState ?? WS_CLOSED
        isConnected.value = false
        error.value = new Error("WebSocket连接错误")
        options.onError?.(event)

        if (options.autoReconnect) {
          handleReconnect()
        }
      }
    } catch (e) {
      error.value = e as Error
      handleReconnect()
    }
  }

  // 断开连接
  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (connectTimeout) {
      clearTimeout(connectTimeout)
      connectTimeout = null
    }

    if (ws) {
      ws.close(1000, "主动断开连接")
      ws = null
    }

    readyState.value = WS_CLOSED
    isConnected.value = false
  }

  // 发送消息
  const send = (data: string | ArrayBuffer | Blob) => {
    if (ws && isConnected.value && ws.readyState === WS_OPEN) {
      ws.send(data)
    } else {
      throw new Error("WebSocket未连接，无法发送消息")
    }
  }

  // 重连处理
  const handleReconnect = () => {
    if (reconnectAttempts < options.maxReconnectAttempts) {
      reconnectAttempts++

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }

      reconnectTimeout = setTimeout(() => {
        connect(getCurrentWsUrl(), options)
      }, options.reconnectInterval)
    } else {
      error.value = new Error(`WebSocket重连失败，已尝试${options.maxReconnectAttempts}次`)
    }
  }

  // 获取当前WebSocket URL
  const getCurrentWsUrl = (): string => {
    if (ws) {
      return ws.url
    }
    return ""
  }

  // 重连
  const reconnect = () => {
    if (ws) {
      const currentUrl = getCurrentWsUrl()
      disconnect()
      connect(currentUrl, options)
    }
  }

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    send,
    reconnect,
    readyState: readyState.value,
    isConnected: isConnected.value,
    error: error.value,
    lastMessage: lastMessage.value
  }
}

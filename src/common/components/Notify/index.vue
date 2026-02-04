<script lang="ts" setup>
import type { NotifyItem } from "./type"
import { Bell } from "@element-plus/icons-vue"
import { useWebsocketStore } from "@/pinia/stores/websocket"
import { getUnreadCounts, initNotificationData, markAllAsRead, markBatchAsRead, messageData, notifyData, setTodoPopupCallback, todoData, unreadCounts } from "./data"
import List from "./List.vue"

const websocketStore = useWebsocketStore()
const unsubscribe = websocketStore.subscribe("notification", (data) => {
  console.log("收到通知:", data.payload)
  getUnreadCounts()
})

type TabName = "通知" | "消息" | "待办"

interface DataItem {
  name: TabName
  type: "primary" | "success" | "warning" | "danger" | "info"
  list: NotifyItem[]
  unread: number
}

/** 角标当前值 */
const badgeValue = computed(() => data.value.reduce((sum, item) => sum + item.unread, 0))

/** 角标最大值 */
const badgeMax = 99

/** 面板宽度 */
const popoverWidth = 350

/** 当前 Tab */
const activeName = ref<TabName>("通知")

const activeType = computed<"notification" | "message" | "todo">(() => {
  switch (activeName.value) {
    case "消息":
      return "message"
    case "待办":
      return "todo"
    default:
      return "notification"
  }
})

/** 所有数据 */
const data = computed<DataItem[]>(() => [
  // 通知数据
  {
    name: "通知",
    type: "primary",
    list: notifyData.value,
    unread: unreadCounts.notification
  },
  // 消息数据
  {
    name: "消息",
    type: "danger",
    list: messageData.value,
    unread: unreadCounts.message
  },
  // 待办数据
  {
    name: "待办",
    type: "warning",
    list: todoData.value,
    unread: unreadCounts.todo
  }
])

const showTodoDialog = ref(false)
const currentTodo = ref<NotifyItem | null>(null)

async function handleReadAll() {
  try {
    await markAllAsRead(activeType.value)
    //
    ElMessage.success("已标记所有通知为已读")
  } catch (error) {
    console.error("标记已读失败:", error)
    ElMessage.error("标记已读失败，请重试")
  }
}

async function handleReadOne() {
  if (currentTodo.value) {
    try {
      await markBatchAsRead([currentTodo.value.id])
      handleCloseTodoDialog()
    } catch (error) {
      console.error("标记已读失败:", error)
    }
  }
}

function handleTodoPopup(todoItem: NotifyItem) {
  console.log("todoItem", todoItem)
  currentTodo.value = todoItem
  showTodoDialog.value = true
}

function handleCloseTodoDialog() {
  showTodoDialog.value = false
  currentTodo.value = null
}

onMounted(() => {
  setTodoPopupCallback(handleTodoPopup)
  initNotificationData()

  // 启动自动刷新，间隔调整为10秒
  // const refreshInterval = startAutoRefresh(10000)

  // 组件卸载时清理
  onUnmounted(() => {
    // stopAutoRefresh(refreshInterval)
    unsubscribe()
  })
})
</script>

<template>
  <div class="notify">
    <el-popover placement="bottom" :width="popoverWidth" trigger="click">
      <template #reference>
        <el-badge :value="badgeValue" :max="badgeMax" :hidden="badgeValue === 0">
          <el-tooltip effect="dark" content="消息通知" placement="bottom">
            <el-icon :size="20">
              <Bell />
            </el-icon>
          </el-tooltip>
        </el-badge>
      </template>
      <template #default>
        <el-tabs v-model="activeName" class="demo-tabs" stretch>
          <el-tab-pane v-for="(item, index) in data" :key="index" :name="item.name">
            <template #label>
              {{ item.name }}
              <el-badge :value="item.unread" :max="badgeMax" :type="item.type" />
            </template>
            <el-scrollbar height="400px">
              <List :data="item.list" />
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
        <div class="notify-history">
          <el-button link @click="handleReadAll">
            全部标记已读
          </el-button>
        </div>
      </template>
    </el-popover>
    <el-dialog
      v-model="showTodoDialog"
      title="新的待办事项"
      width="400px"
      :before-close="handleCloseTodoDialog"
    >
      <div v-if="currentTodo">
        <div class="todo-content">
          <div class="todo-avatar" v-if="currentTodo.avatar">
            <el-avatar :src="currentTodo.avatar" :size="40" />
          </div>
          <div class="todo-info">
            <h4>{{ currentTodo.title }}</h4>
            <p class="todo-description">{{ currentTodo.description }}</p>
            <span class="todo-time">{{ currentTodo.datetime }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseTodoDialog">稍后处理</el-button>
          <el-button type="primary" @click="handleReadOne">标记已读</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.notify-history {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
</style>

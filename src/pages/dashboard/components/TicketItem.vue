<script lang="ts" setup>
import { formatDateTime } from "@@/utils/datetime"

const props = defineProps({
  ticket: {
    type: Object,
    default: () => ({})
  }
})

// 定义状态类型
type StatusType = "info" | "danger" | "warning" | "success" | "primary"

const priorityType = computed<string>(() => {
  return getPriority(props.ticket.priority || 0)
})

const priorityTypeColor = computed(() => {
  return getStatusColor[priorityType.value]
})

const remainingTime = computed(() => {
  return calculateRemainingTime(props.ticket.updatedAt, props.ticket.priority)
})

const ticketTypeColor = computed(() => {
  switch (props.ticket.ticketType) {
    case 1:
      return "danger"
    case 2:
      return "warning"
    case 3:
      return "warning"
    case 4:
      return "warning"
    case 5:
      return "success"
    case 6:
      return "danger"
    case 7:
      return "success"
    case 8:
      return "danger"
    case 9:
      return "success"
    default:
      return "info"
  }
})

const ticketTypeText = computed(() => {
  if (props.ticket.ticketType === 1) {
    return "订单缺货"
  } else if (props.ticket.ticketType === 2) {
    return "订单售后"
  } else if (props.ticket.ticketType === 3) {
    return "产品售后"
  } else if (props.ticket.ticketType === 4) {
    return "物流售后"
  } else if (props.ticket.ticketType === 5) {
    return "知识更新"
  } else if (props.ticket.ticketType === 6) {
    return "仓库缺货"
  } else if (props.ticket.ticketType === 7) {
    return "咨询"
  } else if (props.ticket.ticketType === 8) {
    return "投诉"
  } else if (props.ticket.ticketType === 9) {
    return "建议"
  } else {
    return "其他"
  }
})

function getPriority(priority: number): string {
  switch (priority) {
    case 2:
      return "一般"
    case 3:
      return "紧急"
    case 4:
      return "加急"
    case 5:
      return "特急"
    default:
      return "日常"
  }
}

const getStatusColor: Record<string, StatusType> = {
  日常: "info",
  一般: "primary",
  紧急: "warning",
  加急: "warning",
  特急: "danger"
}

// 获取倒计时标签类型
function getCountdownTagType(totalMinutes: number): "danger" | "warning" | "primary" {
  if (totalMinutes <= 120) { // 2小时内
    return "danger"
  } else if (totalMinutes <= 1440) { // 24小时内
    return "warning"
  } else {
    return "primary"
  }
}

// 格式化倒计时显示
function formatCountdown(hours: number, minutes: number): string {
  return `${Math.floor(hours / 24).toString().padStart(2, "0")}:${Math.floor(hours % 24).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

// 根据优先级获取处理时限（小时）
function getProcessingTimeLimit(priority: number): number {
  const timeLimits: Record<number, number> = {
    5: 2, // 特急：2小时
    4: 10, // 加急：10小时
    3: 24, // 紧急：24小时
    2: 48, // 一般：48小时
    1: 168 // 日常：168小时
  }
  return timeLimits[priority] || 48
}

function calculateRemainingTime(updatedAt: string, priority: number): { hours: number, minutes: number, totalMinutes: number } {
  const updateTime = new Date(updatedAt)
  const now = new Date()
  const timeLimitHours = getProcessingTimeLimit(priority)
  const deadlineTime = new Date(updateTime.getTime() + timeLimitHours * 60 * 60 * 1000)

  const remainingMs = deadlineTime.getTime() - now.getTime()
  const totalMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return { hours, minutes, totalMinutes }
}
</script>

<template>
  <div class="ticket-item">
    <el-tag :type="priorityTypeColor" effect="dark" class="ticket-tag">
      {{ priorityType }}
    </el-tag>
    <el-tag :type="ticketTypeColor" class="ticket-tag">
      {{ ticketTypeText }}
    </el-tag>
    <el-tag
      v-if="ticket.status < 3"
      :type="getCountdownTagType(remainingTime.totalMinutes)"
      size="small"
      effect="dark"
    >
      {{ formatCountdown(remainingTime.hours, remainingTime.minutes) }}
    </el-tag>
    <span v-else class="text-gray-400">-</span>
    <el-text class="ticket-text" truncated>
      {{ ticket.title }}
    </el-text>
    <div class="ticket-date">
      <el-space direction="vertical" style="align-items: end;">
        <el-text class="mx-1" type="primary">{{ ticket.assignee?.staff?.name || ticket.assignee?.username || "" }}</el-text>
        <el-text size="small">{{ formatDateTime(ticket.createdAt) }}</el-text>
      </el-space>
    </div>
  </div>
</template>

<style>
.ticket-item {
  display: flex;
  width: 100%;
  align-items: center;
}
.ticket-item > .ticket-tag {
  margin: 0 5px;
}
.ticket-text {
  margin-left: 10px;
  flex: 1;
}
.ticket-date {
  line-height: 0.6em;
  margin-left: auto;
}
</style>

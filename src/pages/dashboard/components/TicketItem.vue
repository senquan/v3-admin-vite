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

const priorityType = computed<StatusType>(() => {
  return getPriority(props.ticket.priority || 0)
})

const priorityTypeText = computed(() => {
  return getStatusText[priorityType.value]
})

const ticketTypeText = computed(() => {
  if (props.ticket.ticketType === 1) {
    return "咨询"
  } else if (props.ticket.ticketType === 2) {
    return "投诉"
  } else if (props.ticket.ticketType === 3) {
    return "售后"
  } else if (props.ticket.ticketType === 4) {
    return "建议"
  } else {
    return "其他"
  }
})

function getPriority(priority: number): StatusType {
  let status: StatusType = "info"
  if (priority === 2) {
    status = "primary"
  } else if (priority === 3) {
    status = "warning"
  } else if (priority === 4) {
    status = "danger"
  } else {
    status = "info"
  }
  return status
}

const getStatusText: Record<StatusType, string> = {
  info: "低",
  danger: "紧急",
  warning: "高",
  primary: "中",
  success: "低"
}
</script>

<template>
  <div class="ticket-item">
    <el-tag :type="priorityType" effect="dark" class="ticket-tag">
      {{ priorityTypeText }}
    </el-tag>
    <el-tag :type="priorityType" class="ticket-tag">
      {{ ticketTypeText }}
    </el-tag>
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

<script lang="ts" setup>
import { getDateDiff } from "@/common/utils/datetime"

const props = defineProps({
  todo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(["toggleTodo"])

function toggleTodo() {
  // Instead of modifying the prop directly, emit an event to let the parent handle it
  emit("toggleTodo", {
    ...props.todo,
    isDone: !props.todo.isDone
  })
}

// 定义状态类型
type EndStatusType = "info" | "danger" | "warning" | "success" | "primary"

const endType = computed<EndStatusType>(() => {
  return getEndStatus(props.todo.endtime || "")
})

const endTypeText = computed(() => {
  return getEndStatusText[endType.value]
})

function getEndStatus(endtime: string): EndStatusType {
  let status: EndStatusType = "info"
  const diff = getDateDiff("", endtime, "d")
  if (diff < 0) {
    status = "info"
  } else if (diff < 1) {
    status = "danger"
  } else if (diff === 1) {
    status = "warning"
  } else if (diff === 2) {
    status = "success"
  } else if (diff > 2) {
    status = "primary"
  }
  return status
}

const getEndStatusText: Record<EndStatusType, string> = {
  info: "过期",
  danger: "今日",
  warning: "明天",
  success: "后天",
  primary: "周内"
}
</script>

<template>
  <div class="todo-item">
    <el-checkbox :model-value="todo.isDone" @change="toggleTodo" />
    <el-tag :type="endType" effect="dark" class="todo-tag">
      {{ endTypeText }}
    </el-tag>
    <el-text class="todo-text" truncated>
      {{ todo.name }}
    </el-text>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
}
.todo-item > .todo-tag {
  margin: 0 5px;
}
</style>

<script lang="ts" setup>
import { defineProps, computed } from 'vue'
import { getDateDiff } from '@/common/utils/datetime'

const props = defineProps({
  todo: {
    type: Object,
    default: () => []
  }
})

const emit = defineEmits(['toggleTodo'])

const toggleTodo = () => {
  props.todo.isDone = !props.todo.isDone
  emit('toggleTodo', props.todo)
}

const endType = computed(() => {
  return getEndStatus(props.todo.endtime)
})

const endTypeText = computed(() => {
  return getEndStatusText[endType.value]
})

const getEndStatus = (endtime) => {
  var status
  var diff = getDateDiff(undefined, endtime, 'd')
  if (diff < 0) {
    status = 'info'
  } else if (diff < 1) {
    status = 'danger'
  } else if (diff === 1) {
    status = 'warning'
  } else if (diff === 2) {
    status = 'success'
  } else if (diff > 2) {
    status = 'primary'
  }
  return status
}
const getEndStatusText = {
  info: '过期',
  danger: '今日',
  warning: '明天',
  success: '后天',
  primary: '周内'
}
</script>
<template>
  <div class="todo-item">
    <el-checkbox v-model="todo.isDone" @change="toggleTodo"/>
    <el-tag :type="endType" effect="dark" class="todo-tag">{{ endTypeText }}</el-tag>
    <el-text class="todo-text" truncated>{{ todo.name }}</el-text>
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
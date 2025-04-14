<script lang="ts" setup>

const props = defineProps({
  task: {
    type: Object,
    default: () => []
  }
})

const percentage = (value: number, max: number) => {
  let p = Math.round(value * 100 / max * 100) / 100
  if (p > 100) p = 100
  return max > 0 ? p : 0
}

const getProgressColor = (value: number, max: number) => {
  let p = percentage(value, max)
  if (p >= 90) return '#15b74e'
  else if (p >= 60) return ''
  else if (p >= 40) return '#8e71c7'
  else if (p >= 20) return '#e6a23c'
  else return '#f56c6c'
}
</script>
<template>
  <div class="task-item">
    <el-tooltip :content="task.detail" effect="dark" placement="right-end" class="item">
      <el-text class="task-text" truncated>{{ task.name }} [{{ Math.round(task.progress) + '/' + task.maxValue }}]</el-text>
    </el-tooltip>
    <el-progress :percentage="percentage(task.progress, task.maxValue)" :color="getProgressColor(task.progress, task.maxValue)"></el-progress>
  </div>
</template>

<style scoped>

</style>

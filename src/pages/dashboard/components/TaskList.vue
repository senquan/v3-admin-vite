<script lang="ts" setup>
import TaskItem from "./TaskItem.vue"

interface Task {
  id: number
  name: string
}

const props = defineProps({
  data: {
    type: Array as () => Task[],
    default: () => []
  }
})
</script>

<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <DocumentChecked style="width: 1.5em; height: 1.5em; margin-right: 5px" />
            <span>任务进度</span>
          </div>
        </div>
      </template>
      <el-scrollbar height="300px">
        <div v-if="props.data.length === 0" class="empty-tip">
          暂无任务
        </div>
        <div
          v-for="task in props.data"
          :key="task.id"
          class="tasklist-item"
        >
          <TaskItem :task="task" />
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<style scoped>
.box-card {
  font:
    14px "Helvetica Neue",
    Helvetica,
    Arial,
    sans-serif;
  width: 100%;
  height: 100%;
  line-height: 1.4em;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 24px;
}
.card-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}
:deep(.el-card__header) {
  padding: 10px;
}
.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}
</style>

<script setup lang="ts">
import type { Task } from "./apis/type"
import { formatDate } from "@/utils/date"

// Props
interface Props {
  visible: boolean
  task?: Task | null
}

withDefaults(defineProps<Props>(), {
  task: null
})

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean]
}>()

// 任务类型选项
const TaskTypeOptions = [
  { value: 1, label: "学习任务", color: "primary" },
  { value: 2, label: "考试任务", color: "success" },
  { value: 3, label: "培训任务", color: "warning" },
  { value: 4, label: "调研任务", color: "info" }
]

// 任务状态选项
const TaskStatusOptions = [
  { value: 1, label: "草稿", color: "info" },
  { value: 2, label: "已发布", color: "success" },
  { value: 3, label: "进行中", color: "warning" },
  { value: 4, label: "已完成", color: "success" },
  { value: 5, label: "已暂停", color: "warning" },
  { value: 6, label: "已取消", color: "danger" }
]

// 任务优先级选项
const TaskPriorityOptions = [
  { value: 1, label: "低", color: "info" },
  { value: 2, label: "中", color: "warning" },
  { value: 3, label: "高", color: "danger" }
]

// 任务项类型选项
const TaskItemTypeOptions = [
  { value: 1, label: "文档", color: "primary" },
  { value: 2, label: "视频", color: "success" },
  { value: 3, label: "音频", color: "warning" },
  { value: 4, label: "图片", color: "info" },
  { value: 5, label: "链接", color: "danger" }
]

// 任务项表格列定义
// const itemColumns = [
//   {
//     title: "序号",
//     dataIndex: "sort_order",
//     width: 80
//   },
//   {
//     title: "项目标题",
//     dataIndex: "title",
//     ellipsis: true
//   },
//   {
//     title: "类型",
//     key: "type",
//     width: 100
//   },
//   {
//     title: "必须完成",
//     key: "is_required",
//     width: 100
//   },
//   {
//     title: "权重",
//     key: "weight",
//     width: 80
//   },
//   {
//     title: "关联内容",
//     key: "related",
//     width: 120
//   }
// ]

// 获取任务类型标签
function getTaskTypeLabel(type: number) {
  return TaskTypeOptions.find(option => option.value === type)?.label || "未知"
}

// 获取任务类型颜色
function getTaskTypeColor(type: number) {
  const colors = ["blue", "green", "orange", "red", "purple", "cyan", "magenta"]
  return colors[type - 1] || "default"
}

// 获取任务状态标签
function getTaskStatusLabel(status: number) {
  return TaskStatusOptions.find(option => option.value === status)?.label || "未知"
}

// 获取任务状态颜色
function getTaskStatusColor(status: number): "info" | "success" | "warning" | "danger" | "primary" {
  const color = TaskStatusOptions.find(option => option.value === status)?.color
  return (color as "primary" | "success" | "warning" | "info" | "danger") || "info"
}

// 获取任务优先级标签
function getTaskPriorityLabel(priority: number) {
  return TaskPriorityOptions.find(option => option.value === priority)?.label || "未知"
}

// 获取任务优先级颜色
function getTaskPriorityColor(priority: number) {
  return TaskPriorityOptions.find(option => option.value === priority)?.color || "default"
}

// 获取任务项类型标签
function getTaskItemTypeLabel(type: number) {
  return TaskItemTypeOptions.find(option => option.value === type)?.label || "未知"
}

// 获取任务项类型颜色
function getTaskItemTypeColor(type: number) {
  const colors = ["blue", "green", "orange", "red", "purple", "cyan", "magenta"]
  return colors[type - 1] || "default"
}

// 取消
function handleCancel() {
  emit("update:visible", false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="任务详情"
    width="1000px"
    @close="handleCancel"
  >
    <div v-if="task" class="task-detail">
      <!-- 基本信息 -->
      <el-descriptions
        title="基本信息"
        :column="2"
        border
        size="small"
        class="detail-section"
      >
        <el-descriptions-item label="任务标题" :span="2">
          <span class="task-title">{{ task.title }}</span>
          <el-tag
            :type="getTaskStatusColor(task.status)"
            style="margin-left: 8px"
          >
            {{ getTaskStatusLabel(task.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <el-tag :color="getTaskTypeColor(task.type)">
            {{ getTaskTypeLabel(task.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :color="getTaskPriorityColor(task.priority)">
            {{ getTaskPriorityLabel(task.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDate(task.start_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatDate(task.end_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ task.publish_time ? formatDate(task.publish_time) : "未设置" }}
        </el-descriptions-item>
        <el-descriptions-item label="预计参与人数">
          {{ task.expected_participants || 0 }} 人
        </el-descriptions-item>
        <el-descriptions-item label="允许补交">
          <el-tag :type="task.allow_makeup ? 'success' : 'danger'">
            {{ task.allow_makeup ? "是" : "否" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="自动分配">
          <el-tag :type="task.auto_assign ? 'success' : 'danger'">
            {{ task.auto_assign ? "是" : "否" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          <span v-if="task.tags">
            <el-tag
              v-for="tag in task.tags.split(',')"
              :key="tag"
              size="small"
            >
              {{ tag.trim() }}
            </el-tag>
          </span>
          <span v-else class="text-muted">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2">
          <div class="description-content">
            {{ task.description || "无描述" }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2" v-if="task.remark">
          <div class="remarks-content">
            {{ task.remark }}
          </div>
        </el-descriptions-item>
      </el-descriptions>
      <!-- 进度统计 -->
      <div class="detail-section">
        <h3>完成进度</h3>
        <el-row :gutter="16" class="progress-stats">
          <el-col :span="6">
            <el-statistic
              title="总参与人数"
              :value="task.total_assignments || 0"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="已完成人数"
              :value="task.completed_assignments || 0"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="进行中人数"
              :value="task.in_progress_assignments || 0"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="完成率"
              :value="parseFloat(task.completion_rate || '0')"
              suffix="%"
            />
          </el-col>
        </el-row>

        <div class="progress-chart">
          <el-progress
            :percentage="parseFloat(task.completion_rate || '0')"
            :stroke-width="8"
            status="success"
          />
        </div>
      </div>

      <!-- 任务项列表 -->
      <div class="detail-section">
        <h3>任务项列表</h3>
        <el-table
          :data="task.taskItems || []"
          size="small"
          class="task-items-table"
          style="width: 100%"
        >
          <el-table-column prop="sort_order" label="序号" width="80" />
          <el-table-column prop="title" label="项目标题" show-overflow-tooltip />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :color="getTaskItemTypeColor(row.type)">
                {{ getTaskItemTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="必须完成" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_required ? 'danger' : 'info'">
                {{ row.is_required ? "必须" : "可选" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="权重" width="80">
            <template #default="{ row }">
              {{ row.weight || 0 }}%
            </template>
          </el-table-column>
          <el-table-column label="关联内容" width="120">
            <template #default="{ row }">
              <span v-if="row.courseware_id" class="related-item">
                <el-icon><Document /></el-icon> 课件
              </span>
              <span v-else-if="row.exam_id" class="related-item">
                <el-icon><Edit /></el-icon> 考试
              </span>
              <span v-else-if="row.external_url" class="related-item">
                <el-icon><Link /></el-icon> 外部链接
              </span>
              <span v-else class="text-muted">无</span>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="!task.taskItems || task.taskItems.length === 0"
          description="暂无任务项"
        />
      </div>

      <!-- 自动分配规则 -->
      <div v-if="task.auto_assign && task.auto_assign_rules" class="detail-section">
        <h3>自动分配规则</h3>
        <el-card shadow="never">
          <pre class="auto-assign-rules">{{ task.auto_assign_rules }}</pre>
        </el-card>
      </div>

      <!-- 创建信息 -->
      <el-descriptions
        title="创建信息"
        :column="2"
        border
        size="small"
        class="detail-section"
      >
        <el-descriptions-item label="创建人">
          {{ task.creatorEntity?.real_name || task.creatorEntity?.username || "未知" }}
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          {{ formatDate(task.created_time) }}
        </el-descriptions-item>

        <el-descriptions-item label="更新人">
          {{ task.updaterEntity?.real_name || task.updaterEntity?.username || "未知" }}
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          {{ formatDate(task.updated_time) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-empty
      v-else
      description="暂无任务信息"
    />
  </el-dialog>
</template>

<style scoped>
.task-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.description-content,
.remarks-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #595959;
}

.progress-stats {
  margin-bottom: 16px;
}

.progress-chart {
  margin-top: 16px;
}

.task-items-table {
  margin-top: 16px;
}

.related-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
}

.auto-assign-rules {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 12px;
  margin: 0;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #24292e;
  overflow-x: auto;
}

.text-muted {
  color: #8c8c8c;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #262626;
  background: #fafafa;
}

:deep(.el-descriptions__content) {
  color: #595959;
}

:deep(.el-statistic__head) {
  font-size: 12px;
  color: #8c8c8c;
}

:deep(.el-statistic__content) {
  font-size: 20px;
  font-weight: 600;
}

:deep(.el-table th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.el-table tbody tr:hover > td) {
  background: #f5f5f5;
}
</style>

<script setup lang="ts">
import type {
  Task,
  TaskQueryParams
} from "./apis/type"
import { formatDate } from "@/utils/date"
import { ElMessage, ElMessageBox } from "element-plus"
import TaskDetailModal from "./_detail.vue"
import TaskFormModal from "./_form.vue"
import {
  batchDeleteTasks,
  deleteTask as deleteTaskApi,
  getTaskList,
  publishTask as publishTaskApi
} from "./apis"
import {
  TaskPriorityOptions,
  TaskStatus,
  TaskStatusOptions,
  TaskTypeOptions
} from "./apis/type"

// 响应式数据
const loading = ref(false)
const taskList = ref<Task[]>([])
const selectedRowKeys = ref<number[]>([])
const formModalVisible = ref(false)
const detailModalVisible = ref(false)
const currentTask = ref<Task | null>(null)
const formMode = ref<"create" | "edit">("create")

// 搜索表单
const searchForm = reactive<{
  title?: string
  type?: number
  status?: number
  priority?: number
  dateRange?: [string, string]
}>({})

// 分页信息
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 统计信息
const statistics = reactive({
  published: 0,
  inProgress: 0,
  completed: 0
})

// 获取任务类型标签
function getTaskTypeLabel(type: number) {
  return TaskTypeOptions.find(option => option.value === type)?.label || "未知"
}

// 获取任务类型颜色
function getTaskTypeColor(type: number): "success" | "warning" | "info" | "primary" | "danger" {
  const colorsMap: Record<number, "success" | "warning" | "info" | "primary" | "danger"> = {
    0: "primary",
    1: "success",
    2: "warning",
    3: "danger",
    4: "info"
  }
  return colorsMap[type - 1] || "info"
}

// 获取任务状态标签
function getTaskStatusLabel(status: number) {
  return TaskStatusOptions.find(option => option.value === status)?.label || "未知"
}

// 获取任务状态颜色
function getTaskStatusColor(status: number): "success" | "warning" | "info" | "primary" | "danger" {
  const colorMap: Record<number, "success" | "warning" | "info" | "primary" | "danger"> = {
    1: "info", // 草稿
    2: "primary", // 已发布
    3: "warning", // 进行中
    4: "success", // 已完成
    5: "danger" // 已取消
  }
  return colorMap[status] || "info"
}

// 获取任务优先级标签
function getTaskPriorityLabel(priority: number) {
  return TaskPriorityOptions.find(option => option.value === priority)?.label || "未知"
}

// 获取任务优先级颜色
function getTaskPriorityColor(priority: number): "success" | "warning" | "info" | "primary" | "danger" {
  const colorMap: Record<number, "success" | "warning" | "info" | "primary" | "danger"> = {
    1: "info", // 低
    2: "primary", // 中
    3: "warning", // 高
    4: "danger" // 紧急
  }
  return colorMap[priority] || ""
}

// 加载任务列表
async function loadTaskList() {
  try {
    loading.value = true

    const params: TaskQueryParams = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...searchForm
    }

    // 处理日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0]
      params.end_date = searchForm.dateRange[1]
    }

    const response = await getTaskList(params)

    if (response.code === 0) {
      taskList.value = response.data.tasks
      pagination.total = response.data.total

      // 更新统计信息
      updateStatistics(response.data.tasks)
    }
  } catch (error) {
    console.error("加载任务列表失败:", error)
    ElMessage.error("加载任务列表失败")
  } finally {
    loading.value = false
  }
}

// 更新统计信息
async function updateStatistics(tasks: Task[]) {
  statistics.published = tasks.filter(task => task.status === TaskStatus.PUBLISHED).length
  statistics.inProgress = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length
  statistics.completed = tasks.filter(task => task.status === TaskStatus.COMPLETED).length
}

// 搜索处理
async function handleSearch() {
  pagination.current = 1
  loadTaskList()
}

// 重置搜索
function resetSearch() {
  Object.keys(searchForm).forEach((key) => {
    delete searchForm[key as keyof typeof searchForm]
  })
  pagination.current = 1
  loadTaskList()
}

// 分页变化处理
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  loadTaskList()
}

function handleCurrentChange(current: number) {
  pagination.current = current
  loadTaskList()
}

// 选择变化处理
function onSelectChange(rows: Task[]) {
  selectedRowKeys.value = rows.map(row => row._id)
}

// 显示创建弹窗
function showCreateModal() {
  currentTask.value = null
  formMode.value = "create"
  formModalVisible.value = true
}

// 查看任务
function viewTask(task: Task) {
  currentTask.value = task
  detailModalVisible.value = true
}

// 编辑任务
function editTask(task: Task) {
  currentTask.value = task
  formMode.value = "edit"
  formModalVisible.value = true
}

// 发布任务
async function publishTask(task: Task) {
  try {
    const response = await publishTaskApi(task._id)
    if (response.code === 0) {
      ElMessage.success("任务发布成功")
      loadTaskList()
    }
  } catch (error) {
    console.error("发布任务失败:", error)
    ElMessage.error("发布任务失败")
  }
}

// 删除任务
async function deleteTask(id: number) {
  try {
    const response = await deleteTaskApi(id)
    if (response.code === 0) {
      ElMessage.success("删除成功")
      loadTaskList()
    }
  } catch (error) {
    console.error("删除任务失败:", error)
    ElMessage.error("删除任务失败")
  }
}

// 批量删除
function handleBatchDelete() {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRowKeys.value.length} 个任务吗？`,
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      const response = await batchDeleteTasks(selectedRowKeys.value)
      if (response.code === 0) {
        ElMessage.success("批量删除成功")
        selectedRowKeys.value = []
        loadTaskList()
      }
    } catch (error) {
      console.error("批量删除失败:", error)
      ElMessage.error("批量删除失败")
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 刷新
function handleRefresh() {
  loadTaskList()
}

// 表单成功处理
function handleFormSuccess() {
  formModalVisible.value = false
  loadTaskList()
}

// 组件挂载时加载数据
onMounted(() => {
  loadTaskList()
})
</script>

<template>
  <div class="task-management">
    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-card>
        <el-form
          :model="searchForm"
          inline
          class="search-form"
        >
          <el-form-item label="任务标题">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入任务标题"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="任务类型">
            <el-select
              v-model="searchForm.type"
              placeholder="请选择任务类型"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="option in TaskTypeOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="任务状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择任务状态"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="option in TaskStatusOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select
              v-model="searchForm.priority"
              placeholder="请选择优先级"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="option in TaskPriorityOptions"
                :key="option.value"
                :value="option.value"
                :label="option.label"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button style="margin-left: 8px" @click="resetSearch">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showCreateModal">
          <el-icon><Plus /></el-icon>
          创建任务
        </el-button>
        <el-button
          type="danger"
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-statistic
          title="总任务数"
          :value="pagination.total"
          style="margin-right: 32px"
        />
        <el-statistic
          title="已发布"
          :value="statistics.published || 0"
          style="margin-right: 32px"
        />
        <el-statistic
          title="进行中"
          :value="statistics.inProgress || 0"
        />
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="table-section">
      <el-table
        :data="taskList"
        v-loading="loading"
        @selection-change="onSelectChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="任务标题" min-width="200">
          <template #default="{ row }">
            <div class="task-title">
              <a @click="viewTask(row)" class="title-link">{{ row.title }}</a>
              <div class="task-meta">
                <el-tag v-if="row.tags" size="small">{{ row.tags }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="任务类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTaskTypeColor(row.type)">
              {{ getTaskTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusColor(row.status)">
              {{ getTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getTaskPriorityColor(row.priority)">
              {{ getTaskPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <div class="progress-info">
              <el-progress
                :percentage="parseFloat(row.completion_rate || '0')"
                :stroke-width="6"
              />
              <div class="progress-text">
                {{ row.completed_assignments || 0 }}/{{ row.total_assignments || 0 }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            <div class="time-info">
              <div v-if="row.start_time">
                开始：{{ formatDate(row.start_time) }}
              </div>
              <div v-if="row.end_time">
                结束：{{ formatDate(row.end_time) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="creator" label="创建人" width="120">
          <template #default="{ row }">
            {{ row.creatorEntity?.real_name || row.creatorEntity?.username || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button type="primary" link size="small" @click="viewTask(row)">
                查看
              </el-button>
              <el-button type="primary" link size="small" @click="editTask(row)">
                编辑
              </el-button>
              <el-button
                v-if="row.status === TaskStatus.DRAFT"
                type="success"
                link
                size="small"
                @click="publishTask(row)"
              >
                发布
              </el-button>
              <el-popconfirm
                title="确定要删除这个任务吗？"
                @confirm="deleteTask(row._id)"
              >
                <el-button type="danger" link size="small">
                  删除
                </el-button>
              </el-popconfirm>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑任务弹窗 -->
    <TaskFormModal
      v-model:visible="formModalVisible"
      :task="currentTask"
      :mode="formMode"
      @success="handleFormSuccess"
    />

    <!-- 任务详情弹窗 -->
    <TaskDetailModal
      v-model:visible="detailModalVisible"
      :task="currentTask"
    />
  </div>
</template>

<style scoped>
.task-management {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.header-left p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.search-section {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.task-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-link {
  font-weight: 500;
  color: #1890ff;
  text-decoration: none;
}

.title-link:hover {
  color: #40a9ff;
}

.task-meta {
  display: flex;
  gap: 4px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-text {
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
}

.time-info {
  font-size: 12px;
  color: #8c8c8c;
}

.time-info div {
  margin-bottom: 2px;
}

:deep(.el-table th.el-table__cell) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.el-table .el-table__row:hover > td) {
  background: #f5f5f5;
}

:deep(.el-statistic__head) {
  font-size: 12px;
  color: #8c8c8c;
}

:deep(.el-statistic__content) {
  font-size: 16px;
  font-weight: 600;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: white;
}
</style>

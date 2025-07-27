<script setup lang="ts">
import type {
  Task,
  TaskQueryParams
} from "./apis/type"
import { formatDate } from "@/utils/date"
import { ElMessage, ElMessageBox } from "element-plus"
import TaskFormModal from "./_form.vue"
import StudentModal from "./_selectUserModal.vue"
import {
  assignStudentsToTask,
  batchDeleteTasks,
  deleteTask as deleteTaskApi,
  getTaskById,
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
const detailDrawerVisible = ref(false)
const currentTask = ref<Task | null>(null)
const formMode = ref<"create" | "edit">("create")
const studentModalRef = ref<InstanceType<typeof StudentModal>>()

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

// 任务内容类型选项
const TaskItemTypeOptions = [
  { value: 1, label: "文档", color: "primary" },
  { value: 2, label: "视频", color: "success" },
  { value: 3, label: "音频", color: "warning" },
  { value: 4, label: "图片", color: "info" },
  { value: 5, label: "链接", color: "danger" }
]

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
    0: "info", // 草稿
    1: "primary", // 已发布
    2: "warning", // 进行中
    3: "success", // 已完成
    4: "danger" // 已取消
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

// 获取任务内容类型标签
function getTaskItemTypeLabel(type: number) {
  return TaskItemTypeOptions.find(option => option.value === type)?.label || "未知"
}

// 获取任务内容类型颜色
function getTaskItemTypeColor(type: number) {
  const colors = ["blue", "green", "orange", "red", "purple", "cyan", "magenta"]
  return colors[type - 1] || "default"
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

// 加载任务详情
async function loadTaskDetail(taskId: number) {
  try {
    loading.value = true
    const response = await getTaskById(taskId)
    if (response.code === 0) {
      currentTask.value = response.data
      console.log(currentTask.value)
    }
  } catch (error) {
    console.error("加载任务详情失败:", error)
    ElMessage.error("加载任务详情失败")
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
  loadTaskDetail(task._id)
  detailDrawerVisible.value = true
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

// 学员管理成功处理
async function handleStudentSuccess(data: any) {
  try {
    // 获取当前选中的任务ID
    const taskId = currentTask.value?._id
    if (!taskId) {
      ElMessage.error("请先选择要分配学员的任务")
      return
    }

    // 准备分配数据
    const assignData = {
      userIds: data.ids || [],
      departmentIds: data.departmentIds || [],
      reason: data.reason || ""
    }

    // 检查是否有选中的用户或部门
    if (assignData.userIds.length === 0 && assignData.departmentIds.length === 0) {
      ElMessage.warning("请至少选择一个用户或部门")
      return
    }

    // 调用分配API
    const response = await assignStudentsToTask(taskId, assignData)

    if (response.code === 0) {
      ElMessage.success("学员分配成功")
      // 刷新任务列表
      loadTaskDetail(taskId)
    } else {
      ElMessage.error(response.message || "学员分配失败")
    }
  } catch (error) {
    console.error("分配学员失败:", error)
    ElMessage.error("分配学员失败，请稍后重试")
  }
}

// 学员管理
function handleStudents() {
  studentModalRef.value?.open({
    assignments: currentTask.value?.taskAssignments || []
  })
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
            <el-tag :type="getTaskTypeColor(row.task_type)">
              {{ getTaskTypeLabel(row.task_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusColor(row.status)" effect="dark">
              {{ getTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100" align="center">
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
                :text-inside="true"
                :percentage="parseFloat(row.completion_rate || '0')"
                :stroke-width="18"
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
            {{ row.creatorEntity?.realname || row.creatorEntity?.name || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-space>
              <el-button type="primary" @click="viewTask(row)">
                详情
              </el-button>
              <el-button type="primary" @click="editTask(row)">
                编辑
              </el-button>
              <el-button
                v-if="row.status === TaskStatus.DRAFT"
                type="success"
                @click="publishTask(row)"
              >
                发布
              </el-button>
              <el-popconfirm
                title="确定要删除这个任务吗？"
                @confirm="deleteTask(row._id)"
              >
                <el-button type="danger">
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
    <StudentModal
      ref="studentModalRef"
      @success="handleStudentSuccess"
    />

    <!-- 任务详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="任务详情" size="42%" direction="rtl">
      <el-descriptions
        title="基本信息"
        :column="2"
        border
        class="detail-section"
      >
        <template #extra>
          <el-button type="primary" @click="handleStudents">学员（已选 {{ currentTask?.total_assignments || 0 }} 人）</el-button>
        </template>
        <el-descriptions-item label="任务标题" :span="2">
          <el-tag
            :type="getTaskStatusColor(currentTask?.status || 0)"
            style="margin-right: 8px"
          >
            {{ getTaskStatusLabel(currentTask?.status || 0) }}
          </el-tag>
          <span class="drawer-task-title">{{ currentTask?.title }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          <span v-if="currentTask?.tags">
            <el-tag
              v-for="tag in currentTask?.tags.split(',')"
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
            {{ currentTask?.description || "无描述" }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <el-tag :color="getTaskTypeColor(currentTask?.type || 0)">
            {{ getTaskTypeLabel(currentTask?.type || 0) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :color="getTaskPriorityColor(currentTask?.priority || 0)">
            {{ getTaskPriorityLabel(currentTask?.priority || 0) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDate(currentTask?.start_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatDate(currentTask?.end_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ currentTask?.publish_time ? formatDate(currentTask?.publish_time) : "未设置" }}
        </el-descriptions-item>
        <el-descriptions-item label="预计参与人数">
          {{ currentTask?.expected_participants || 0 }} 人
        </el-descriptions-item>
        <el-descriptions-item label="允许补交">
          <el-tag :type="currentTask?.allow_makeup ? 'success' : 'danger'">
            {{ currentTask?.allow_makeup ? "是" : "否" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="自动分配">
          <el-tag :type="currentTask?.auto_assign ? 'success' : 'danger'">
            {{ currentTask?.auto_assign ? "是" : "否" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2" v-if="currentTask?.remark">
          <div class="remarks-content">
            {{ currentTask?.remark }}
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
              :value="currentTask?.total_assignments || 0"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="已完成人数"
              :value="currentTask?.completed_assignments || 0"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="进行中人数"
              :value="currentTask?.in_progress_assignments || 0"
            />
          </el-col>
          <el-col :span="6">
            <el-statistic
              title="完成率"
              :value="parseFloat(currentTask?.completion_rate || '0')"
              suffix="%"
            />
          </el-col>
        </el-row>

        <div class="progress-chart">
          <el-progress
            :text-inside="true"
            :percentage="parseFloat(currentTask?.completion_rate || '0')"
            :stroke-width="18"
            status="success"
          />
        </div>
      </div>

      <div class="detail-section">
        <h3>任务内容</h3>
        <vxe-table
          :data="currentTask?.taskItems || []"
          empty-text="暂无任务内容"
          style="width: 100%"
        >
          <vxe-column field="sort_order" title="序号" width="80" />
          <vxe-column field="title" title="项目标题" align="left" />
          <vxe-column title="类型" width="80">
            <template #default="row">
              <el-tag :color="getTaskItemTypeColor(Number(row.type))">
                {{ getTaskItemTypeLabel(Number(row.type)) }}
              </el-tag>
            </template>
          </vxe-column>
          <vxe-column title="必须完成" width="80">
            <template #default="{ row }">
              <el-tag :type="row.is_required ? 'danger' : 'info'">
                {{ row.is_required ? "必须" : "可选" }}
              </el-tag>
            </template>
          </vxe-column>
          <vxe-column title="权重" width="80">
            <template #default="{ row }">
              {{ row.weight || 0 }}%
            </template>
          </vxe-column>
          <vxe-column title="关联内容" width="120">
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
          </vxe-column>
        </vxe-table>
      </div>

      <!-- 创建信息 -->
      <el-descriptions
        title="创建信息"
        :column="2"
        border
        class="detail-section"
      >
        <el-descriptions-item label="创建人" width="25%">
          {{ currentTask?.creatorEntity?.realname || currentTask?.creatorEntity?.name || "未知" }}
        </el-descriptions-item>

        <el-descriptions-item label="创建时间">
          {{ formatDate(currentTask?.created_time) }}
        </el-descriptions-item>

        <el-descriptions-item label="更新人">
          {{ currentTask?.updaterEntity?.realname || currentTask?.updaterEntity?.name || "未知" }}
        </el-descriptions-item>

        <el-descriptions-item label="更新时间">
          {{ formatDate(currentTask?.updated_time) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
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

.drawer-task-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
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

:deep(.el-statistic) {
  text-align: center;
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

.progress-chart {
  margin-top: 8px;
}
</style>

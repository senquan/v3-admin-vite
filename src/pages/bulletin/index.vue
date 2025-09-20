<script lang="ts" setup>
import type {
  BulletinListData,
  BulletinListRequestParams
} from "./apis/type"
import type { ContentData } from "@/common/components/ContentViewer/types"
import ContentViewer from "@/common/components/ContentViewer/index.vue"
import BulletinForm from "./_form.vue"
import {
  archiveBulletin,
  batchDeleteBulletins,
  BULLETIN_PRIORITY_OPTIONS,
  BULLETIN_STATUS_OPTIONS,
  BULLETIN_TYPE_OPTIONS,
  deleteBulletin,
  fetchBulletinList,
  publishBulletin
} from "./apis"

// 响应式数据
const loading = ref(false)
const bulletinList = ref<BulletinListData[]>([])
const selectedBulletins = ref<BulletinListData[]>([])
// const showCreateDialog = ref(false)
// const showEditDialog = ref(false)
// const currentBulletin = ref<BulletinListData | null>(null)
const totalRecords = ref(0)

// 表单对话框相关
const formVisible = ref(false)
const editData = ref<BulletinListData | null>(null)

// 搜索和筛选参数
const listQuery = reactive<BulletinListRequestParams>({
  page: 1,
  pageSize: 20,
  keyword: "",
  type: "",
  status: "",
  priority: "",
  is_pinned: "",
  creator_id: "",
  start_date: "",
  end_date: ""
})
const totalPages = computed(() => Math.ceil(totalRecords.value / (listQuery.pageSize || 20)))

// 日期范围
const dateRange = ref<[Date, Date] | []>([])

// 计算属性
const hasSelected = computed(() => selectedBulletins.value.length > 0)
const selectedIds = computed(() => selectedBulletins.value.map(item => item.id))

// 查看公告
const viewData = ref<ContentData>()
const viewVisible = ref(false)

// 获取公告列表
async function getBulletinList() {
  try {
    loading.value = true
    const response = await fetchBulletinList(listQuery)
    if (response.code === 0) {
      bulletinList.value = response.data.bulletins
      totalRecords.value = response.data.total
    } else {
      ElMessage.error(response.message || "获取公告列表失败")
    }
  } catch (error) {
    console.error("获取公告列表失败:", error)
    ElMessage.error("获取公告列表失败")
  } finally {
    loading.value = false
  }
}

// 搜索公告
function handleSearch() {
  listQuery.page = 1
  getBulletinList()
}

// 重置搜索
function handleReset() {
  Object.assign(listQuery, {
    page: 1,
    pageSize: 20,
    keyword: "",
    type: "",
    status: "",
    priority: "",
    is_pinned: "",
    creator_id: "",
    start_date: "",
    end_date: ""
  })
  dateRange.value = []
  getBulletinList()
}

// 处理日期范围变化
function handleDateRangeChange(value: [string, string] | null) {
  if (value && value.length === 2) {
    listQuery.start_date = value[0]
    listQuery.end_date = value[1]
  } else {
    listQuery.start_date = ""
    listQuery.end_date = ""
  }
}

// 分页变化
function handlePageChange(page: number) {
  listQuery.page = page
  getBulletinList()
}

// 选择变化
function handleSelectionChange(selection: BulletinListData[]) {
  selectedBulletins.value = selection
}

// 创建公告
function handleCreate() {
  editData.value = null
  formVisible.value = true
}

// 编辑公告
function handleEdit(bulletin: BulletinListData) {
  editData.value = bulletin
  formVisible.value = true
}

// 删除公告
async function handleDelete(bulletin: BulletinListData) {
  try {
    await ElMessageBox.confirm(
      `确定要删除公告 "${bulletin.title}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )

    const response = await deleteBulletin(bulletin.id)
    if (response.code === 0) {
      ElMessage.success("删除成功")
      getBulletinList()
    } else {
      ElMessage.error(response.message || "删除失败")
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除公告失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

// 批量删除
async function handleBatchDelete() {
  if (!hasSelected.value) {
    ElMessage.warning("请选择要删除的公告")
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedBulletins.value.length} 条公告吗？`,
      "批量删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )

    const response = await batchDeleteBulletins(selectedIds.value)
    if (response.code === 0) {
      ElMessage.success(`成功删除 ${response.data.deleted_count} 条公告`)
      selectedBulletins.value = []
      getBulletinList()
    } else {
      ElMessage.error(response.message || "批量删除失败")
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error)
      ElMessage.error("批量删除失败")
    }
  }
}

// 发布公告
async function handlePublish(bulletin: BulletinListData) {
  try {
    const response = await publishBulletin(bulletin.id)
    if (response.code === 0) {
      ElMessage.success("发布成功")
      getBulletinList()
    } else {
      ElMessage.error(response.message || "发布失败")
    }
  } catch (error) {
    console.error("发布公告失败:", error)
    ElMessage.error("发布失败")
  }
}

// 归档公告
async function handleArchive(bulletin: BulletinListData) {
  try {
    const response = await archiveBulletin(bulletin.id)
    if (response.code === 0) {
      ElMessage.success("归档成功")
      getBulletinList()
    } else {
      ElMessage.error(response.message || "归档失败")
    }
  } catch (error) {
    console.error("归档公告失败:", error)
    ElMessage.error("归档失败")
  }
}

// 获取类型标签文本
function getTypeText(type: number) {
  const option = BULLETIN_TYPE_OPTIONS.find(item => item.value === type)
  return option?.label || type
}

// 获取状态标签文本
function getStatusText(status: number) {
  const option = BULLETIN_STATUS_OPTIONS.find(item => item.value === status)
  return option?.label || status
}

// 获取优先级标签文本
function getPriorityText(priority: number) {
  const option = BULLETIN_PRIORITY_OPTIONS.find(item => item.value === priority)
  return option?.label || priority.toString()
}

// 格式化日期
function formatDate(dateString: string | null) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleString("zh-CN")
}

// 表单成功回调
function handleFormSuccess() {
  getBulletinList()
}

function handleView(bulletin: BulletinListData) {
  viewData.value = {
    title: bulletin.title,
    datetime: bulletin.published_at || "",
    author: bulletin.creator?.username || "",
    content: bulletin.content
  }
  viewVisible.value = true
}

// 组件挂载时获取数据
onMounted(() => {
  getBulletinList()
})
</script>

<template>
  <div class="bulletin-page">
    <!-- 搜索筛选区域 -->
    <div class="search-header">
      <el-form :model="listQuery" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="listQuery.keyword"
            placeholder="请输入标题或内容关键词"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="类型">
          <el-select
            v-model="listQuery.type"
            placeholder="请选择类型"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="option in BULLETIN_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="listQuery.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="option in BULLETIN_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select
            v-model="listQuery.priority"
            placeholder="请选择优先级"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="option in BULLETIN_PRIORITY_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="置顶">
          <el-switch
            v-model="listQuery.is_pinned"
            active-value="1"
            inactive-value="0"
            style="width: 60px"
          />
        </el-form-item>

        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            @change="handleDateRangeChange"
            style="width: 350px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮区域 -->
    <el-card class="action-card" shadow="never">
      <div class="action-buttons">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增公告
        </el-button>
        <el-button
          type="danger"
          :disabled="!hasSelected"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>

      <div class="selected-info" v-if="hasSelected">
        已选择 {{ selectedBulletins.length }} 项
      </div>
    </el-card>

    <!-- 公告列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="bulletinList"
        :loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <el-icon v-if="row.is_pinned" color="#F56C6C" style="margin-right: 4px">
                <Top />
              </el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            {{ getTypeText(row.type) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            {{ getStatusText(row.status) }}
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            {{ getPriorityText(row.priority) }}
          </template>
        </el-table-column>

        <el-table-column prop="read_count" label="阅读量" width="100" align="center" />

        <el-table-column prop="creator" label="创建者" width="120">
          <template #default="{ row }">
            {{ row.creator?.nickname || row.creator?.username || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="published_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.published_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="success"
              @click="handleView(row)"
            >
              查看
            </el-button>

            <el-button
              type="primary"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>

            <el-button
              v-if="row.status === 'draft'"
              type="success"
              @click="handlePublish(row)"
            >
              发布
            </el-button>

            <el-button
              v-if="row.status === 'published'"
              type="warning"
              @click="handleArchive(row)"
            >
              归档
            </el-button>

            <el-button
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <el-pagination
          v-model:current-page="listQuery.page"
          v-model:page-size="listQuery.pageSize"
          :total="totalRecords"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[12, 24, 48, 96]"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 公告表单对话框 -->
    <BulletinForm
      v-model:visible="formVisible"
      :edit-data="editData"
      @success="handleFormSuccess"
    />

    <!-- 内容查看器 -->
    <ContentViewer
      v-model:visible="viewVisible"
      :data="viewData"
    />
  </div>
</template>

<style scoped>
.bulletin-page {
  background-color: #f5f7fa;
}

.search-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-card,
.action-card,
.table-card {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.selected-info {
  margin-left: auto;
  color: #409eff;
  font-size: 14px;
}

.title-cell {
  display: flex;
  align-items: center;
}

.pagination-container {
  padding: 10px;
  background: #fff;
}

.el-card {
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 0;
}
</style>

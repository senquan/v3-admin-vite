<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { request } from "@/http/axios"
import { useUserStore } from "@/pinia/stores/user"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import TicketForm from "./_form.vue"
import { addComment, assignTicket, closeTicket, confirmTicket, deleteTicket, fetchDetail, fetchList, processTicket } from "./apis"

const userStore = useUserStore()
const userId = userStore.id
const isAdmin = userStore.roles.includes("ADMIN")

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  status: "",
  ticketType: "",
  priority: "",
  startDate: "",
  endDate: "",
  page: 1,
  pageSize: 20
})
const totalTickets = ref(0)
const tableData = ref<any>([])
const detailDrawer = ref(false)
const ticketDetail = ref<any>({})
const activeTab = ref("detail")
const commentForm = reactive({
  content: "",
  fileList: [] as string[],
  isInternal: false,
  isDone: false
})

const ticketFormRef = ref<any>([])
const ticketFormVisibility = ref(false)
const attachmentMap = ref<Record<number, string[]>>({})

// 分配表单
const assignForm = reactive({
  assigneeId: 0
})

// 工单类型选项
const ticketTypeOptions = ref([
  { label: "订单缺货", value: 1, color: "danger" },
  { label: "订单售后", value: 2, color: "warning" },
  { label: "产品售后", value: 3, color: "warning" },
  { label: "物流售后", value: 4, color: "warning" },
  { label: "知识更新", value: 5, color: "success" },
  { label: "仓库缺货", value: 6, color: "danger" },
  { label: "咨询", value: 7, color: "success" },
  { label: "投诉", value: 8, color: "danger" },
  { label: "建议", value: 9, color: "success" }
])

// 优先级选项
const priorityOptions = ref([
  { label: "低", value: 1, color: "info" },
  { label: "中", value: 2, color: "primary" },
  { label: "高", value: 3, color: "warning" },
  { label: "紧急", value: 4, color: "danger" }
])

// 状态选项
const statusOptions = ref([
  { label: "待处理", value: 1, color: "info" },
  { label: "处理中", value: 2, color: "warning" },
  { label: "待确认", value: 3, color: "primary" },
  { label: "已关闭", value: 4, color: "success" },
  { label: "已取消", value: 5, color: "danger" }
])

// 客服人员选项
const staffOptions = ref<any>([])
const imageList = ref<any>([])

function getTicketType(typeValue: number) {
  return ticketTypeOptions.value.find((type: { value: number }) => type.value === typeValue)
}

function getPriority(priorityValue: number) {
  return priorityOptions.value.find((priority: { value: number }) => priority.value === priorityValue)
}

// 获取有效的标签类型
function getValidTagType(color?: string): "danger" | "warning" | "success" | "info" | "primary" {
  const validTypes = ["danger", "warning", "success", "info", "primary"]
  return validTypes.includes(color || "") ? color as any : "info"
}

function getStatus(statusValue: number) {
  return statusOptions.value.find((status: { value: number }) => status.value === statusValue)
}

async function fetchTickets() {
  loading.value = true
  try {
    const res = await fetchList(listQuery)
    if (res.data && res.data.tickets) {
      totalTickets.value = res.data.total
      tableData.value = res.data.tickets.map((item: any) => {
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          ticketType: item.ticketType,
          priority: item.priority,
          status: item.status,
          creator: item.creator?.name || item.creator?.username || "",
          assignee: item.assignee?.name || item.assignee?.user?.name || "",
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          processedAt: item.processedAt,
          related: item.related,
          orderId: item.order?.id,
          orderName: item.order?.name,
          orderUpdateAt: item.order?.updatedAt,
          closedAt: item.closedAt,
          remark: item.remark
        }
      })
      // 获取客服人员列表
      // if (res.data.staffList) {
      //   staffOptions.value = res.data.staffList
      // }
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error("获取工单失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSortChange(column: any) {
  console.log(column)
  // 可以根据需要实现排序逻辑
  handleFilter()
}

function handleFilterChange(filters: any) {
  if (filters.field === "status") {
    listQuery.status = filters.values.join(",")
  } else if (filters.field === "ticketType") {
    listQuery.ticketType = filters.values.join(",")
  } else if (filters.field === "priority") {
    listQuery.priority = filters.values.join(",")
  }
  handleFilter()
}

// 搜索方法
function handleFilter() {
  listQuery.page = 1
  fetchTickets()
}

function handleNew() {
  console.log(ticketFormRef.value)
  handleEdit(null)
}

function handleEdit(data: any) {
  openFrom(data)
}

function openFrom(data: any) {
  ticketFormRef.value?.open({
    id: 0,
    editData: data ?? null
  })
  ticketFormVisibility.value = true
  console.log(ticketFormVisibility.value)
}

function handleDetail(row: any) {
  loadDetail(row.id)
  activeTab.value = "detail"
}

function handleDelete(row: any) {
  ElMessageBox.confirm("确认删除此工单吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteTicket(row.id)
      ElMessage.success("删除成功")
      fetchTickets()
    } catch (error) {
      console.log(error)
      ElMessage.error("删除失败")
    }
  })
}

async function loadDetail(id: number) {
  detailDrawer.value = true
  try {
    const res = await fetchDetail(id)
    if (res.data) {
      ticketDetail.value = res.data
      assignForm.assigneeId = res.data.assigneeId || 0
      // 将附件按ID分组
      const attachments = res.data.attachments || []
      attachments.forEach((item: any) => {
        if (!attachmentMap.value[item.commentId]) {
          attachmentMap.value[item.commentId] = []
        }
        attachmentMap.value[item.commentId].push(item.path)
      })

      console.log(attachmentMap)
    }
  } catch (error) {
    console.log(error)
    ElMessage.error("获取详情失败")
  }
}

function handleTabClick(tab: any) {
  console.log(tab)
  // 可以根据需要处理标签页切换
}

// 分配工单
async function handleAssign() {
  if (!assignForm.assigneeId) {
    ElMessage.warning("请选择处理人")
    return
  }

  try {
    await assignTicket(ticketDetail.value.id, assignForm)
    ElMessage.success("分配成功")
    loadDetail(ticketDetail.value.id)
    fetchTickets()
  } catch (error) {
    console.log(error)
    ElMessage.error("分配失败")
  }
}

// 处理工单
async function handleProcess() {
  try {
    await processTicket(ticketDetail.value.id)
    ElMessage.success("开始处理")
    loadDetail(ticketDetail.value.id)
    fetchTickets()
  } catch (error) {
    console.log(error)
    ElMessage.error("操作失败")
  }
}

// 确认工单
async function handleConfirm() {
  try {
    await confirmTicket(ticketDetail.value.id)
    ElMessage.success("确认成功")
    loadDetail(ticketDetail.value.id)
    fetchTickets()
  } catch (error) {
    console.log(error)
    ElMessage.error("操作失败")
  }
}

// 关闭工单
async function handleClose() {
  try {
    await closeTicket(ticketDetail.value.id)
    ElMessage.success("关闭成功")
    loadDetail(ticketDetail.value.id)
    fetchTickets()
  } catch (error) {
    console.log(error)
    ElMessage.error("操作失败")
  }
}

// 取消工单
// async function handleCancel() {
//   try {
//     await cancelTicket(ticketDetail.value.id)
//     ElMessage.success("取消成功")
//     loadDetail(ticketDetail.value.id)
//     fetchTickets()
//   } catch (error) {
//     console.log(error)
//     ElMessage.error("操作失败")
//   }
// }

// 添加评论
async function handleAddComment() {
  if (!commentForm.content) {
    ElMessage.warning("请输入评论内容")
    return
  }

  commentForm.fileList = imageList.value.map((item: any) => item.response?.data?.url || item.url).filter((item: any) => item)

  try {
    await addComment(ticketDetail.value.id, commentForm)
    ElMessage.success("评论添加成功")
    commentForm.content = ""
    commentForm.isInternal = false
    commentForm.isDone = false
    commentForm.fileList = []
    imageList.value = []
    loadDetail(ticketDetail.value.id)
    fetchTickets()
  } catch (error) {
    console.log(error)
    ElMessage.error("添加评论失败")
  }
}

function beforeImageUpload(file: any) {
  const isImage = file.type.startsWith("image/")
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error("只能上传图片文件!")
    return false
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 2MB!")
    return false
  }
  return true
}

function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append("image", file)
  return request({
    url: "upload/image",
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        onProgress({ percent })
      }
    }
  }).then((response: any) => {
    onSuccess(response)
    return response
  }).catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

// 导出Excel
async function handleExport() {
  loading.value = true
  try {
    const exportQuery = { ...listQuery, page: 1, pageSize: totalTickets.value }
    const res = await fetchList(exportQuery)

    if (res.data && res.data.tickets && res.data.tickets.length > 0) {
      const exportData = res.data.tickets.map((item: any) => {
        return {
          工单编号: item.id || "",
          标题: item.title || "",
          工单类型: getTicketType(item.ticketType)?.label || "",
          优先级: getPriority(item.priority)?.label || "",
          状态: getStatus(item.status)?.label || "",
          创建人: item.creator?.name || item.creator?.username || "",
          处理人: item.assignee?.staff?.name || item.assignee?.name || "",
          创建时间: item.createdAt || "",
          更新时间: item.updatedAt || "",
          备注: item.remark || ""
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "工单列表")

      const colWidth = [
        { wch: 10 }, // 工单编号
        { wch: 30 }, // 标题
        { wch: 10 }, // 工单类型
        { wch: 10 }, // 优先级
        { wch: 10 }, // 状态
        { wch: 15 }, // 创建人
        { wch: 15 }, // 处理人
        { wch: 20 }, // 创建时间
        { wch: 20 }, // 更新时间
        { wch: 30 } // 备注
      ]
      worksheet["!cols"] = colWidth

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      const now = new Date()
      const fileName = `工单列表_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.xlsx`

      FileSaver.saveAs(blob, fileName)
      ElMessage.success("导出成功")
    } else {
      ElMessage.warning("没有数据可导出")
    }
  } catch (error) {
    console.error("导出失败:", error)
    ElMessage.error("导出失败，请稍后重试")
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTickets()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索标题或内容"
        class="filter-item"
        style="width: 200px;"
        @keyup.enter="handleFilter"
        @clear="handleFilter"
        clearable
      />
      <el-select
        v-model="listQuery.status"
        placeholder="工单状态"
        style="width: 120px; margin-left: 10px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="status in statusOptions"
          :key="status.value"
          :label="status.label"
          :value="status.value"
        />
      </el-select>
      <el-select
        v-model="listQuery.ticketType"
        placeholder="工单类型"
        style="width: 120px; margin-left: 10px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="type in ticketTypeOptions"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        />
      </el-select>
      <el-select
        v-model="listQuery.priority"
        placeholder="优先级"
        style="width: 120px; margin-left: 10px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="priority in priorityOptions"
          :key="priority.value"
          :label="priority.label"
          :value="priority.value"
        />
      </el-select>
      <el-date-picker
        v-model="listQuery.startDate"
        placeholder="开始日期"
        value-format="YYYY-MM-DD"
        @change="handleFilter"
        style="width: 150px; margin-left: 10px;"
      />
      <el-date-picker
        v-model="listQuery.endDate"
        placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="handleFilter"
        style="width: 150px; margin-left: 10px;"
      />
      <el-button type="primary" @click="handleFilter" style="margin-left: 10px;">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增工单</el-button>
      <el-button type="primary" @click="handleExport">导出Excel</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        :filter-config="{ remote: true }"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="title" min-width="200" title="标题" align="left" />
        <vxe-column field="ticketType" width="100" title="类型" :filters="ticketTypeOptions">
          <template #default="{ row }">
            <el-tag
              v-if="getTicketType(row.ticketType)"
              :type="getValidTagType(getTicketType(row.ticketType)?.color)"
            >
              {{ getTicketType(row.ticketType)?.label }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="priority" width="100" title="优先级" :filters="priorityOptions">
          <template #default="{ row }">
            <el-tag
              v-if="getPriority(row.priority)"
              :type="getValidTagType(getPriority(row.priority)?.color)"
            >
              {{ getPriority(row.priority)?.label }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="status" width="100" title="状态" :filters="statusOptions">
          <template #default="{ row }">
            <el-tag
              v-if="getStatus(row.status)"
              :type="getValidTagType(getStatus(row.status)?.color)"
            >
              {{ getStatus(row.status)?.label }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="creator" width="120" title="创建人" />
        <vxe-column field="assignee" width="120" title="处理人" />
        <vxe-column field="createdAt" title="创建时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </vxe-column>
        <vxe-column field="updatedAt" title="更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)" v-if="row.status === 1">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="row.creator === userId || isAdmin">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalTickets"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <!-- 工单详情抽屉 -->
    <el-drawer v-model="detailDrawer" title="工单详情" size="50%" direction="rtl">
      <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
        <el-tab-pane label="工单详情" name="detail">
          <div class="ticket-detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="工单编号">{{ ticketDetail.id }}</el-descriptions-item>
              <el-descriptions-item label="标题">{{ ticketDetail.title }}</el-descriptions-item>
              <el-descriptions-item label="工单类型">
                <el-tag v-if="getTicketType(ticketDetail.ticketType)" :type="getValidTagType(getTicketType(ticketDetail.ticketType)?.color)">
                  {{ getTicketType(ticketDetail.ticketType)?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag v-if="getPriority(ticketDetail.priority)" :type="getValidTagType(getPriority(ticketDetail.priority)?.color)">
                  {{ getPriority(ticketDetail.priority)?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag v-if="getStatus(ticketDetail.status)" :type="getValidTagType(getStatus(ticketDetail.status)?.color)">
                  {{ getStatus(ticketDetail.status)?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建人">{{ ticketDetail.creator?.name || ticketDetail.creator?.username }}</el-descriptions-item>
              <el-descriptions-item label="处理人">{{ ticketDetail.assignee?.staff?.name || ticketDetail.assignee?.name || '未分配' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(ticketDetail.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDateTime(ticketDetail.updatedAt) }}</el-descriptions-item>
              <el-descriptions-item label="处理时间">{{ ticketDetail.processedAt ? formatDateTime(ticketDetail.processedAt) : '未处理' }}</el-descriptions-item>
              <el-descriptions-item label="关闭时间">{{ ticketDetail.closedAt ? formatDateTime(ticketDetail.closedAt) : '未关闭' }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ ticketDetail.remark || '无' }}</el-descriptions-item>
            </el-descriptions>

            <div style="margin-top: 20px;">
              <h4>工单内容</h4>
              <div style="padding: 10px; border: 1px solid #dcdfe6; border-radius: 4px; background-color: #f5f7fa;">
                {{ ticketDetail.content }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="工单操作" name="actions">
          <div class="ticket-actions">
            <!-- 分配工单 -->
            <div v-if="staffOptions.length > 0 && (ticketDetail.status === 1 || !ticketDetail.assigneeId)" style="margin-bottom: 20px;">
              <h4>分配工单</h4>
              <el-form :inline="true">
                <el-form-item label="处理人">
                  <el-select v-model="assignForm.assigneeId" placeholder="选择处理人" style="width: 200px;">
                    <el-option
                      v-for="staff in staffOptions"
                      :key="staff.id"
                      :label="staff.name || staff.username"
                      :value="staff.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleAssign">分配</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 工单状态操作 -->
            <div>
              <h4>状态操作</h4>
              <el-space>
                <el-button v-if="ticketDetail.status === 1" type="warning" @click="handleProcess">开始处理</el-button>
                <el-button v-if="ticketDetail.status === 2" type="primary" @click="handleConfirm">待确认</el-button>
                <el-button v-if="ticketDetail.status === 3 && ticketDetail.creator === userId" type="success" @click="handleClose">关闭工单</el-button>
                <!-- <el-button v-if="ticketDetail.status < 4" type="danger" @click="handleCancel">取消工单</el-button> -->
              </el-space>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="评论记录" name="comments">
          <div class="comments-section">
            <!-- 评论列表 -->
            <div v-if="ticketDetail.comments && ticketDetail.comments.length > 0">
              <div v-for="comment in ticketDetail.comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <span class="comment-user">{{ comment.user?.name || comment.user?.username }}</span>
                  <span class="comment-time">{{ formatDateTime(comment.createdAt) }}</span>
                  <el-tag v-if="comment.isInternal" type="warning" size="small">内部</el-tag>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
                <div class="comment-images" v-if="attachmentMap[comment.id] && attachmentMap[comment.id].length > 0">
                  <el-image
                    style="width: 80px; height: 80px"
                    :src="attachmentMap[comment.id][0]?.replace('uploads', 'uploads/thumb/')"
                    :preview-src-list="attachmentMap[comment.id]"
                    :preview-teleported="true"
                    fit="cover"
                  />
                </div>
              </div>
            </div>
            <div v-else class="no-comments">
              暂无评论
            </div>

            <!-- 添加评论 -->
            <div class="add-comment" style="margin-top: 20px;">
              <h4>添加评论（处理意见或进度）</h4>
              <el-form>
                <el-form-item>
                  <el-input
                    v-model="commentForm.content"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入评论内容"
                  />
                </el-form-item>
                <el-form-item>
                  <el-upload
                    v-model:file-list="imageList"
                    class="image-uploader"
                    list-type="picture-card"
                    :before-upload="beforeImageUpload"
                    :http-request="customUploadRequest"
                  >
                    <el-icon class="image-uploader-icon"><Plus /></el-icon>
                  </el-upload>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="commentForm.isInternal">内部评论</el-checkbox>
                  <el-checkbox v-model="commentForm.isDone">完成处理</el-checkbox>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleAddComment">添加评论</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <TicketForm
      ref="ticketFormRef"
      @success="fetchTickets"
      @close="ticketFormVisibility = false"
    />
  </div>
</template>

<style scoped>
.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 20px 5px;
}
.fr {
  float: right;
}
.footer-container {
  padding: 10px;
  padding-left: 60px;
  background: #fff;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}

.ticket-detail {
  padding: 20px;
}

.ticket-actions {
  padding: 20px;
}

.comments-section {
  padding: 20px;
}

.comment-item {
  border-bottom: 1px solid #ebeef5;
  padding: 15px 0;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: bold;
  margin-right: 10px;
}

.comment-time {
  color: #909399;
  font-size: 12px;
  margin-right: 10px;
}

.comment-content {
  color: #606266;
  line-height: 1.5;
}

.comment-images {
  margin-top: 10px;
}

.no-comments {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.add-comment {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.image-uploader .image-previews {
  width: 80px;
  height: 80px;
  display: block;
}

.el-icon.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
:deep(.el-upload-list--picture-card) {
  --el-upload-list-picture-card-size: 80px;
}
:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: cover;
}
</style>

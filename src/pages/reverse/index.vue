<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { copyTextToClipboard } from "@/common/utils/helper"
import PreviewForm from "../quotation/_preview.vue"
import { fetchList, fetchReturnOrder, fetchReturnOrderStatusLog } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  type: "",
  platformIds: [] as number[],
  payStatus: [] as number[],
  startDate: "",
  endDate: "",
  username: "",
  keyword: "",
  color: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})
const totalOrders = ref(0)
const tableData = ref<any>([])
const detailDrawer = ref(false)
const orderDetail = ref<any>([])
const activeTab = ref("materia")
const returnWorkflow = ref<any>([])
const platformOptions = ref<any>([])
const orderDetailCache = new Map<number, any>()
const previewFormRef = ref()
const previewFormVisible = ref(false)
const materialList = ref("")

const payStatusOptions = ref<any>([
  { label: "未支付", value: 0, color: "info", checked: false },
  { label: "已支付", value: 1, color: "success", checked: false },
  { label: "已退款", value: 2, color: "danger", checked: false }
])

function getPayStatus(statusValue: number) {
  return payStatusOptions.value.find((status: { value: number }) => status.value === statusValue)
}

async function fetchOrders() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.returnOrders) {
        totalOrders.value = res.data.total
        tableData.value = res.data.returnOrders.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            platformId: item.platformId,
            platform: item.platform,
            customer: item.customer,
            user: item.user?.staff?.name || item.user?.username || "",
            reviewer: item.reviewer,
            quantity: item.quantity,
            returnAmount: item.returnAmount,
            status: item.status,
            refundStatus: item.refundStatus,
            reason: item.reason,
            remark: item.remark,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }
        })
        platformOptions.value = res.data.platforms.map((item: any) => {
          return {
            label: item.name,
            value: Number(item.value),
            icon: item.icon,
            code: item.remark,
            checked: listQuery.platformIds ? listQuery.platformIds.includes(Number(item.value)) : false
          }
        })
      } else {
        tableData.value = []
      }
    })
  } catch (error) {
    console.error("获取记录失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSortChange(column: any) {
  const { field, order } = column
  listQuery.sort = (order === "desc" ? "-" : "+") + field
  handleFilter()
}

function handleFilterChange(filters: any) {
  if (filters.field === "status") {
    listQuery.payStatus = filters.values
    payStatusOptions.value.forEach((option: any) => {
      option.checked = filters.values.includes(option.value)
    })
  } else if (filters.field === "platformId") {
    listQuery.platformIds = filters.values
    platformOptions.value.forEach((option: any) => {
      option.checked = filters.values.includes(option.value)
    })
  }
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchOrders()
}

function handleDetail(id: number) {
  loadDetail(id)
  activeTab.value = "materia"
}

function loadDetail(id: number) {
  detailDrawer.value = true
  getOrderDetail(id).then((order: any) => {
    orderDetail.value = order
    materialList.value = ""
    for (const item of order.items) {
      materialList.value += `<${item.product.materialId}*${item.quantity}>`
    }
  })
}

async function getOrderDetail(id: number): Promise<any> {
  if (orderDetailCache.has(id)) {
    return orderDetailCache.get(id)
  } else {
    return await new Promise((resolve, reject) => {
      fetchReturnOrder(id).then((res: any) => {
        orderDetailCache.set(id, res.data)
        resolve(res.data)
      }).catch((error) => {
        reject(error)
      })
    })
  }
}

function handleTabClick(tab: any) {
  if (tab.paneName === "workflow") {
    fetchReturnOrderStatusLog(orderDetail.value.id).then((res: any) => {
      returnWorkflow.value = res.data.map((item: any) => {
        return {
          timestamp: formatDateTime(item.createdAt),
          content: `${item.operation} (by: ${item.operatorName})`
        }
      })
    })
  }
}

async function handleCopy() {
  await copyTextToClipboard(materialList.value)
  ElMessage.success("复制物料详情成功")
}

function handlePreviewReturn(id: number) {
  getOrderDetail(id).then((order: any) => {
    const previewData = order.items.map((item: any) => {
      const product = item.product
      const images = product.imageUrls?.split(",") || []
      return {
        rowId: getRowIdentity(),
        id: String(product.id),
        modelType: product.modelType?.name || "",
        modelTypeId: product.modelType?.name || "",
        modelOld: product.modelType?.name || "",
        materialId: product.materialId || "",
        serie: product.serie?.name || "",
        color: product.color?.value || "",
        name: product.name || "",
        quantity: item.quantity || 1,
        basePrice: product.basePrice || 0,
        finalUnitPrice: item.unitPrice || 0,
        payPrice: item.totalPrice || 0,
        colorOptions: [],
        backupProducts: [],
        colorEditable: false,
        popoverVisible: false,
        imageUrls: images,
        imageUrl: images.length > 0 ? images[0] : "",
        returnQuantity: item.quantity,
        returnDiscount: Number((item.totalPrice / item.quantity / item.unitPrice).toFixed(2)),
        refund: Number(item.totalPrice)
      }
    })
    previewFormRef.value?.open({
      data: previewData,
      type: 3,
      title: order.name,
      platformId: order.platformId,
      license: ""
    })
    previewFormVisible.value = true
  })
}

function getRowIdentity() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-date-picker v-model="listQuery.startDate" placeholder="选择开始日期" value-format="YYYY-MM-DD" @change="handleFilter" style="width: 180px; margin-right: 6px;" />
      <el-date-picker v-model="listQuery.endDate" placeholder="选择结束日期" value-format="YYYY-MM-DD" @change="handleFilter" style="width: 180px; margin-right: 6px;" />
      <el-input v-model="listQuery.username" placeholder="制单人" class="filter-item" style="width: 150px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="platformId" width="120" title="平台" :filters="platformOptions" :filter-multiple="true" :filter-method="({ option, row }) => row.platformId === option.value">
          <template #default="{ row }">{{ platformOptions.find((platform: any) => Number(platform.value) === row.platformId)?.label || "" }}</template>
        </vxe-column>
        <vxe-column field="createdAt" title="申请时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </vxe-column>
        <vxe-column field="name" width="200" title="名称" align="left" />
        <vxe-column field="reason" min-width="200" title="退款原因" align="left" />
        <vxe-column field="user" width="100" title="制单人" />
        <vxe-column field="reviewer" width="100" title="审核人" />
        <vxe-column field="quantity" width="80" title="数量" />
        <vxe-column field="returnAmount" width="100" title="退货金额" />
        <vxe-column field="status" width="100" title="支付状态" :filters="payStatusOptions" :filter-multiple="true" :filter-method="({ option, row }) => row.status === option.value">
          <template #default="{ row }">
            <el-tag
              v-if="getPayStatus(row.status)"
              :type="getPayStatus(row.status).color"
            >
              {{ getPayStatus(row.status).label }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="refundStatus" width="100" title="退款状态" />
        <vxe-column field="actions" title="操作" width="220">
          <template #default="data">
            <el-button type="success" @click="handlePreviewReturn(data.row.id)">退货单预览</el-button>
            <el-button type="primary" @click="handleDetail(data.row.id)">详情</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalOrders"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <el-drawer v-model="detailDrawer" title="订单详情" size="38%" direction="rtl">
      <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
        <el-tab-pane label="物料详情" name="materia">
          <div>
            {{ materialList }}
          </div>
          <div style="margin-top: 20px;">
            <el-button type="primary" @click="handleCopy">复制</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="退货流程" name="workflow">
          <el-timeline style="margin-top: 20px;">
            <el-timeline-item
              v-for="(activity, index) in returnWorkflow"
              :key="index"
              :timestamp="activity.timestamp"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <PreviewForm
      ref="previewFormRef"
      @close="previewFormVisible = false"
    />
  </div>
</template>

<style coped>
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
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>

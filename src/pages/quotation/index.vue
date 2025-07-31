<script lang="ts" setup>
import type { OrderDetailResponseData, OrderItemsData } from "./apis/type"
import { formatDateTime } from "@/common/utils/datetime"
import { copyTextToClipboard } from "@/common/utils/helper"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import PreviewForm from "./_preview.vue"
import { createReturnOrder, fetchList, fetchOrder, fetchOrderStatusLog, updateOrderStatus } from "./apis"

const router = useRouter()
const loading = ref(false)
const listQuery = reactive({
  type: "",
  platformIds: [] as number[],
  username: "",
  keyword: "",
  color: "",
  sort: "+id",
  startDate: "",
  endDate: "",
  payStatus: [] as number[],
  status: [] as number[],
  page: 1,
  pageSize: 20
})
const totalOrders = ref(0)
const tableData = ref<any>([])
const newDialogVisibility = ref(false)
const selectedPlatform = ref("")
const platformOptions = ref<any>([])
const otherPlatformOptions = ref<any>([])
const detailDrawer = ref(false)
const orderDetail = ref<any>([])
const activeTab = ref("materia")
const returnForm = reactive({
  orderId: 0,
  returns: [] as any[],
  total: 0,
  amount: 0,
  reason: "",
  remark: ""
})
const statusForm = reactive({
  orderId: 0,
  status: 0,
  remark: ""
})
const orderStatusLogs = ref<any>([])
const statusOptions = ref<any>([
  { label: "草稿", value: -1, color: "info", checked: false },
  { label: "待支付", value: 0, color: "info", checked: false },
  { label: "已支付", value: 1, color: "info", checked: false },
  { label: "处理中", value: 2, color: "warning", checked: false },
  { label: "已发货", value: 3, color: "primary", checked: false },
  { label: "已签收", value: 4, color: "primary", checked: false },
  { label: "售后中", value: 5, color: "danger", checked: false },
  { label: "已完成", value: 6, color: "success", checked: false }
])
const payStatusOptions = ref<any>([
  { label: "未支付", value: 0, color: "info", checked: false },
  { label: "已支付", value: 1, color: "success", checked: false },
  { label: "已退款", value: 2, color: "danger", checked: false }
])
const materialList = ref("")
const previewFormRef = ref()
const previewFormVisible = ref(false)
const systemParamsStore = useSystemParamsStore()
const bonusSeriesIds = computed(() => systemParamsStore.getNumberArrayParam("bonus_series_ids"))

function getMatchedStatus(statusValue: number) {
  return statusOptions.value.find((status: { value: number }) => status.value === statusValue)
}

function getPayStatus(statusValue: number) {
  return payStatusOptions.value.find((status: { value: number }) => status.value === statusValue)
}

async function fetchOrders() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.orders) {
        totalOrders.value = res.data.total
        tableData.value = res.data.orders.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            platformId: item.platformId,
            authCode: item.authCode,
            customer: item.customer,
            user: item.user?.staff?.name || item.user?.username || "",
            reviewer: item.reviewer,
            quantity: item.quantity,
            originPrice: item.originPrice,
            payPrice: item.payPrice,
            payStatus: item.payStatus,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            status: item.status,
            remark: item.remark
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
        otherPlatformOptions.value = platformOptions.value.filter((item: any) => !item.icon)

        statusOptions.value.forEach((option: any) => {
          option.checked = listQuery.status ? listQuery.status.includes(option.value) : false
        })

        payStatusOptions.value.forEach((option: any) => {
          option.checked = listQuery.payStatus ? listQuery.payStatus.includes(option.value) : false
        })

        // console.log("platformOptions", platformOptions.value)
        // console.log("statusOptions checked状态", statusOptions.value)
        // console.log("payStatusOptions checked状态", payStatusOptions.value)
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
  if (filters.field === "payStatus") {
    listQuery.payStatus = filters.values
    payStatusOptions.value.forEach((option: any) => {
      option.checked = filters.values.includes(option.value)
    })
  } else if (filters.field === "status") {
    listQuery.status = filters.values
    statusOptions.value.forEach((option: any) => {
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

function handleNew() {
  newDialogVisibility.value = true
}

function platformSelection() {
  if (selectedPlatform.value) {
    const code = platformOptions.value.find((item: any) => item.value === selectedPlatform.value)?.code
    navto(selectedPlatform.value, code)
  } else {
    ElMessage.warning("请选择平台类型")
  }
}

function navto(platform: string, code: string) {
  newDialogVisibility.value = false
  router.push(`/quotation/new?platform=${platform}&code=${code}&type=${listQuery.type}`)
}

function handleReturn(id: number) {
  handleDetail(id)
  activeTab.value = "service"
}

function handleDetail(id: number) {
  loadDetail(id)
  activeTab.value = "materia"
}

function handleEdit(id: number) {
  router.push(`/quotation/new?id=${id}`)
}

function handlePreview(id: number) {
  fetchOrder(id).then(async (response: OrderDetailResponseData) => {
    if (response.code === 0) {
      const order = response.data
      const prices = JSON.parse(order.prices || "{}")
      const previewData = order.items.map((item: OrderItemsData) => {
        const product = item.product
        const originPrice = Number((product.basePrice * item.quantity).toFixed(2))
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
          originPrice: originPrice || 0,
          finalUnitPrice: item.unitPrice || 0,
          payPrice: item.totalPrice || 0,
          colorOptions: [],
          backupProducts: [],
          colorEditable: false,
          popoverVisible: false,
          isBonus: bonusSeriesIds.value.includes(product.serie?.id),
          imageUrls: images,
          imageUrl: images.length > 0 ? images[0] : ""
        }
      })
      previewFormRef.value?.open({
        data: previewData,
        type: Number(listQuery.type) || 1,
        title: order.name || "",
        platformId: order.platformId,
        license: order.platform?.remark || "",
        summary: {
          dialyDiscount: Number(order.originPrice) - Number(prices.dailyPrice || order.payPrice),
          dailyPrice: prices.dailyPrice || order.payPrice,
          promotionDiscount: Number(order.originPrice) - Number(prices.promotionPrice || order.payPrice),
          promotionPrice: prices.promotionPrice || order.payPrice,
          flashDiscount: 0,
          flashPrice: order.payPrice,
          bonusUsed: prices.bonusUsed || 0
        }
      })
      previewFormVisible.value = true
    } else {
      ElMessage.error(`获取订单详情失败: ${response.message || "网络错误"}`)
    }
  })
}

function getRowIdentity() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

function loadDetail(id: number) {
  detailDrawer.value = true
  fetchOrder(id).then((res: any) => {
    if (res.data) {
      returnForm.orderId = id
      if (res.data.items && Array.isArray(res.data.items)) {
        materialList.value = ""
        for (const item of res.data.items) {
          materialList.value += `<${item.product.materialId}*${item.quantity}>`
        }
        res.data.items.forEach((item: any) => {
          item.returnQuantity = 0
          item.refund = 0
        })
      }
      orderDetail.value = res.data
    }
  })
}

function handleTabClick(tab: any) {
  if (tab.paneName === "workflow") {
    fetchOrderStatusLog(orderDetail.value.id).then((res: any) => {
      orderStatusLogs.value = res.data.map((item: any) => {
        return {
          timestamp: `${formatDateTime(item.createdAt)} ${item.operatorName}`,
          content: `${item.operation} (${getMatchedStatus(item.previousStatus)?.label} -> ${getMatchedStatus(item.currentStatus)?.label})`
        }
      })
      statusForm.orderId = orderDetail.value.id
      statusForm.status = orderDetail.value.status
      statusForm.remark = ""
    })
  }
}

async function handleCopy() {
  await copyTextToClipboard(materialList.value)
  ElMessage.success("复制物料详情成功")
}

function handleSubmitReturn() {
  detailDrawer.value = false
  let total = 0
  let amount = 0
  returnForm.returns = orderDetail.value.items.map((item: any) => {
    total += item.returnQuantity
    amount += item.refund
    return {
      orderItemId: item.id,
      quantity: item.returnQuantity,
      refund: item.refund
    }
  })
  if (total === 0) {
    ElMessage.warning("请选择退货数量")
    return
  }
  returnForm.total = total
  returnForm.amount = amount
  createReturnOrder(returnForm).then((res: any) => {
    if (res.code === 0) {
      ElMessage.success("申请成功")
      handleFilter()
    } else {
      ElMessage.error("申请失败")
    }
  })
}

function handleUpdateStatus() {
  const dialog = ElMessageBox.confirm("确认更新订单状态吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  dialog.then(() => {
    updateOrderStatus(orderDetail.value.id, statusForm).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success("更新状态成功")
        orderDetail.value.status = statusForm.status
        handleFilter()
        handleTabClick({ paneName: "workflow" })
      }
    }).catch(() => {
      ElMessage.error("更新状态失败")
    })
  })
}

async function handleExport() {
  loading.value = true
  try {
    // 获取所有数据（不分页）
    const exportQuery = { ...listQuery, page: 1, pageSize: totalOrders.value }
    const res = await fetchList(exportQuery)

    if (res.data && res.data.orders && res.data.orders.length > 0) {
      // 准备导出数据
      const exportData = res.data.orders.map((item: any) => {
        return {
          订单编号: item.id || "",
          平台: platformOptions.value.find((platform: any) => Number(platform.value) === Number(item.platformId))?.label || "",
          下单时间: item.createdAt || "",
          名称: item.name || "",
          制单人: item.user?.staff?.name || item.user?.username || "",
          审核人: item.reviewerId || "",
          数量: item.quantity || "",
          日常总价: item.originPrice || "",
          到手总价: item.payPrice || "",
          订单状态: getMatchedStatus(item.status)?.label || "",
          支付状态: getPayStatus(item.payStatus)?.label || "",
          支付时间: item.payAt || "",
          备注: item.remark || ""
        }
      })

      // 创建工作簿和工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "商品列表")

      // 设置列宽
      const colWidth = [
        { wch: 15 }, // 订单编号
        { wch: 15 }, // 平台
        { wch: 15 }, // 下单时间
        { wch: 25 }, // 名称
        { wch: 10 }, // 制单人
        { wch: 10 }, // 审核人
        { wch: 10 }, // 数量
        { wch: 10 }, // 日常总价
        { wch: 10 }, // 到手总价
        { wch: 10 }, // 订单状态
        { wch: 10 }, // 支付状态
        { wch: 15 }, // 支付时间
        { wch: 30 } // 备注
      ]
      worksheet["!cols"] = colWidth

      // 生成Excel文件并下载
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // 生成文件名（包含当前日期）
      const now = new Date()
      const fileName = `订单列表_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.xlsx`

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
  listQuery.type = router.currentRoute.value.path === "/quotation/quotation/project" ? "2" : "1"
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
      <el-button type="primary" @click="handleNew">新增订单</el-button>
      <el-button type="primary" @click="handleExport">导出Excel</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        :filter-config="{ remote: true, showIcon: true, iconNone: 'vxe-icon-funnel', iconMatch: 'vxe-icon-funnel' }"
        @sort-change="handleSortChange"
        @filter-change="handleFilterChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="platformId" width="120" title="平台" :filters="platformOptions" :filter-multiple="true" :filter-method="({ option, row }) => row.platformId === option.value">
          <template #default="{ row }">{{ platformOptions.find((platform: any) => Number(platform.value) === row.platformId)?.label || "" }}</template>
        </vxe-column>
        <vxe-column field="createdAt" title="下单时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </vxe-column>
        <vxe-column field="name" min-width="180" title="名称" align="left">
          <template #default="data">
            <span style="margin-right: 8px;">{{ data.row.name }}</span>
            <el-tag v-if="data.row.remark">{{ data.row.remark }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="user" width="120" title="制单人" />
        <vxe-column field="reviewer" width="80" title="审核人" />
        <vxe-column field="quantity" width="80" title="数量" />
        <vxe-column field="originPrice" width="100" title="日常总价" />
        <vxe-column field="payPrice" width="100" title="到手总价" />
        <vxe-column field="status" width="100" title="订单状态" :filters="statusOptions" :filter-multiple="true" :filter-method="({ option, row }) => row.status === option.value">
          <template #default="{ row }">
            <el-tag
              v-if="getMatchedStatus(row.status)"
              :type="getMatchedStatus(row.status).color"
            >
              {{ getMatchedStatus(row.status).label }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="payStatus" width="100" title="支付状态" :filters="payStatusOptions" :filter-multiple="true" :filter-method="({ option, row }) => row.payStatus === option.value">
          <template #default="{ row }">
            <el-tag
              v-if="getPayStatus(row.payStatus)"
              :type="getPayStatus(row.payStatus).color"
            >
              {{ getPayStatus(row.payStatus).label }}
            </el-tag>
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="260">
          <template #default="data">
            <el-button type="success" @click="handlePreview(data.row.id)">报价预览</el-button>
            <el-button type="primary" v-if="data.row.status === -1" @click="handleEdit(data.row.id)">继续报价</el-button>
            <el-button type="success" v-if="data.row.status > -1" @click="handleDetail(data.row.id)">详情</el-button>
            <el-button type="primary" v-if="data.row.status > -1" @click="handleReturn(data.row.id)">售后</el-button>
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
        <el-tab-pane label="申请售后" name="service">
          <div>
            <el-alert v-if="orderDetail.status !== 4 && orderDetail.status !== 5" title="已签收状态下才可申请售后" type="success" effect="dark" :closable="false" />
            <el-alert v-if="orderDetail.status === 5" title="本订单已申请退货" type="warning" effect="dark" :closable="false" />
            <el-alert v-if="orderDetail.status === 4" title="不拆包装、不影响二次销售" type="error" effect="dark" :closable="false" />
          </div>
          <el-form v-if="orderDetail.status === 4">
            <el-table :data="orderDetail.items">
              <el-table-column label="条形码" width="130" align="center">
                <template #default="scope">
                  <el-text truncated>{{ scope.row.product.barCode }}</el-text>
                </template>
              </el-table-column>
              <el-table-column label="名称" min-width="200">
                <template #default="scope">
                  <el-text truncated>{{ scope.row.product.name }}</el-text>
                </template>
              </el-table-column>
              <el-table-column prop="unitPrice" label="到手单价" width="80" align="center" />
              <el-table-column prop="quantity" width="100" label="退回数量">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.returnQuantity"
                    controls-position="right"
                    :min="0"
                    :precision="0"
                    :max="scope.row.quantity"
                    style="width: 100%;"
                    @change="scope.row.refund = scope.row.unitPrice * scope.row.returnQuantity"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="refund" label="退款金额" width="80" align="center" />
            </el-table>
            <div class="footer-container">
              <el-input v-model="returnForm.reason" placeholder="请输入退货原因" />
              <el-input v-model="returnForm.remark" type="textarea" :rows="3" placeholder="请输入售后备注" style="margin-top: 10px;" />
              <el-button type="primary" @click="handleSubmitReturn" style="margin-top: 10px;">提交退货申请</el-button>
            </div>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="订单流程" name="workflow">
          <el-timeline style="margin-top: 20px;">
            <el-timeline-item
              v-for="(activity, index) in orderStatusLogs"
              :key="index"
              :timestamp="activity.timestamp"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
          <el-form style="margin-top: 20px;">
            <el-form-item label="订单状态" prop="status" label-width="100">
              <el-select v-model="statusForm.status" placeholder="请选择订单状态" style="width: 200px">
                <el-option v-for="(status, index) in statusOptions" :key="index" :label="status.label" :value="status.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="备注" prop="remark" label-width="100">
              <el-input v-model="statusForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
            <el-form-item label-width="100">
              <el-button type="primary" @click="handleUpdateStatus">更新</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <el-dialog
      v-model="newDialogVisibility"
      title="新增报价单"
      width="30%"
      :close-on-click-modal="false"
    >
      <div style="text-align: center;">
        <el-tooltip
          v-for="item in platformOptions.filter((item: any) => item.value !== 0 && item.icon)"
          :key="item.value"
          :content="item.label"
          effect="dark"
          placement="top"
        >
          <svg-icon name="preserve-color/platform-douyin" v-if="item.icon === 'douyin'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <svg-icon name="preserve-color/platform-jingdong" v-if="item.icon === 'jingdong'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <svg-icon name="preserve-color/platform-tianmao" v-if="item.icon === 'tianmao'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <svg-icon name="preserve-color/platform-taobao" v-if="item.icon === 'taobao'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <svg-icon name="preserve-color/platform-xianyu" v-if="item.icon === 'xianyu'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <svg-icon name="preserve-color/platform-pdd" v-if="item.icon === 'pdd'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <svg-icon name="preserve-color/platform-xiaohongshu" v-if="item.icon === 'xiaohongshu'" @click="navto(item.value, item.code)" class="platform-icon" style="width: 5em; height: 5em;" />
          <el-text />
        </el-tooltip>
        <el-select v-model="selectedPlatform" v-if="otherPlatformOptions.length > 0" placeholder="请选择其他平台类型" style="width: 100%; margin-top: 20px;" @change="platformSelection">
          <el-option v-for="item in otherPlatformOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </el-dialog>

    <PreviewForm
      ref="previewFormRef"
      @close="previewFormVisible = false"
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
.pagination-container {
  padding: 10px;
  background: #fff;
}
.footer-container {
  margin-top: 20px;
  text-align: center;
}
.platform-icon {
  margin-left: 10px;
  cursor: pointer;
}
</style>

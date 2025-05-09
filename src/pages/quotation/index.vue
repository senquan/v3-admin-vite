<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { createReturnOrder, fetchList, fetchOrder } from "./apis"

const router = useRouter()
const loading = ref(false)
const listQuery = reactive({
  type: "",
  platformId: 0,
  keyword: "",
  color: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})
const totalOrders = ref(0)
const tableData = ref<any>([])
const newDialogVisibility = ref(false)
const selectedPlatform = ref("")
const platformOptions = ref<any>([])
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
            value: item.value
          }
        })
        platformOptions.value.unshift({
          label: "全部",
          value: 0
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

// 搜索方法
function handleFilter() {
  fetchOrders()
}

function handleNew() {
  newDialogVisibility.value = true
}

function platformSelection() {
  if (selectedPlatform.value) {
    newDialogVisibility.value = false
    router.push(`/quotation/new?platform=${selectedPlatform.value}`)
  } else {
    ElMessage.warning("请选择平台类型")
  }
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

function loadDetail(id: number) {
  detailDrawer.value = true
  fetchOrder(id).then((res: any) => {
    if (res.data) {
      returnForm.orderId = id
      if (res.data.items && Array.isArray(res.data.items)) {
        res.data.items.forEach((item: any) => {
          item.returnQuantity = 0
          item.refund = 0
        })
      }
      orderDetail.value = res.data
    }
  })
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

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-select v-model="listQuery.platformId" placeholder="选择平台" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增订单</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="platform" width="80" title="平台">
          <template #default="{ row }">{{ platformOptions.find((platform: any) => Number(platform.value) === row.platformId)?.label || "" }}</template>
        </vxe-column>
        <vxe-column field="createdAt" title="下单时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </vxe-column>
        <vxe-column field="name" min-width="200" title="名称" align="left">
          <template #default="data">
            <span style="margin-right: 8px;">{{ data.row.name }}</span>
            <el-tag v-if="data.row.remark">{{ data.row.remark }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="customer" width="150" title="客户名" />
        <vxe-column field="reviewer" width="150" title="审核人" />
        <vxe-column field="quantity" width="80" title="数量" />
        <vxe-column field="originPrice" width="100" title="日常总价" />
        <vxe-column field="payPrice" width="100" title="到手总价" />
        <vxe-column field="status" width="80" title="订单状态">
          <template #default="{ row }">
            <el-tag type="info" v-if="row.status === -1" effect="dark">草稿</el-tag>
            <el-tag type="info" v-if="row.status === 0" effect="dark">待支付</el-tag>
            <el-tag type="info" v-if="row.status === 1" effect="dark">已支付</el-tag>
            <el-tag type="warning" v-if="row.status === 2" effect="dark">处理中</el-tag>
            <el-tag type="primary" v-if="row.status === 3" effect="dark">已发货</el-tag>
            <el-tag type="primary" v-if="row.status === 4" effect="dark">已签收</el-tag>
            <el-tag type="danger" v-if="row.status === 5" effect="dark">售后中</el-tag>
            <el-tag type="success" v-if="row.status === 6" effect="dark">已完成</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="payStatus" width="80" title="支付状态">
          <template #default="{ row }">
            <el-tag type="success" v-if="row.payStatus === 1">已支付</el-tag>
            <el-tag type="danger" v-if="row.payStatus === 0">未支付</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
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
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="物料详情" name="materia">
          <el-table :data="orderDetail.items">
            <el-table-column label="物料编号" min-width="200" align="left">
              <template #default="scope">
                <el-text truncated>{{ scope.row.product.materialId }}</el-text>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" width="80" label="数量" />
          </el-table>
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
      </el-tabs>
    </el-drawer>

    <el-dialog
      v-model="newDialogVisibility"
      title="新增报价单"
      width="30%"
      :close-on-click-modal="false"
    >
      <div>
        <p>请选择报价单平台类型</p>
        <el-select v-model="selectedPlatform" placeholder="请选择平台类型" style="width: 100%" @change="platformSelection">
          <el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </el-dialog>
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
</style>

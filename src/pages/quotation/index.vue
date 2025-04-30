<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { fetchList, fetchOrder } from "./apis"

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
  console.log(selectedPlatform.value)
  if (selectedPlatform.value) {
    newDialogVisibility.value = false
    router.push(`/quotation/new?platform=${selectedPlatform.value}`)
  } else {
    ElMessage.warning("请选择平台类型")
  }
}

function handleDetail(id: number) {
  detailDrawer.value = true
  loadDetail(id)
}

function loadDetail(id: number) {
  fetchOrder(id).then((res: any) => {
    if (res.data) {
      orderDetail.value = res.data
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
        <vxe-column field="payStatus" width="100" title="支付状态">
          <template #default="{ row }">
            <el-tag type="success" v-if="row.payStatus === 1">已支付</el-tag>
            <el-tag type="danger" v-if="row.payStatus === 0">未支付</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="success" @click="handleDetail(data.row.id)">物料清单</el-button>
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

    <el-drawer v-model="detailDrawer" title="物料明细" size="35%" direction="rtl">
      <vxe-table :data="orderDetail.items">
        <vxe-column title="物料编号" min-width="200" align="left">
          <template #default="data">
            <el-text truncated>{{ data.row.product?.materialId }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="quantity" title="数量" width="80" />
      </vxe-table>
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
.fr {
  float: right;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>

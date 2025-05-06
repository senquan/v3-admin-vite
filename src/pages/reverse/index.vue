<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { fetchList, fetchReturnOrder, fetchReturnOrderStatusLog } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  type: "",
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
            platform: item.platform,
            customer: item.customer,
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

function handleDetail(id: number) {
  loadDetail(id)
  activeTab.value = "materia"
}

function loadDetail(id: number) {
  detailDrawer.value = true
  fetchReturnOrder(id).then((res: any) => {
    orderDetail.value = res.data
  })
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

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="platform" width="80" title="平台" />
        <vxe-column field="createdAt" title="申请时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </vxe-column>
        <vxe-column field="name" width="200" title="名称" align="left" />
        <vxe-column field="reason" min-width="200" title="退款原因" align="left" />
        <vxe-column field="customer" width="150" title="客户名" />
        <vxe-column field="reviewer" width="150" title="审核人" />
        <vxe-column field="quantity" width="80" title="数量" />
        <vxe-column field="returnAmount" width="100" title="退货金额" />
        <vxe-column field="status" width="100" title="支付状态" />
        <vxe-column field="refundStatus" width="100" title="退款状态" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="success" @click="handleDetail(data.row.id)">详情</el-button>
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
          <el-table :data="orderDetail.items">
            <el-table-column label="物料编号" min-width="200" align="left">
              <template #default="scope">
                <el-text truncated>{{ scope.row.product.materialId }}</el-text>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" width="80" label="数量" />
          </el-table>
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

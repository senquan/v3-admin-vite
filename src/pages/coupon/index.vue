<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { fetchList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  color: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})
const totalCoupons = ref(0)
const tableData = ref<any>([])
const productFormRef = ref<any>([])
const productImportRef = ref<any>([])
const formVisibility = ref(false)

async function fetchCoupons() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.coupons) {
        totalCoupons.value = res.data.total
        tableData.value = res.data.coupons.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            type: item.type,
            amount: item.amount,
            discount: item.discount,
            minAmount: item.minAmount,
            startTime: item.startTime,
            endTime: item.endTime,
            totalCount: item.totalCount,
            receivedCount: item.receivedCount,
            usedCount: item.usedCount,
            perLimit: item.perLimit,
            status: item.status,
            creator: item.creator,
            createdAt: item.createdAt,
            description: item.description
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
  const { field, coupon } = column
  listQuery.sort = (coupon === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchCoupons()
}

function handleNew() {
  handleEdit(0)
}

function handleEdit(id: number) {
  openFrom(id)
}

function openFrom(id: number) {
  productFormRef.value?.open({
    id
  })
  formVisibility.value = true
}

onMounted(() => {
  fetchCoupons()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增优惠券</el-button>
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
        <vxe-column field="name" min-width="200" title="优惠券名称" align="left" />
        <vxe-column field="createdAt" title="开始时间" width="150">
          <template #default="{ row }">{{ formatDateTime(row.startTime) }}</template>
        </vxe-column>
        <vxe-column field="createdAt" title="结束时间" width="150">
          <template #default="{ row }">{{ formatDateTime(row.endTime) }}</template>
        </vxe-column>
        <vxe-column field="amount" width="80" title="面值" />
        <vxe-column field="discount" width="80" title="折扣" />
        <vxe-column field="minAmount" width="80" title="消费门槛" />
        <vxe-column field="totalCount" width="80" title="发放总量" />
        <vxe-column field="receivedCount" width="80" title="已领取" />
        <vxe-column field="usedCount" width="80" title="已使用" />
        <vxe-column field="status" width="80" title="状态" />
        <vxe-column field="perLimit" width="80" title="限领数" />
        <vxe-column field="status" width="80" title="状态" />
        <vxe-column field="creator" width="80" title="创建人" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row.id)">编辑</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalCoupons"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <CouponForm
      ref="productFormRef"
      @success="fetchCoupons"
      @close="formVisibility = false"
    />

    <CouponImport
      ref="productImportRef"
      @success="fetchCoupons"
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

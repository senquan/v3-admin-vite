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
const totalCustomers = ref(0)
const tableData = ref<any>([])
const productFormRef = ref<any>([])
const productImportRef = ref<any>([])
const formVisibility = ref(false)

async function fetchCustomers() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.customers) {
        totalCustomers.value = res.data.total
        tableData.value = res.data.customers.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            type: item.type,
            phone: item.phone,
            city: item.city,
            level: item.level,
            orderCount: item.orderCount,
            totalSpent: item.totalSpent,
            remark: item.remark,
            createAt: item.createAt
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
  const { field, customer } = column
  listQuery.sort = (customer === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchCustomers()
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
  fetchCustomers()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增客户</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="name" min-width="200" title="客户名" align="left" />
        <vxe-column field="remark" min-width="200" title="备注" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.remark }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="phone" width="80" title="联系电话" />
        <vxe-column field="city" width="80" title="城市" />
        <vxe-column field="level" width="80" title="等级" />
        <vxe-column field="orderCount" width="80" title="订单数" />
        <vxe-column field="totalSpent" width="80" title="消费金额" />
        <vxe-column field="createAt" title="加入时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createAt) }}</template>
        </vxe-column>
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
        :total="totalCustomers"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <CustomerForm
      ref="productFormRef"
      @success="fetchCustomers"
      @close="formVisibility = false"
    />

    <CustomerImport
      ref="productImportRef"
      @success="fetchCustomers"
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

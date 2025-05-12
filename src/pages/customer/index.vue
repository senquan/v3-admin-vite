<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import CustomerForm from "./_form.vue"
import { deleteCustomer, fetchList } from "./apis"

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
const customerFormRef = ref<any>([])
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
            code: item.code,
            email: item.email,
            phone: item.phone,
            city: item.city,
            province: item.province,
            postalCode: item.postalCode,
            companyName: item.companyName,
            taxNumber: item.taxNumber,
            contactPerson: item.contactPerson,
            contactPhone: item.contactPhone,
            contactPosition: item.contactPosition,
            country: item.country,
            address: item.address,
            level: item.level,
            orderCount: item.orderCount,
            totalSpent: item.totalSpent,
            remark: item.remark,
            createdAt: item.createdAt,
            isActive: item.isActive
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
  handleEdit(null)
}

function handleEdit(data: any) {
  openFrom(data)
}

function openFrom(data: any) {
  customerFormRef.value?.open({
    id: 0,
    editData: data ?? null
  })
  formVisibility.value = true
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除客户\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除客户$/,
    inputErrorMessage: "请输入\"确认删除客户\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除客户") {
      deleteCustomer(id).then(() => {
        ElMessage.success("删除成功")
        fetchCustomers()
      }).catch(() => {
        ElMessage({
          type: "warning",
          message: "删除失败"
        })
      })
    }
  }).catch(() => {
    ElMessage({
      type: "info",
      message: "已取消删除"
    })
  })
}

onMounted(() => {
  fetchCustomers()
})

function getCustomerTypeText(type: number) {
  switch (type) {
    case 1: return "个人客户"
    case 2: return "企业客户"
    case 3: return "经销商"
    case 4: return "合作伙伴"
    default: return "未知"
  }
}
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-select v-model="listQuery.type" placeholder="客户类型" clearable class="filter-item" style="width: 150px;" @change="handleFilter">
        <el-option label="个人客户" value="1" />
        <el-option label="企业客户" value="2" />
        <el-option label="经销商" value="3" />
        <el-option label="合作伙伴" value="4" />
      </el-select>
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
        <vxe-column field="type" width="100" title="客户类型">
          <template #default="{ row }">
            {{ getCustomerTypeText(row.type) }}
          </template>
        </vxe-column>
        <vxe-column field="name" min-width="200" title="客户名" align="left" />
        <vxe-column field="remark" min-width="200" title="备注" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.remark }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="phone" width="120" title="联系电话" />
        <vxe-column field="city" width="80" title="城市" />
        <vxe-column field="level" width="80" title="等级" />
        <vxe-column field="orderCount" width="80" title="订单数" />
        <vxe-column field="totalSpent" width="80" title="消费金额" />
        <vxe-column field="createAt" title="加入时间" width="150">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="160">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
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
      ref="customerFormRef"
      @success="fetchCustomers"
      @close="formVisibility = false"
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

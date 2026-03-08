<script setup lang="ts">
import type { CompanyTree } from "../basic/apis/type"
import { formatDateTime } from "@@/utils/datetime"
import { getCompaniesTree } from "../basic/apis"
import RoleForm from "./_role.vue"
import UserForm from "./_user.vue"
import { getUsers } from "./apis"

const loading = ref(false)
const roleFormRef = ref<any>([])
const roleFormVisibility = ref(false)
const userFormRef = ref<any>([])
const userFormVisibility = ref(false)
const rolesData = ref<any>([])

const searchForm = reactive({
  keyword: "",
  operationModule: "",
  operationType: undefined as number | undefined,
  status: undefined as number | undefined,
  sort: "",
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<any[]>([])
const companyOptions = ref<CompanyTree[]>([])

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      status: searchForm.status || undefined,
      startDate: "",
      endDate: ""
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const response = await getUsers(params)

    const result: any = response
    let count = 1
    tableData.value = result.data.records.map((item: any) => {
      return {
        ...item,
        companyId: item.company?.id || undefined,
        seq: count++
      }
    })
    rolesData.value = result.data.roles
    pagination.total = result.data.total
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    userName: "",
    operationModule: "",
    operationType: undefined,
    status: undefined,
    sort: "",
    dateRange: []
  })
  handleSearch()
}

function handleRole(data: any) {
  if (data.status > 3) {
    ElMessage.warning("离职用户不可以绑定角色。")
    return
  }
  roleFormRef.value?.open({
    roles: rolesData.value,
    editData: data ?? null
  })
  roleFormVisibility.value = true
}

// 编辑
function handleEdit(data: any) {
  getParentCompanies().then(() => {
    userFormRef.value?.open({
      companies: companyOptions.value,
      editData: data ?? null
    })
    userFormVisibility.value = true
  })
}

async function getParentCompanies() {
  try {
    if (companyOptions.value.length === 0) {
      const response = await getCompaniesTree()
      companyOptions.value = response.data.records
    }
  } catch (error) {
    console.error("获取上级单位失败:", error)
  }
}

// 分页变化
function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

function handleSortChange(column: any) {
  const { field, User } = column
  searchForm.sort = (User === "desc" ? "-" : "+") + field
  handleSearch()
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="operation-log-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入用户名、手机号、邮箱模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" @clear="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
        header-cell-class-name="header-cell-fix"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="innerCode" width="100" title="内部编号" />
        <vxe-column field="name" width="100" title="用户姓名" />
        <vxe-column field="company.companyName" width="200" title="所在单位" />
        <vxe-column field="notes" min-width="200" title="备注" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.notes }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="phone" width="120" title="联系电话" />
        <vxe-column field="role" width="280" title="角色" />
        <vxe-column field="status" width="80" title="状态">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">在职</el-tag>
            <el-tag v-if="row.status === 0" type="danger">停用</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="createdAt" title="注册日期" width="120" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createdAt, "YYYY-MM-DD") }}</template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="250">
          <template #default="data">
            <el-button type="success" @click="handleRole(data.row)">角色</el-button>
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
          </template>
        </vxe-column>
      </vxe-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />

      <!-- 角色对话框 -->
      <RoleForm
        ref="roleFormRef"
        @success="fetchData"
        @close="roleFormVisibility = false"
      />

      <!-- 用户对话框 -->
      <UserForm
        ref="userFormRef"
        @success="fetchData"
        @close="userFormVisibility = false"
      />
    </el-card>
  </div>
</template>

<style scoped>
.search-form {
  margin-bottom: 10px;
  padding: 20px 20px 0 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
}

.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>

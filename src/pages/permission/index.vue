<script setup lang="ts">
import { formatDateTime } from "@@/utils/datetime"
import RoleForm from "./_form.vue"
import RolePermissionForm from "./_permission.vue"
import { deleteRole, fetchList } from "./apis"

const loading = ref(false)
const showCreateDialog = ref(false)
const dialogStatus = ref("create")

const searchForm = reactive({
  keyword: ""
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableData = ref<any[]>([])
const roleFormRef = ref<any>([])
const formVisibility = ref(false)
const rolePermissionFormRef = ref<any>([])
const permissionFormVisibility = ref(false)

function getStatusLabel(status: number) {
  return status === 1 ? "有效" : "无效"
}

function getStatusTagType(status: number) {
  return status === 1 ? "success" : "danger"
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword

    const response = await fetchList(params)
    tableData.value = response.data.records
    pagination.total = response.data.total
  } catch (error) {
    console.error("获取记录失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    rateType: 0,
    dateRange: []
  })
  handleSearch()
}

function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

function handleCreate() {
  dialogStatus.value = "create"
  showCreateDialog.value = true
  handleEdit(null)
}

function handleEdit(data: any) {
  openFrom(data)
}

function openFrom(data: any) {
  roleFormRef.value?.open({
    id: 0,
    editData: data ?? null
  })
  formVisibility.value = true
}

function handleRolePermissions(id: number) {
  rolePermissionFormRef.value?.open({
    id
  })
  permissionFormVisibility.value = true
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除角色\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除角色$/,
    inputErrorMessage: "请输入\"确认删除角色\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除角色") {
      deleteRole(id).then(() => {
        ElMessage.success("删除成功")
        fetchData()
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
  fetchData()
})
</script>

<template>
  <div class="interest-rate-management">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入单位名称模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><User /></el-icon>
            新增角色
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="id" label="编号" width="80" align="center" />
        <el-table-column prop="name" label="名称" width="150" align="center" />
        <el-table-column prop="code" label="代码" width="120" align="center" />
        <el-table-column prop="description" label="角色描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="修改时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="success" @click="handleRolePermissions(row.id)">授权</el-button>
            <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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
    </el-card>

    <RoleForm
      ref="roleFormRef"
      @success="fetchData"
      @close="formVisibility = false"
    />

    <RolePermissionForm
      ref="rolePermissionFormRef"
      @close="permissionFormVisibility = false"
    />
  </div>
</template>

<style scoped>
.interest-rate-management {
  padding: 10px;
}

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

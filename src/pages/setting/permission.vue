<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import RolePermissionForm from "./_permission.vue"
import RoleForm from "./_permission_form.vue"
import { deleteRole, fetchRoleList as fetchList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  color: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})
const totalRoles = ref(0)
const tableData = ref<any>([])
const roleFormRef = ref<any>([])
const formVisibility = ref(false)
const rolePermissionFormRef = ref<any>([])
const permissionFormVisibility = ref(false)

async function fetchRoles() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.roles) {
        totalRoles.value = res.data.total
        tableData.value = res.data.roles.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            code: item.code,
            description: item.description,
            status: item.status === 1 ? 1 : 0,
            updatedAt: formatDateTime(item.updatedAt)
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
  const { field, role } = column
  listQuery.sort = (role === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchRoles()
}

function handleNew() {
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
        fetchRoles()
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
  fetchRoles()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增角色</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="name" width="150" title="名称" />
        <vxe-column field="code" width="120" title="代码" />
        <vxe-column field="description" min-width="200" title="备注" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.description }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="status" width="80" title="状态">
          <template #default="data">
            <el-tag type="success" v-if="data.row.status === 1">启用</el-tag>
            <el-tag type="danger" v-else>禁用</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="updatedAt" title="最后更新" width="150" />
        <vxe-column field="actions" title="操作" width="360">
          <template #default="data">
            <el-button type="success" @click="handleRolePermissions(data.row.id)">授权</el-button>
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
        :total="totalRoles"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <RoleForm
      ref="roleFormRef"
      @success="fetchRoles"
      @close="formVisibility = false"
    />

    <RolePermissionForm
      ref="rolePermissionFormRef"
      @close="permissionFormVisibility = false"
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

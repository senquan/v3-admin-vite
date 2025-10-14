<script lang="ts" setup>
import RoleForm from "./_role.vue"
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
const totalUsers = ref(0)
const tableData = ref<any>([])
const roleFormRef = ref<any>([])
const roleFormVisibility = ref(false)
const rolesData = ref<any>([])

async function fetchUsers() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.users) {
        totalUsers.value = res.data.total
        tableData.value = res.data.users.map((item: any) => {
          return {
            id: item.id,
            profile_id: item.profile_id,
            oaId: item.oa_id,
            name: item.realname || item.name || "",
            gender: item.gender,
            phone: item.phone,
            email: item.email,
            joinDate: item.join_date,
            status: item.status,
            points: item.points || 0
          }
        })
        rolesData.value = res.data.roles
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
  const { field, User } = column
  listQuery.sort = (User === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchUsers()
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

onMounted(() => {
  fetchUsers()
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
        <vxe-column field="oaId" width="100" title="内部编号" />
        <vxe-column field="name" width="100" title="用户姓名" />
        <vxe-column field="gender" width="80" title="性别">
          <template #default="{ row }">
            {{ row.gender === "F" ? "女" : "男" }}
          </template>
        </vxe-column>
        <vxe-column field="remark" min-width="200" title="备注" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.remark }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="phone" width="120" title="联系电话" />
        <vxe-column field="role" width="280" title="角色" />
        <vxe-column field="status" width="80" title="状态">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">在职</el-tag>
            <el-tag v-if="row.status === 2" type="danger">试用期</el-tag>
            <el-tag v-if="row.status === 3" type="primary">休假</el-tag>
            <el-tag v-if="row.status === 4" type="warning">离职</el-tag>
            <el-tag v-if="row.status === 5" type="warning">停职</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="250">
          <template #default="data">
            <el-button type="success" @click="handleRole(data.row)">角色</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalUsers"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <RoleForm
      ref="roleFormRef"
      @success="fetchUsers"
      @close="roleFormVisibility = false"
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

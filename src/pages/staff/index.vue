<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import StaffForm from "./_form.vue"
import RoleForm from "./_role.vue"
import { deleteStaff, fetchList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  color: "",
  sort: "+id",
  page: 1,
  pageSize: 20
})
const totalStaffs = ref(0)
const tableData = ref<any>([])
const staffFormRef = ref<any>([])
const formVisibility = ref(false)
const roleFormRef = ref<any>([])
const roleFormVisibility = ref(false)
const rolesData = ref<any>([])

async function fetchStaffs() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      if (res.data && res.data.staffs) {
        totalStaffs.value = res.data.total
        tableData.value = res.data.staffs.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            staffNo: item.staffNo,
            phone: item.phone,
            email: item.email,
            position: item.position,
            department: item.department,
            gender: item.gender,
            remark: item.remark,
            status: item.status,
            hireDate: item.hireDate,
            resignDate: item.resignDate,
            userId: item.user?.id || 0,
            username: item.user?.username || ""
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
  const { field, staff } = column
  listQuery.sort = (staff === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchStaffs()
}

function handleNew() {
  handleEdit(null)
}

function handleEdit(data: any) {
  openFrom(data)
}

function openFrom(data: any) {
  staffFormRef.value?.open({
    id: 0,
    editData: data ?? null
  })
  formVisibility.value = true
}

function handleRole(data: any) {
  if (data.userId === 0) {
    ElMessage.warning("员工必须先先绑定用户。")
    return
  }
  if (data.status > 3) {
    ElMessage.warning("离职员工不可以绑定角色。")
    return
  }
  roleFormRef.value?.open({
    roles: rolesData.value,
    editData: data ?? null
  })
  roleFormVisibility.value = true
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除员工\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除员工$/,
    inputErrorMessage: "请输入\"确认删除员工\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除员工") {
      deleteStaff(id).then(() => {
        ElMessage.success("删除成功")
        fetchStaffs()
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
  fetchStaffs()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增员工</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
        <vxe-column field="id" width="80" title="编号" />
        <vxe-column field="staffNo" width="100" title="内部编号" />
        <vxe-column field="name" width="100" title="员工姓名" />
        <vxe-column field="gender" width="80" title="性别">
          <template #default="{ row }">
            {{ row.gender === "M" ? "男" : "女" }}
          </template>
        </vxe-column>
        <vxe-column field="remark" min-width="200" title="备注" align="left">
          <template #default="data">
            <el-text truncated style="margin-right: 8px;">{{ data.row.remark }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="phone" width="120" title="联系电话" />
        <vxe-column field="role" width="80" title="员工" />
        <vxe-column field="department" width="80" title="部门" />
        <vxe-column field="position" width="80" title="职位" />
        <vxe-column field="status" width="80" title="状态">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">在职</el-tag>
            <el-tag v-if="row.status === 2" type="danger">试用期</el-tag>
            <el-tag v-if="row.status === 3" type="primary">休假</el-tag>
            <el-tag v-if="row.status === 4" type="warning">离职</el-tag>
            <el-tag v-if="row.status === 5" type="warning">停职</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="hireDate" title="入职日期" width="120">
          <template #default="{ row }">{{ formatDateTime(row.hireDate, "YYYY-MM-DD") }}</template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="250">
          <template #default="data">
            <el-button type="success" @click="handleRole(data.row)">角色</el-button>
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
        :total="totalStaffs"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <StaffForm
      ref="staffFormRef"
      @success="fetchStaffs"
      @close="formVisibility = false"
    />

    <RoleForm
      ref="roleFormRef"
      @success="fetchStaffs"
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

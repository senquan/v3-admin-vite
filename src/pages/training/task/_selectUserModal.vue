<script setup lang="ts">
import { getBranchListOpt } from "@/common/apis/branches"
import { getBranchUserList } from "@/common/apis/users"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  ids: [] as number[]
})

const visible = ref(false)
const departmentList = ref<any[]>([])
const userList = ref<any[]>([])
const selectedUsers = ref<any[]>([])
const selectedDepartmentId = ref<string>("")
const searchUserKeyword = ref("")

function open(options = {
  assignments: [] as any[]
}) {
  resetForm()
  selectedUsers.value = options.assignments?.map(assignment => assignment.user) || []
  loadDepartmentList()
  visible.value = true
}

function resetForm() {
  formData.ids = []
}

// 部门变化时重新加载用户列表
function handleDepartmentChange(type: number) {
  loadUserList(type)
}

// 加载用户列表
function loadUserList(type: number) {
  const params = selectedDepartmentId.value ? { type: type === 1 ? "inner" : "outer", id: selectedDepartmentId.value } : undefined
  return handleSearchUser(params)
}

function handleSearchUser(params: any) {
  return getBranchUserList(params)
    .then((response) => {
      if (response.code === 0) {
        userList.value = response.data.users || []
      } else {
        ElMessage.error(response.message || "获取用户列表失败")
      }
    })
    .catch((error: unknown) => {
      ElMessage.error("获取用户列表失败")
      console.error(error)
    })
}

// 加载部门列表
function loadDepartmentList() {
  return getBranchListOpt()
    .then((response) => {
      if (response.code === 0) {
        departmentList.value = response.data.branches || []
      } else {
        ElMessage.error(response.message || "获取部门列表失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取部门列表失败")
      console.error(error)
    })
}

function handleSelectionChange(selection: any[]) {
  if (selection.length > 0) {
    selection.forEach((user) => {
      const exists = selectedUsers.value.find(item => (item.id === user.id || item._id === user.id))
      if (!exists) {
        selectedUsers.value.push(user)
      }
    })
  }
}

function confirmUsers() {
  formData.ids = selectedUsers.value.map(user => user.id || user._id)
  visible.value = false
  emit("success", formData)
}

function close() {
  visible.value = false
  emit("close")
}

function removeUser(user: any) {
  const id = user.id || user._id
  selectedUsers.value = selectedUsers.value.filter(item => (item._id || item.id) !== id)
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="选择学员"
    width="80%"
    :close-on-click-modal="false"
  >
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="department-tree">
          <h4>选择部门</h4>
          <el-tabs type="border-card" :stretch="true">
            <el-tab-pane label="本单位">
              <el-tree
                :data="departmentList"
                node-key="_id"
                :props="{ children: 'children', label: 'name' }"
                @node-click="(data) => {
                  selectedDepartmentId = data.parentId === 0 ? `branch_${data.id}` : `dept_${data.id}`
                  handleDepartmentChange(1)
                }"
                highlight-current
              />
            </el-tab-pane>
            <el-tab-pane label="外单位">
              <el-tree
                :data="departmentList"
                node-key="_id"
                :props="{ children: 'children', label: 'name' }"
                @node-click="(data) => {
                  selectedDepartmentId = data.parentId === 0 ? `branch_${data.id}` : `dept_${data.id}`
                  handleDepartmentChange(2)
                }"
                highlight-current
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="user-list">
          <h4>选择用户</h4>
          <el-input
            v-model="searchUserKeyword"
            style="width: 100%"
            placeholder="搜索员工姓名"
            class="input-with-select"
          >
            <template #append>
              <el-button @click="handleSearchUser({ keyword: searchUserKeyword })">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
          <el-table
            :data="userList"
            @selection-change="(selection) => handleSelectionChange(selection)"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="用户名" />
            <el-table-column prop="realname" label="姓名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="phone" label="电话" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="department-tree">
          <h4>已选学员（{{ selectedUsers.length }}）</h4>
          <el-table
            :data="selectedUsers"
          >
            <el-table-column prop="realname" label="姓名" />
            <el-table-column width="80">
              <template #default="scope">
                <el-button type="danger" size="small" @click="removeUser(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirmUsers">
          确认学员
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

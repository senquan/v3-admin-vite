<script lang="ts" setup>
import type { TreeInstance } from "element-plus"
import { ElMessage } from "element-plus"
import { fetchRolePermissions, updateRolePermissions } from "./apis"

interface Tree {
  id: number
  label: string
  children?: Tree[]
}

const emit = defineEmits(["success", "close"])

const permissionData = ref<Tree[]>([])
const formData = ref({
  id: 0,
  permissions: [] as number[]
})

const formRef = ref()
const visible = ref(false)
const treeRef = ref<TreeInstance>()

const btnSubmit = reactive({
  loading: false
})

function buildTree(permissions: any[]) {
  return permissions.map((permission) => {
    const node: Tree = {
      id: permission.id,
      label: permission.title,
      children: permission.children ? buildTree(permission.children) : []
    }
    return node
  })
}

function open(options = {
  id: 0
}) {
  visible.value = true
  resetForm()
  formData.value.id = options.id
  fetchRolePermissions(options.id).then((response: any) => {
    if (response.code === 0) {
      formData.value.permissions = response.data.permissions
      if (treeRef.value) {
        treeRef.value.setCheckedKeys(formData.value.permissions)
      }
      permissionData.value = buildTree(response.data.allPermissions)
    } else {
      ElMessage({
        message: response.message || `获取员工角色失败`,
        type: "error",
        offset: 0
      })
    }
  }).catch((e) => {
    ElMessage({
      message: `获取员工角色失败: ${e.message}`,
      type: "error",
      offset: 0
    })
  })
}

function resetForm() {
  formData.value = {
    id: 0,
    permissions: []
  }
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  if (!formRef.value) {
    ElMessage.error("表单未正确初始化")
    return
  }

  formRef.value.validate((valid: any) => {
    if (!valid) return

    btnSubmit.loading = true
    formData.value.permissions = treeRef.value!.getCheckedKeys(true).map(item => Number(item))
    updateRolePermissions(formData.value.id, formData.value).then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: `员工角色已经更新！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || `更新员工角色失败`,
          type: "error",
          offset: 0
        })
      }
    }).catch(() => {
      btnSubmit.loading = false
      ElMessage({
        message: "系统错误，请稍后重试",
        type: "error",
        offset: 0
      })
    })
  })
}

defineExpose({
  open
})
</script>

<template>
  <div class="custom-tree-node-container">
    <el-dialog
      v-model="visible"
      title="设置系统权限"
      width="500px"
      :before-close="close"
    >
      <el-scrollbar height="500px">
        <el-form
          ref="formRef"
          :model="formData"
          label-width="120px"
        >
          <el-form-item label="选择权限">
            <el-tree
              ref="treeRef"
              :data="permissionData"
              show-checkbox
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
            />
          </el-form-item>
        </el-form>
      </el-scrollbar>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit" :loading="btnSubmit.loading">保存</el-button>
          <el-button @click="close">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

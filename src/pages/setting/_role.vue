<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { fetchUserRole, updateUserRole } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  profile_id: 0,
  roles: [] as number[]
})

const formRef = ref()
const visible = ref(false)
const allRoles = ref<{
  key: number
  label: string
  disabled: boolean
}[]>([])

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  phone: [{ required: true, message: "请输入联系电话", trigger: "blur" }],
  email: [{ required: true, message: "请输入邮箱", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  roles: [],
  editData: null
}) {
  visible.value = true
  resetForm()
  if (options.editData) {
    Object.keys(options.editData).forEach((key) => {
      if (key in formData.value) {
        (formData.value as any)[key] = (options.editData as any)[key]
      }
    })
  }
  fetchUserRole(formData.value.profile_id).then((response: any) => {
    if (response.code === 0) {
      formData.value.roles = response.data.map((item: any) => {
        return item.roleId
      })
    } else {
      ElMessage({
        message: response.message || `获取用户角色失败`,
        type: "error",
        offset: 0
      })
    }
  }).catch(() => {
    ElMessage({
      message: "系统错误，请稍后重试",
      type: "error",
      offset: 0
    })
  })
  if (options.roles) {
    allRoles.value = options.roles.map((item: any) => {
      return {
        key: item.id,
        label: item.name,
        disabled: formData.value.roles.includes(item.id)
      }
    })
  }
}

function resetForm() {
  formData.value = {
    profile_id: 0,
    roles: []
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
    updateUserRole(formData.value.profile_id, formData.value).then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: `用户角色已经更新！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || `更新用户角色失败`,
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
  <el-dialog
    v-model="visible"
    title="更新用户角色"
    width="50%"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
    >
      <el-row>
        <el-col :span="24">
          <el-transfer
            v-model="formData.roles"
            :data="allRoles"
            :titles="['可用角色', '已选角色']"
            align="center"
          />
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="handleSubmit">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

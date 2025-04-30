<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createRole, updateRole } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  id: 0,
  name: "",
  code: "",
  description: "",
  status: 1
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0,
  editData: null
}) {
  visible.value = true
  resetForm()
  if (options.editData) {
    isEdit.value = true
    Object.keys(options.editData).forEach((key) => {
      if (key in formData.value) {
        (formData.value as any)[key] = (options.editData as any)[key]
      }
    })
  } else {
    isEdit.value = false
  }
}

function resetForm() {
  formData.value = {
    id: 0,
    name: "",
    code: "",
    description: "",
    status: 1
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
    const request = isEdit.value ? updateRole(formData.value.id, formData.value) : createRole(formData.value)
    request.then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? `角色已成功更新！` : `角色已成功创建！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? `更新角色失败` : `创建角色失败`),
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
    :title="`${isEdit ? '编辑' : '创建'}角色`"
    width="500px"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="代码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入代码名" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="5" placeholder="请输入备注信息" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="状态" prop="status">
            <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
          </el-form-item>
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

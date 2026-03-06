<script lang="ts" setup>
import type { CompanyTree } from "../basic/apis/type"
import { ElMessage } from "element-plus"
import { updateUser } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  id: 0,
  name: "",
  companyId: 0,
  innerCode: "",
  notes: "",
  status: 0
})

const formRef = ref()
const visible = ref(false)
const companyOptions = ref<CompanyTree[]>([])

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  companyId: [{ required: true, message: "请选择公司", trigger: "change" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0,
  companies: [],
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
  console.log(formData.value)
  if (options.companies) {
    companyOptions.value = options.companies
  }
}

function resetForm() {
  formData.value = {
    id: 0,
    name: "",
    companyId: 0,
    innerCode: "",
    notes: "",
    status: 0
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
    updateUser(formData.value.id, formData.value).then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: "用户已成功更新！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || "更新用户失败",
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
    title="编辑用户"
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
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="内部编号" prop="innerCode">
            <el-input v-model="formData.innerCode" placeholder="请输入内部编号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="所在单位" prop="companyId">
            <el-tree-select
              v-model="formData.companyId"
              :data="companyOptions"
              placeholder="请选择用户所在单位"
              :render-after-expand="false"
              :check-strictly="true"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="notes">
            <el-input v-model="formData.notes" type="textarea" :rows="5" placeholder="请输入备注信息" />
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

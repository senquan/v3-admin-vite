<script lang="ts" setup>
import type { CompanyTree } from "../basic/apis/type"
import { ElMessage } from "element-plus"
import { createUser, updateUser } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  id: 0,
  username: "",
  password: "",
  confirmPassword: "",
  name: "",
  email: "",
  phone: "",
  companyId: undefined,
  innerCode: "",
  notes: "",
  status: 0
})

const formRef = ref()
const visible = ref(false)
const isCreate = ref(false) // 是否为新增模式
const companyOptions = ref<CompanyTree[]>([])

const rules = reactive({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== formData.value.password) {
          callback(new Error("两次输入的密码不一致"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  companyId: [{ required: true, message: "请选择单位", trigger: "change" }]
})

const btnSubmit = reactive({
  loading: false
})

function open(options: any = {
  id: 0,
  companies: [],
  editData: null
}) {
  visible.value = true
  resetForm()
  isCreate.value = !options.editData // 没有 editData 则为新增模式
  if (options.editData) {
    Object.keys(options.editData).forEach((key) => {
      if (key in formData.value) {
        (formData.value as any)[key] = (options.editData as any)[key]
      }
    })
  }
  if (options.companies) {
    companyOptions.value = options.companies
  }
}

function resetForm() {
  formData.value = {
    id: 0,
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
    companyId: undefined,
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

    if (isCreate.value) {
      // 新增用户
      createUser({
        username: formData.value.username,
        password: formData.value.password,
        name: formData.value.name,
        email: formData.value.email,
        phone: formData.value.phone,
        companyId: formData.value.companyId || undefined,
        innerCode: formData.value.innerCode || undefined,
        notes: formData.value.notes || undefined,
        status: formData.value.status
      }).then((response: any) => {
        btnSubmit.loading = false
        if (response.code === 0) {
          visible.value = false
          ElMessage({
            message: "用户创建成功！",
            type: "success",
            offset: 0
          })
          emit("success")
        } else {
          ElMessage({
            message: response.message || "创建用户失败",
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
    } else {
      // 编辑用户
      updateUser(formData.value.id, {
        id: formData.value.id,
        name: formData.value.name,
        companyId: formData.value.companyId || 0,
        email: formData.value.email,
        phone: formData.value.phone,
        status: formData.value.status,
        innerCode: formData.value.innerCode || undefined,
        notes: formData.value.notes
      }).then((response: any) => {
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
    }
  })
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isCreate ? '新增用户' : `编辑用户 - ${formData.username}`"
    width="550px"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <!-- 新增模式才显示用户名和密码 -->
      <template v-if="isCreate">
        <el-row>
          <el-col :span="24">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重复密码" prop="confirmPassword">
              <el-input v-model="formData.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-row>
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="内部编号" prop="innerCode">
            <el-input v-model="formData.innerCode" placeholder="内部编号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电话" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入电话" />
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

<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createStaff, fetchUnbindUsers, updateStaff } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  id: 0,
  name: "",
  staffNo: "",
  phone: "",
  email: "",
  department: "",
  position: "",
  gender: "M",
  userId: 0,
  username: "",
  remark: "",
  status: 1,
  hireDate: "",
  resignDate: ""
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const userOptions = ref<any>([])
const searchLoading = ref(false)

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  phone: [{ required: true, message: "请输入联系电话", trigger: "blur" }],
  email: [{ required: true, message: "请输入邮箱", trigger: "blur" }]
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
  if (formData.value.userId) {
    userOptions.value = [{
      value: formData.value.userId,
      label: formData.value.username || ""
    }]
  } else {
    userOptions.value = [{
      value: 0,
      label: "未绑定用户"
    }]
  }
}

function resetForm() {
  formData.value = {
    id: 0,
    name: "",
    staffNo: "",
    phone: "",
    email: "",
    department: "",
    position: "",
    gender: "M",
    userId: 0,
    username: "",
    remark: "",
    status: 1,
    hireDate: "",
    resignDate: ""
  }
}

function handelSearchUser(query: string) {
  searchLoading.value = true
  fetchUnbindUsers({ keyword: query }).then((response: any) => {
    if (response.code === 0) {
      userOptions.value = response.data.map((user: any) => ({
        value: user.id,
        label: user.username
      }))
      searchLoading.value = false
    } else {
      ElMessage.error(`获取用户列表失败: ${response.message}`)
    }
  })
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
    const request = isEdit.value ? updateStaff(formData.value.id, formData.value) : createStaff(formData.value)
    request.then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? `员工已成功更新！` : `员工已成功创建！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? `更新员工失败` : `创建员工失败`),
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
    :title="`${isEdit ? '编辑' : '创建'}员工`"
    width="40%"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="员工编号" prop="staffNo">
            <el-input v-model="formData.staffNo" placeholder="请输入员工编号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="formData.gender" placeholder="请选择性别">
              <el-option label="男" value="M" />
              <el-option label="女" value="F" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="部门" prop="department">
            <el-input v-model="formData.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职位 " prop="position">
            <el-input v-model="formData.position" placeholder="请输入职位" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="入职日期" prop="hireDate">
            <el-date-picker
              v-model="formData.hireDate"
              type="date"
              placeholder="选择入职日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电子邮箱 " prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="绑定用户" prop="userId">
            <el-select
              v-model="formData.userId"
              filterable
              remote
              placeholder="请输入关键词搜索"
              :remote-method="handelSearchUser"
              :loading="searchLoading"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="5" placeholder="请输入备注信息" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="isEdit">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态">
              <el-option label="在职" :value="1" />
              <el-option label="试用期" :value="2" />
              <el-option label="休假" :value="3" />
              <el-option label="离职" :value="4" />
              <el-option label="停职" :value="5" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formData.status === 4" label="离职日期" prop="resignDate">
            <el-date-picker
              v-model="formData.resignDate"
              type="date"
              placeholder="选择离职日期"
              value-format="YYYY-MM-DD"
            />
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

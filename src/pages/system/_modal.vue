<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createDict, updateDict } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  dicts: {
    id: 0,
    group: 0,
    name: "",
    remark: "",
    value: "",
    sort: 0
  }
})

const formRef = ref()
const formType = ref()
const formTypeName = ref()
const visible = ref(false)
const isEdit = ref(false)
const isGroup = ref(false)
const tempSort = ref(0)

const currentForm = computed(() => {
  if (!formType.value) return formData.dicts
  return formData[formType.value as keyof typeof formData]
})

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0,
  type: "dicts",
  editData: null
}) {
  visible.value = true
  formType.value = options.type
  resetForm(options.type)
  if (options.editData) {
    isEdit.value = true
    const targetForm = formData[options.type as keyof typeof formData]
    if (targetForm && options.editData) {
      Object.keys(options.editData).forEach((key) => {
        if (key in targetForm) {
          (targetForm as any)[key] = options.editData?.[key]
        }
      })
    }
    if (targetForm.group === 0) {
      isGroup.value = true
    }
    if (targetForm.sort) {
      tempSort.value = targetForm.sort
    }
  } else {
    isEdit.value = false
    if (options.id === 0) {
      isGroup.value = true
    } else {
      formData.dicts.group = options.id
    }
    tempSort.value = 0
  }
  formTypeName.value = isGroup.value ? "字典组" : "字典"
}

function resetForm(type: string) {
  if (type === "dicts") {
    formData.dicts = {
      id: 0,
      group: 0,
      name: "",
      remark: "",
      value: "",
      sort: 0
    }
  }
  tempSort.value = 0
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  if (!formRef.value || !formType.value) {
    ElMessage.error("表单未正确初始化")
    return
  }

  formData.dicts.sort = Number(tempSort.value)

  formRef.value.validate((valid: any) => {
    if (!valid) return

    btnSubmit.loading = true
    const request = getRequest()
    request?.then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? `${formTypeName.value}已成功更新！` : `${formTypeName.value}已成功创建！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? `更新${formTypeName.value}失败` : `创建${formTypeName.value}失败`),
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

function getRequest() {
  if (formType.value === "dicts") {
    if (isEdit.value) {
      return updateDict(formData.dicts.id, formData.dicts)
    } else {
      return createDict(formData.dicts)
    }
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`${isEdit ? '编辑' : '创建'}${formTypeName}`"
    width="500px"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="currentForm"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="名称" prop="name">
            <el-input v-model="currentForm.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input v-model="currentForm.remark" placeholder="请输入描述" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="排序值" prop="sort">
            <el-input v-model="tempSort" placeholder="请输入排序值(数值越大越排前)" />
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

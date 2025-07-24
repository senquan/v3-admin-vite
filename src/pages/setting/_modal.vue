<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createTag, updateTag } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  tags: {
    id: 0,
    parentId: 0,
    name: "",
    color: "",
    description: "",
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
  if (!formType.value) return formData.tags
  return formData[formType.value as keyof typeof formData]
})

const isTagsForm = computed(() => {
  return formType.value === "tags"
})

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0,
  type: "tags",
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
    if (targetForm.parentId) {
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
      formData.tags.parentId = options.id
    }
    tempSort.value = 0
  }
  formTypeName.value = isGroup.value ? "标签组" : "标签"
}

function resetForm(type: string) {
  if (type === "tags") {
    formData.tags = {
      id: 0,
      parentId: 0,
      name: "",
      color: "",
      description: "",
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

  formData.tags.sort = Number(tempSort.value)

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
  if (formType.value === "tags") {
    if (isEdit.value) {
      return updateTag(formData.tags.id, formData.tags)
    } else {
      return createTag(formData.tags)
    }
  }
}

const predefineColors = ref([
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "rgb(255, 120, 0)",
  "hsv(51, 100, 98)",
  "hsva(120, 40, 94, 0.5)",
  "hsl(181, 100%, 37%)",
  "hsla(209, 100%, 56%, 0.73)",
  "#c7158577"
])

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
            <el-input v-model="currentForm.description" placeholder="请输入描述" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="isTagsForm" label="颜色" prop="color">
            <el-color-picker v-model="currentForm.color" show-alpha :predefine="predefineColors" color-format="hex" />
          </el-form-item>
        </el-col>
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

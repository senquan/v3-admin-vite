<script lang="ts" setup>
import { findCascaderPath, getCascaderOptions } from "@/common/utils/helper"
import { ElMessage } from "element-plus"
import { createCategory, fetchCategoryListOpt, updateCategory } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  category: {
    id: 0,
    type: 0,
    ref: "",
    name: "",
    parentId: 0,
    description: "",
    sort: 0
  }
})

const formRef = ref()
const formTypeName = ref()
const visible = ref(false)
const isEdit = ref(false)
const cascaderOptions = reactive({
  category: [] as number[]
})
const categories = ref<any[]>([])

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  type: 0,
  editData: {} as any
}) {
  formTypeName.value = "分类"
  visible.value = true
  resetForm()
  if (options.editData) {
    isEdit.value = true
    if (options.editData) {
      Object.keys(options.editData).forEach((key) => {
        if (key in formData.category) {
          (formData.category as any)[key] = options.editData?.[key]
        }
      })
      formData.category.ref = formData.category.ref?.substring(formData.category.ref.lastIndexOf(".") + 1)
      formData.category.id = options.editData?._id
    }
  } else {
    isEdit.value = false
  }
  formData.category.type = options.type || 0
  loadCategories()
}

function handleCategoryChange(value: any) {
  if (!value || value.length === 0) {
    formData.category.parentId = 0
  } else {
    formData.category.parentId = value[value.length - 1]
  }
}

function resetForm() {
  formData.category = {
    id: 0,
    type: 0,
    ref: "",
    name: "",
    parentId: 0,
    description: "",
    sort: 0
  }
  cascaderOptions.category = []
}

function loadCategories() {
  if (categories.value.length > 0) return
  fetchCategoryListOpt(formData.category.type).then((res) => {
    const categoryOptData: Array<any> = []
    if (res.data) {
      for (const item of res.data.categories) {
        const parent = item.parentId || 0
        if (categoryOptData[parent] === undefined) {
          categoryOptData[parent] = []
        }
        categoryOptData[parent].push(item)
      }
      categories.value = getCascaderOptions(categoryOptData, 0)
      if (isEdit.value) {
        if (formData.category.parentId) {
          cascaderOptions.category = findCascaderPath(categories.value, formData.category.parentId) || []
        }
      }
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
  if (isEdit.value) {
    return updateCategory(formData.category.id, formData.category)
  } else {
    return createCategory(formData.category)
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
      :model="formData.category"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="上级分类" prop="parent_id">
            <el-cascader
              v-model="cascaderOptions.category"
              placeholder="选择类目"
              :options="categories"
              :props="{ expandTrigger: 'hover', checkStrictly: true }"
              @change="handleCategoryChange"
              filterable
              clearable
              :debounce="500"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.category.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input v-model="formData.category.description" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="编号" prop="ref">
            <el-input v-model="formData.category.ref" placeholder="请输入编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序值" prop="sort">
            <el-input v-model="formData.category.sort" placeholder="请输入排序值(数值越大越排前)" />
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

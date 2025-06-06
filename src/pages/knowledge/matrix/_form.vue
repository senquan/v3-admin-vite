<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type * as Matrix from "./apis/type"
import { findCascaderPath, getCascaderOptions } from "@/common/utils/helper"
import { ElMessage } from "element-plus"
import { fetchCategoryListOpt } from "../../setting/apis"
import { createMatrix, updateMatrix } from "./apis/index"

const props = defineProps<{
  visible: boolean
  formData?: Matrix.MatrixListData
  isEdit: boolean
  options: any[]
}>()

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void
  (e: "refresh"): void
}>()

const formRef = ref<FormInstance>()
const form = reactive<Matrix.MatrixCreateData>({
  id: 0,
  category_id: 0,
  ref: "",
  standard: "",
  assessment_method: []
})
const categoryOptions = ref<any>([])

const rules = reactive<FormRules>({
  category_id: [
    { required: true, message: "请选择分类", trigger: "change" }
  ],
  ref: [
    { required: true, message: "请输入编号", trigger: "blur" }
  ],
  standard: [
    { required: true, message: "请输入标准", trigger: "blur" }
  ],
  assessment_method: [
    { required: true, message: "请输入考核方式", trigger: "blur" }
  ]
})

const loading = ref(false)
const categories = ref<{ id: number, name: string }[]>([])

function open() {
  if (props.isEdit && props.formData) {
    Object.assign(form, {
      id: props.formData._id,
      category_id: props.formData.category_id,
      ref: props.formData.ref,
      standard: props.formData.standard,
      assessment_method: props.formData.assessment_method
        ? String(props.formData.assessment_method).split(",").map(Number)
        : []
    })
    if (form.category_id) {
      categoryOptions.value = findCascaderPath(categories.value, form.category_id) || []
    }
  }
}

function close() {
  emit("update:visible", false)
  formRef.value?.resetFields()
  Object.assign(form, {
    category_id: 0,
    ref: "",
    standard: "",
    assessment_method: []
  })
  categoryOptions.value = []
}

function loadCategories() {
  if (categories.value.length > 0) return
  fetchCategoryListOpt().then((res) => {
    const categoryOptData: Array<any> = []
    if (res.data) {
      for (const item of res.data.categories) {
        const parent = item.parentId || 0
        if (categoryOptData[parent] === undefined) {
          categoryOptData[parent] = []
        }
        categoryOptData[parent].push(item)
      }
      categories.value = getCascaderOptions(categoryOptData, 0, 0, 3)
    }
  })
}

function submitForm() {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await getRequest()
        if (res.code === 0) {
          ElMessage.success(props.isEdit ? "更新成功" : "创建成功")
          close()
          emit("refresh")
        } else {
          ElMessage.error(res.message || (props.isEdit ? "更新失败" : "创建失败"))
        }
      } catch (error) {
        console.error(props.isEdit ? "更新失败" : "创建失败", error)
        ElMessage.error(props.isEdit ? "更新失败" : "创建失败")
      } finally {
        loading.value = false
      }
    }
  })
}

function getRequest() {
  if (props.isEdit) {
    return updateMatrix(Number(form.id), form)
  } else {
    return createMatrix(form)
  }
}

function handleCategoryChange(value: any) {
  if (value.length === 0) return
  form.category_id = value[value.length - 1]
}

onMounted(() => {
  loadCategories()
  if (props.visible) {
    open()
  }
})

watch(() => props.visible, (newVal) => {
  if (newVal && props.isEdit) {
    open()
  }
})

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="props.isEdit ? `编辑标准` : `新增标准`"
    width="500px"
    :close-on-click-modal="false"
    @closed="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="分类" prop="category_id">
        <el-cascader
          v-model="categoryOptions"
          placeholder="选择类目"
          filterable
          :options="categories"
          :debounce="500"
          :props="{ expandTrigger: 'hover', checkStrictly: true }"
          @change="handleCategoryChange"
          style="width: 300px;"
        />
      </el-form-item>
      <el-form-item label="编号" prop="ref">
        <el-input v-model="form.ref" placeholder="请输入编号" />
      </el-form-item>
      <el-form-item label="标准" prop="standard">
        <el-input v-model="form.standard" type="textarea" :rows="3" placeholder="请输入标准" />
      </el-form-item>
      <el-form-item label="考核方式" prop="assessment_method">
        <el-select
          v-model="form.assessment_method"
          multiple
          filterable
          placeholder="请选择考核方式"
        >
          <el-option
            v-for="mo in props.options"
            :key="mo.value"
            :label="mo.label"
            :value="mo.value"
          >
            <span>{{ mo.label }}</span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>

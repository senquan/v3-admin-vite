<script lang="ts" setup>
import { findCascaderPath } from "@/common/utils/helper"
import { ElMessage } from "element-plus"
import { createCategory, createDict, createModel, createSerie, createSpec, createTags, fetchTagsList, updateCategory, updateDict, updateModel, updateSerie, updateSpec, updateTags } from "../apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  tags: {
    id: 0,
    name: "",
    color: ""
  },
  category: {
    id: 0,
    name: "",
    parentId: 0,
    icon: "",
    remark: "",
    sort: 0
  },
  spec: {
    id: 0,
    name: ""
  },
  dict: {
    id: 0,
    name: "",
    group: 0,
    value: "",
    remark: ""
  },
  serie: {
    id: 0,
    name: "",
    categoryId: 0,
    image: "",
    year: "",
    sort: 0,
    tags: []
  },
  model: {
    id: 0,
    name: "",
    serieId: 0,
    image: "",
    value: 0,
    sort: 0
  }
})

const formRef = ref()
const formType = ref()
const formTypeName = ref()
const visible = ref(false)
const isEdit = ref(false)
const cascaderOptions = reactive({
  category: [] as number[],
  serie: [] as number[]
})
const categories = ref<any[]>([])
const series = ref<any[]>([])
const tempSort = ref(0)
const tagOptions = ref<any>([])
const selectedTags = ref<any>([])
const tagsLoading = ref(false)

const currentForm = computed(() => {
  if (!formType.value) return formData.tags
  return formData[formType.value as keyof typeof formData]
})

const isTagsForm = computed(() => {
  return formType.value === "tags"
})

const isDictForm = computed(() => {
  return formType.value === "dict"
})

const isSerieForm = computed(() => {
  return formType.value === "serie"
})

const isModelForm = computed(() => {
  return formType.value === "model"
})

function categoryValidator(_: any, value: any, callback: any) {
  if (!value || value.length === 0) {
    callback(new Error("请选择类目"))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  value: [{ required: Boolean(isDictForm), message: "请输入字典值", trigger: "blur" }],
  categoryId: [{ required: Boolean(isSerieForm), validator: categoryValidator, trigger: "change" }]
}

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  id: 0,
  type: "tags",
  editData: null,
  extraData: null as number | null
}) {
  visible.value = true
  formType.value = options.type
  resetForm(options.type)

  if (options.type === "serie") {
    if (Array.isArray(options.extraData)) {
      categories.value = options.extraData as any[]
    }
  } else if (options.type === "model") {
    if (Array.isArray(options.extraData)) {
      series.value = options.extraData as any[]
    }
  }
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
    if (options.type === "serie") {
      const editData = options.editData as { categoryId: number, tagOptions: [{ label: string, id: number }] }
      cascaderOptions.category = findCascaderPath(categories.value, editData?.categoryId ?? 0) || [editData?.categoryId]
      tempSort.value = formData.serie.sort
      selectedTags.value = []
      if (editData.tagOptions.length > 0) {
        tagOptions.value = editData.tagOptions
        selectedTags.value = editData.tagOptions.map(tag => tag.id)
      }
    } else if (options.type === "model") {
      const editData = options.editData as { serieId: number }
      cascaderOptions.serie = findCascaderPath(series.value, editData?.serieId ?? 0) || []
      tempSort.value = formData.model.sort
    }
  } else {
    isEdit.value = false
    if (options.type === "dict") {
      if (typeof options.extraData === "number") {
        formData.dict.group = options.extraData
      }
    } else if (options.type === "serie") {
      selectedTags.value = []
    }
    tempSort.value = 0
  }
}

function resetForm(type: string) {
  if (type === "tags") {
    formTypeName.value = "标签"
    formData.tags = {
      id: 0,
      name: "",
      color: ""
    }
  } else if (type === "category") {
    formTypeName.value = "分类"
    formData.category = {
      id: 0,
      name: "",
      parentId: 0,
      icon: "",
      remark: "",
      sort: 0
    }
  } else if (type === "spec") {
    formTypeName.value = "规格"
    formData.spec = {
      id: 0,
      name: ""
    }
  } else if (type === "dict") {
    formTypeName.value = "字典"
    formData.dict = {
      id: 0,
      name: "",
      group: 0,
      value: "",
      remark: ""
    }
  } else if (type === "serie") {
    formTypeName.value = "系列"
    formData.serie = {
      id: 0,
      name: "",
      categoryId: 0,
      image: "",
      year: "",
      sort: 0,
      tags: []
    }
  } else if (type === "model") {
    formTypeName.value = "型号"
    formData.model = {
      id: 0,
      name: "",
      serieId: 0,
      image: "",
      value: 0,
      sort: 0
    }
  }
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

  if (isSerieForm.value) {
    formData.serie.sort = Number(tempSort.value)
    formData.serie.tags = selectedTags.value
  } else if (isModelForm.value) {
    formData.model.sort = Number(tempSort.value)
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
  if (formType.value === "tags") {
    if (isEdit.value) {
      return updateTags(formData.tags.id, formData.tags)
    } else {
      return createTags(formData.tags)
    }
  } else if (formType.value === "category") {
    if (isEdit.value) {
      return updateCategory(formData.category.id, formData.category)
    } else {
      return createCategory(formData.category)
    }
  } else if (formType.value === "spec") {
    if (isEdit.value) {
      return updateSpec(formData.spec.id, formData.spec)
    } else {
      return createSpec(formData.spec)
    }
  } else if (formType.value === "dict") {
    if (isEdit.value) {
      return updateDict(formData.dict.id, formData.dict)
    } else {
      return createDict(formData.dict)
    }
  } else if (formType.value === "serie") {
    if (isEdit.value) {
      return updateSerie(formData.serie.id, formData.serie)
    } else {
      return createSerie(formData.serie)
    }
  } else if (formType.value === "model") {
    if (isEdit.value) {
      return updateModel(formData.model.id, formData.model)
    } else {
      return createModel(formData.model)
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

function handleCategoryChange(value: any) {
  if (value.length === 0) return
  formData.serie.categoryId = value[value.length - 1]
}

function handleSerieChange(value: any) {
  if (value.length === 0) return
  formData.model.serieId = value[value.length - 1]
}

function handleSearchTags(value: string) {
  if (value === "" && tagOptions.value.length > 0) return
  tagsLoading.value = true
  fetchTagsList({ keyword: value }).then((response) => {
    if (response.code === 0) {
      tagOptions.value = response.data.tags
      tagsLoading.value = false
    } else {
      ElMessage.error(`获取标签列表失败: ${response.message}`)
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
          <el-form-item v-if="isSerieForm" label="类目" prop="categoryId">
            <el-cascader v-model="cascaderOptions.category" placeholder="选择类目" :options="categories" :props="{ expandTrigger: 'hover' }" @change="handleCategoryChange" filterable :debounce="500" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item v-if="isModelForm" label="系列" prop="serieId">
            <el-cascader v-model="cascaderOptions.serie" placeholder="选择系列" :options="series" :props="{ expandTrigger: 'hover' }" @change="handleSerieChange" filterable :debounce="500" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="名称" prop="name">
            <el-input v-model="currentForm.name" placeholder="请输入名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item v-if="isTagsForm" label="颜色" prop="color">
            <el-color-picker v-model="formData.tags.color" show-alpha :predefine="predefineColors" color-format="hex" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item v-if="isDictForm" label="字典值" prop="value">
            <el-input v-model="formData.dict.value" placeholder="请输入字典值" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="isSerieForm || isModelForm" label="排序值" prop="sort">
            <el-input v-model="tempSort" placeholder="请输入排序值(数值越大越排前)" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="isModelForm" label="功能值" prop="value">
            <el-input v-model="formData.model.value" placeholder="请输入功能值" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item v-if="isSerieForm" label="标签" prop="tags">
            <el-select
              v-model="selectedTags"
              multiple
              filterable
              remote
              placeholder="请输入或选择标签"
              :remote-method="handleSearchTags"
              :loading="tagsLoading"
            >
              <el-option
                v-for="tag in tagOptions"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              >
                <span :style="{ color: tag.color }">{{ tag.name }}</span>
              </el-option>
            </el-select>
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

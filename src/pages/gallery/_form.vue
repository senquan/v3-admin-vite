<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import { fetchTagsList } from "../tags/apis"
import { getImageById, updateImage } from "./apis"

interface Props {
  id?: number
  visible: boolean
  options: Array<{ value: number, label: string }>
}

interface Emits {
  (e: "success"): void
  (e: "close"): void
}

const props = withDefaults(defineProps<Props>(), {
  id: 0
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitLoading = ref(false)

const formData = reactive({
  id: 0,
  title: "",
  description: "",
  category: 1,
  tags: [] as string[],
  alt: "",
  url: "",
  filename: "",
  size: 0,
  width: 0,
  height: 0
})

const categoryOptions = ref<any>([])
const tagsLoading = ref(false)
const tagOptions = ref<any>([])
const selectedTags = ref<any>([])

const rules: FormRules = {
  title: [
    { required: true, message: "请输入图片标题", trigger: "blur" },
    { min: 1, max: 100, message: "标题长度在 1 到 100 个字符", trigger: "blur" }
  ],
  category: [
    { required: true, message: "请选择图片分类", trigger: "change" }
  ],
  alt: [
    { max: 200, message: "Alt文本长度不能超过 200 个字符", trigger: "blur" }
  ],
  description: [
    { max: 500, message: "描述长度不能超过 500 个字符", trigger: "blur" }
  ]
}

const isEdit = computed(() => props.id > 0)
const dialogTitle = computed(() => isEdit.value ? "编辑图片" : "新增图片")

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (isEdit.value) {
        fetchDetail()
      } else {
        resetForm()
      }
    }
  }
)

watch(
  () => props.options,
  (options) => {
    if (options && options.length > 0) {
      categoryOptions.value = options
    }
  }
)

async function fetchDetail() {
  if (!props.id) return

  loading.value = true
  try {
    const res = await getImageById(props.id.toString())
    if (res.data) {
      Object.assign(formData, {
        id: res.data.id,
        title: res.data.title || "",
        description: res.data.description || "",
        category: res.data.categoryId || 1,
        tags: res.data.tags || [],
        alt: res.data.altText || "",
        filename: res.data.fileName || "",
        url: res.data.fileUrl || "",
        size: res.data.fileSize || 0,
        width: res.data.width || 0,
        height: res.data.height || 0
      })

      // 加载标签
      tagOptions.value = []
      selectedTags.value = []
      if (res.data.tags) {
        res.data.tags.forEach((tag: any) => {
          if (tag.id) {
            tagOptions.value.push({
              id: tag.id,
              name: tag.name,
              color: tag.color
            })
            selectedTags.value.push(tag.id)
          }
        })
      }
    }
  } catch (error) {
    console.error("获取图片详情失败:", error)
    ElMessage.error("获取图片详情失败")
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    id: 0,
    title: "",
    description: "",
    category: 1,
    tags: [],
    alt: "",
    filename: "",
    url: "",
    size: 0,
    width: 0,
    height: 0
  })
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitLoading.value = true
  formData.tags = selectedTags.value
  try {
    const submitData = {
      title: formData.title,
      description: formData.description,
      categoryId: formData.category,
      tags: formData.tags,
      alt: formData.alt
    }

    if (isEdit.value) {
      await updateImage(props.id.toString(), submitData)
      ElMessage.success("更新成功")
    } else {
      // await uploadSingleImage(submitData)
      ElMessage.success("创建成功")
    }

    emit("success")
    handleClose()
  } catch (error) {
    console.error("提交失败:", error)
    ElMessage.error(isEdit.value ? "更新失败" : "创建失败")
  } finally {
    submitLoading.value = false
  }
}

function handleClose() {
  emit("close")
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

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
        label-position="left"
      >
        <!-- 图片预览 -->
        <el-form-item label="图片预览" v-if="formData.url">
          <div class="image-preview">
            <img :src="formData.url" :alt="formData.alt" class="preview-img">
            <div class="image-info">
              <p><strong>文件名:</strong> {{ formData.filename }}</p>
              <p><strong>尺寸:</strong> {{ formData.width }} × {{ formData.height }}</p>
              <p><strong>大小:</strong> {{ formatFileSize(formData.size) }}</p>
            </div>
          </div>
        </el-form-item>

        <!-- 标题 -->
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入图片标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <!-- 分类 -->
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="formData.category"
            placeholder="请选择图片分类"
            style="width: 100%;"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <!-- Alt文本 -->
        <el-form-item label="Alt文本" prop="alt">
          <el-input
            v-model="formData.alt"
            placeholder="请输入Alt文本，用于SEO和无障碍访问"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 标签 -->
        <el-form-item label="标签">
          <el-select
            v-model="selectedTags"
            multiple
            filterable
            remote
            allow-create
            default-first-option
            placeholder="请输入或选择标签"
            :remote-method="(val: string) => handleSearchTags(val)"
            :loading="tagsLoading"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            >
              {{ tag.name }}
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入图片描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ isEdit ? "更新" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.image-preview {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.preview-img {
  max-width: 200px;
  max-height: 150px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.image-info {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.image-info p {
  margin: 4px 0;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-preview {
    flex-direction: column;
  }

  .preview-img {
    max-width: 100%;
  }
}
</style>

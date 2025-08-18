<script lang="ts" setup>
import type { UploadProps, UploadUserFile } from "element-plus"
import type { FileInfo } from "./apis/type"
import { request } from "@/http/axios"
import {
  Delete,
  Plus,
  Upload,
  View
} from "@element-plus/icons-vue"
import { fetchTagsList } from "../tags/apis"
import { uploadImages } from "./apis"

interface Props {
  visible: boolean
  maxCount?: number
  maxSize?: number // MB
  acceptTypes?: string[]
  options: Array<{ value: number, label: string }>
}

interface Emits {
  (e: "success"): void
  (e: "close"): void
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 20,
  maxSize: 10,
  acceptTypes: () => ["image/jpeg", "image/png", "image/gif", "image/webp"]
})

const emit = defineEmits<Emits>()

const uploadRef = ref()
const uploading = ref(false)
const fileList = ref<any[]>([])
const uploadProgress = ref<Record<string, number>>({})

const uploadForm = reactive({
  category: 1,
  title: "",
  tags: [] as string[],
  autoRename: true,
  compressQuality: 0.8,
  files: [] as FileInfo[]
})

const categoryOptions = ref<any>([])
const tagsLoading = ref(false)
const tagOptions = ref<any>([])
const selectedTags = ref<any>([])

const acceptedTypes = computed(() => props.acceptTypes.join(","))
const canUpload = computed(() => fileList.value.length < props.maxCount)
const hasFiles = computed(() => fileList.value.length > 0)

watch(
  () => props.options,
  (options) => {
    if (options && options.length > 0) {
      categoryOptions.value = options
    }
  }
)

// 文件上传前的检查
const beforeUpload: UploadProps["beforeUpload"] = (rawFile) => {
  // 检查文件类型
  if (!props.acceptTypes.includes(rawFile.type)) {
    ElMessage.error(`不支持的文件类型: ${rawFile.type}`)
    return false
  }

  // 检查文件大小
  const maxSizeBytes = props.maxSize * 1024 * 1024
  if (rawFile.size > maxSizeBytes) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }

  // 检查文件数量
  if (fileList.value.length >= props.maxCount) {
    ElMessage.error(`最多只能上传 ${props.maxCount} 个文件`)
    return false
  }

  return true
}

// 手动移除单个文件
function handleRemoveFile(file: UploadUserFile) {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
    // 清除对应的进度
    if (file.uid) {
      delete uploadProgress.value[file.uid]
    }
  }
}

// 预览文件
const previewVisible = ref(false)
const previewImageUrl = ref("")

const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  if (uploadFile.url) {
    previewImageUrl.value = uploadFile.url
    previewVisible.value = true
  }
}

// 手动预览文件
function handlePreviewFile(file: UploadUserFile) {
  if (file.url) {
    previewImageUrl.value = file.url
    previewVisible.value = true
  }
}

function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append("type", "gallery")
  data.append("image", file)
  return request({
    url: "upload/image",
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        onProgress({ percent })
      }
    }
  }).then((response: any) => {
    onSuccess(response)
    return response
  }).catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

// 批量上传
async function handleBatchUpload() {
  if (!hasFiles.value) {
    ElMessage.warning("请先选择要上传的文件")
    return
  }
  uploadForm.tags = selectedTags.value
  uploadForm.files = fileList.value.map((item: any) => {
    return {
      url: item.response?.data?.url || item.url,
      size: item.size,
      name: item.name,
      type: item.response?.data?.type || item.type || "application/octet-stream",
      height: item.response?.data?.height || 0,
      width: item.response?.data?.width || 0
    }
  })
  uploading.value = true
  try {
    const res = await uploadImages(uploadForm)
    if (res.code === 0) {
      emit("success")
      handleClose()
    } else {
      ElMessage.error("上传失败，请重试")
    }
  } catch (error) {
    console.error("批量上传失败:", error)
    ElMessage.error("上传失败，请重试")
  } finally {
    uploading.value = false
  }
}

// 清空文件列表
function handleClear() {
  if (!hasFiles.value) return

  ElMessageBox.confirm(
    "确定要清空所有文件吗？",
    "清空确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    fileList.value = []
    uploadProgress.value = {}
    uploadRef.value?.clearFiles()
  }).catch(() => {
    // 用户取消
  })
}

// 关闭对话框
function handleClose() {
  // 重置状态
  fileList.value = []
  uploadProgress.value = {}
  uploadForm.category = 1
  uploadForm.title = ""
  uploadForm.tags = []
  uploadForm.autoRename = true
  uploadForm.compressQuality = 0.8
  selectedTags.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }

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

// 格式化文件大小
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
    title="上传图片"
    width="805px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="upload-container">
      <!-- 上传配置 -->
      <div class="upload-config">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="分类">
              <el-select
                v-model="uploadForm.category"
                placeholder="选择分类"
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
          </el-col>
          <el-col :span="8">
            <el-form-item label="自动重命名">
              <el-switch v-model="uploadForm.autoRename" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="压缩质量">
              <el-slider
                v-model="uploadForm.compressQuality"
                :min="0.1"
                :max="1"
                :step="0.1"
                :format-tooltip="(val: number) => `${Math.round(val * 100)}%`"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="文件标题">
              <el-input v-model="uploadForm.title" placeholder="请输入文件标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 标签配置 -->
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
                  <span :style="{ color: tag.color }">{{ tag.name }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 上传区域 -->
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          v-model:file-list="fileList"
          :accept="acceptedTypes"
          :limit="maxCount"
          :before-upload="beforeUpload"
          :http-request="customUploadRequest"
          :on-preview="handlePreview"
          list-type="picture-card"
          class="upload-dragger"
        >
          <el-icon v-if="canUpload" class="image-uploader-icon"><Plus /></el-icon>

          <template #file="{ file }">
            <div class="upload-file-card">
              <img
                v-if="file.url"
                :src="file.url"
                :alt="file.name"
                class="upload-file-img"
              >
              <div class="upload-file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size || 0) }}</div>

                <!-- 上传进度 -->
                <div v-if="file.uid && uploadProgress[file.uid] !== undefined" class="upload-progress">
                  <el-progress
                    :percentage="uploadProgress[file.uid]"
                    :stroke-width="4"
                    :show-text="false"
                  />
                  <span class="progress-text">{{ uploadProgress[file.uid] }}%</span>
                </div>
              </div>

              <div class="upload-file-actions">
                <el-button
                  size="small"
                  type="primary"
                  :icon="View"
                  @click="handlePreviewFile(file)"
                  circle
                />
                <el-button
                  size="small"
                  type="danger"
                  :icon="Delete"
                  @click="handleRemoveFile(file)"
                  circle
                />
              </div>
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 文件统计 -->
      <div class="upload-stats" v-if="hasFiles">
        <el-alert
          :title="`已选择 ${fileList.length} 个文件，总大小 ${formatFileSize(fileList.reduce((sum, file) => sum + (file.size || 0), 0))}`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClear" :disabled="!hasFiles || uploading">
          清空
        </el-button>
        <el-button @click="handleClose" :disabled="uploading">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!hasFiles"
          @click="handleBatchUpload"
        >
          <el-icon><Upload /></el-icon>
          {{ uploading ? '上传中...' : `上传 ${fileList.length} 个文件` }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 图片预览 -->
  <el-image-viewer
    v-if="previewVisible"
    :url-list="[previewImageUrl]"
    @close="previewVisible = false"
  />
</template>

<style scoped>
.upload-container {
  padding: 20px 0;
}

.upload-config {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.upload-placeholder {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text p {
  margin: 8px 0;
  color: #606266;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.upload-file-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
}

.upload-file-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.upload-file-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  font-size: 12px;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.file-size {
  opacity: 0.8;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.progress-text {
  font-size: 10px;
  min-width: 30px;
}

.upload-file-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-file-card:hover .upload-file-actions {
  opacity: 1;
}

.upload-stats {
  margin-top: 16px;
}

.dialog-footer {
  text-align: right;
}

.el-icon.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-config .el-col {
    margin-bottom: 16px;
  }

  .upload-placeholder {
    padding: 20px 10px;
  }

  .upload-icon {
    font-size: 32px;
  }
}
</style>

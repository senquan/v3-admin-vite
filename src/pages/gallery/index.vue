<script lang="ts" setup>
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { LazyImg, Waterfall } from "vue-waterfall-plugin-next"
import GalleryForm from "./_form.vue"
import GalleryUpload from "./_upload.vue"
import { batchDeleteImages, deleteImage, fetchList } from "./apis"
import "vue-waterfall-plugin-next/dist/style.css"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  categoryId: "",
  tag: "",
  sort: "-createTime",
  page: 1,
  pageSize: 36
})

const searchOptions = reactive({
  categories: [] as Array<{ value: number, label: string }>,
  tags: [] as Array<{ value: string, label: string }>
})

const totalImages = ref(0)
const imageList = ref<any>([])
const galleryFormRef = ref<any>(null)
const galleryUploadRef = ref<any>(null)
const formVisibility = ref(false)
const uploadVisibility = ref(false)
const selectedImages = ref<any>([])
const currentImageId = ref<number>(0)
const waterfallRef = ref<any>(null)
const previewVisible = ref(false)
const previewImageUrl = ref("")

const totalPages = computed(() => Math.ceil(totalImages.value / listQuery.pageSize))

// 瀑布流配置
const waterfallOptions = reactive({
  rowKey: "id",
  gutter: 10,
  hasAroundGutter: true,
  width: 230,
  breakpoints: {
    1920: { rowPerView: 7 },
    1600: { rowPerView: 6 },
    1366: { rowPerView: 5 },
    800: { rowPerView: 4 },
    500: { rowPerView: 3 }
  },
  animationEffect: "animate__fadeInUp",
  animationDuration: 1000,
  animationDelay: 300,
  backgroundColor: "#f8f9fa",
  imgSelector: "src",
  loadProps: {
    loading: "/src/assets/loading.gif",
    error: "/src/assets/error.png"
  },
  lazyload: true
})

async function fetchImages() {
  loading.value = true
  try {
    const res = await fetchList(listQuery)
    if (res.data && res.data.items) {
      totalImages.value = res.data.total
      imageList.value = res.data.items.map((item: any) => ({
        id: item.id,
        src: item.fileUrl,
        title: item.title || item.filename,
        description: item.description || "",
        filename: item.filename,
        size: item.fileSize || 0,
        width: item.width || 300,
        height: item.height || 200,
        category: item.category?.name || "",
        tags: item.tags || [],
        createTime: item.createTime,
        updateTime: item.updateTime
      }))

      if (res.data.tags) {
        searchOptions.tags = res.data.tags.map((item: any) => ({
          value: item.id,
          label: item.name
        }))
      }
    } else {
      imageList.value = []
    }
  } catch (error) {
    console.error("获取图片失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    imageList.value = []
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  listQuery.page = 1
  fetchImages()
}

function handleNew() {
  uploadVisibility.value = true
}

function handleEdit(id: number) {
  currentImageId.value = id
  formVisibility.value = true
}

function handlePreview(imageUrl: string) {
  previewImageUrl.value = imageUrl
  previewVisible.value = true
}

function handleDownload(image: any) {
  const link = document.createElement("a")
  link.href = image.src
  link.download = image.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success("下载成功")
}

function handleDelete(id: number) {
  ElMessageBox.confirm(
    "此操作将永久删除该图片，是否继续？",
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    deleteImage(id).then(() => {
      ElMessage.success("删除成功")
      fetchImages()
    }).catch(() => {
      ElMessage.error("删除失败")
    })
  }).catch(() => {
    ElMessage.info("已取消删除")
  })
}

function handleBatchDelete() {
  if (selectedImages.value.length === 0) {
    ElMessage.warning("请选择要删除的图片")
    return
  }

  ElMessageBox.confirm(
    `此操作将永久删除选中的 ${selectedImages.value.length} 张图片，是否继续？`,
    "批量删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    const ids = selectedImages.value.map((img: any) => img.id)
    batchDeleteImages({ ids }).then(() => {
      ElMessage.success("批量删除成功")
      selectedImages.value = []
      fetchImages()
    }).catch(() => {
      ElMessage.error("批量删除失败")
    })
  }).catch(() => {
    ElMessage.info("已取消删除")
  })
}

function handleCancelDelete() {
  selectedImages.value = []
}

// function handleSelectionChange(selection: any[]) {
//   selectedImages.value = selection
// }

function uploadSuccess() {
  fetchImages()
  uploadVisibility.value = false
}

function handlePageChange(page: number) {
  listQuery.page = page
  fetchImages()
}

function handleSizeChange(size: number) {
  listQuery.pageSize = size
  listQuery.page = 1
  fetchImages()
}

function handleCopyUrl(url: string) {
  navigator.clipboard.writeText(window.location.origin + url).then(() => {
    ElMessage.success("复制成功")
  }).catch(() => {
    ElMessage.error("复制失败")
  })
}

function resizeWaterfall() {
  if (waterfallRef.value) {
    waterfallRef.value.renderer()
  }
}
function initOptions() {
  const store = useSystemParamsStore()
  searchOptions.categories = store.getArrayDict(5)?.map((item: any) => {
    return {
      label: item.name,
      value: Number(item.value)
    }
  })
}

onMounted(() => {
  fetchImages().then(() => {
    setTimeout(() => {
      resizeWaterfall()
    }, 2000)
  })
  initOptions()
})
</script>

<template>
  <div class="gallery-container">
    <!-- 搜索栏 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索图片名称或描述"
        class="filter-item"
        style="width: 300px;"
        @keyup.enter="handleFilter"
        @clear="handleFilter"
        clearable
      />

      <el-select
        v-model="listQuery.categoryId"
        placeholder="选择分类"
        class="filter-item"
        style="width: 150px;"
        @change="handleFilter"
        clearable
      >
        <el-option
          v-for="item in searchOptions.categories"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>

      <el-select
        v-model="listQuery.sort"
        placeholder="排序方式"
        class="filter-item"
        style="width: 150px;"
        @change="handleFilter"
      >
        <el-option label="最新上传" value="-createTime" />
        <el-option label="最早上传" value="+createTime" />
        <el-option label="标题 A-Z" value="+title" />
        <el-option label="标题 Z-A" value="-title" />
        <el-option label="文件大小 大-小" value="-fileSize" />
        <el-option label="文件大小 小-大" value="+fileSize" />
      </el-select>

      <el-button type="primary" @click="handleFilter" style="margin-left: 12px;">
        搜索
      </el-button>
      <el-button type="success" @click="handleNew">
        <el-icon><Upload /></el-icon>
        上传图片
      </el-button>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-container" v-if="selectedImages.length > 0">
      <div class="selection-info">
        已选择 {{ selectedImages.length }} 张图片
      </div>
      <div class="toolbar-actions">
        <el-button type="info" @click="handleCancelDelete">
          <el-icon><Close /></el-icon>
          取消
        </el-button>
        <el-button type="danger" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 瀑布流图片展示 -->
    <div class="waterfall-container" v-loading="loading">
      <Waterfall
        ref="waterfallRef"
        :key="`${listQuery.page}-${listQuery.pageSize}-${waterfallOptions.width}`"
        :list="imageList"
        :row-key="waterfallOptions.rowKey"
        :gutter="waterfallOptions.gutter"
        :has-around-gutter="waterfallOptions.hasAroundGutter"
        :width="waterfallOptions.width"
        :breakpoints="waterfallOptions.breakpoints"
        :animation-effect="waterfallOptions.animationEffect"
        :img-selector="waterfallOptions.imgSelector"
        :background-color="waterfallOptions.backgroundColor"
        :lazyload="waterfallOptions.lazyload"
        :load-props="waterfallOptions.loadProps"
      >
        <template #default="{ item: card, url }">
          <div class="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-linear hover:shadow-lg hover:shadow-gray-600 group">
            <!-- 选择框 -->
            <div class="image-checkbox">
              <el-checkbox
                :model-value="selectedImages.some((img: any) => img.id === card.id)"
                @change="(val: any) => {
                  if (val) {
                    if (!selectedImages.some((img: any) => img.id === card.id)) {
                      selectedImages.push(card)
                    }
                  }
                  else {
                    const index = selectedImages.findIndex((img: any) => img.id === card.id)
                    if (index > -1) {
                      selectedImages.splice(index, 1)
                    }
                  }
                }"
              />
            </div>

            <!-- 图片 -->
            <div class="overflow-hidden">
              <LazyImg
                :url="url"
                :title="card.title"
                class="cursor-pointer transition-all duration-300 ease-linear group-hover:scale-105"
                @click="handlePreview(url)"
              />
            </div>

            <!-- 悬浮操作按钮 -->
            <div class="image-overlay">
              <el-button-group>
                <el-button size="small" @click="handlePreview(url)">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button size="small" @click="handleCopyUrl(url)">
                  <el-icon><Link /></el-icon>
                </el-button>
                <el-button size="small" @click="handleDownload(card)">
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button size="small" @click="handleEdit(card.id)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click="handleDelete(card.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-button-group>
            </div>

            <!-- 图片信息 -->
            <div class="image-info">
              <div class="image-title">{{ card.title }}</div>
              <div class="image-meta">
                <span class="image-size">{{ (card.size / 1024).toFixed(1) }}KB</span>
                <span class="image-dimensions">{{ card.width }}×{{ card.height }}</span>
              </div>
              <div class="image-tags" v-if="card.tags && card.tags.length > 0">
                <el-tag
                  v-for="tag in card.tags"
                  :key="tag.id"
                  size="small"
                  style="margin-right: 4px;"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </Waterfall>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="totalPages > 1">
      <el-pagination
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalImages"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%" center>
      <div class="preview-container">
        <img :src="previewImageUrl" alt="预览图片" class="preview-image">
      </div>
    </el-dialog>

    <!-- 图片编辑表单 -->
    <GalleryForm
      ref="galleryFormRef"
      :id="currentImageId"
      :options="searchOptions.categories"
      :visible="formVisibility"
      @success="fetchImages"
      @close="formVisibility = false"
    />

    <!-- 图片上传组件 -->
    <GalleryUpload
      ref="galleryUploadRef"
      :visible="uploadVisibility"
      :options="searchOptions.categories"
      @success="uploadSuccess"
      @close="uploadVisibility = false"
    />
  </div>
</template>

<style scoped>
.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 20px 5px;
}
.waterfall-container {
  background: #f8f9fa;
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  width: 100%;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  height: 100vh;
}
.image-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.group:hover .image-overlay {
  opacity: 1;
}
.image-info {
  padding: 12px;
}
.image-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
.image-tags {
  margin-top: 8px;
}
.pagination-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.preview-container {
  text-align: center;
}
.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.toolbar-container {
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-input__wrapper) {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-container {
    padding: 15px;
  }

  .filter-item {
    width: 100% !important;
    margin-bottom: 10px;
  }

  .toolbar-container {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

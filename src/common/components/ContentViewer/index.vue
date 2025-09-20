<script lang="ts" setup>
import type { ContentData } from "./types"
import { formatDateTime } from "@/common/utils/datetime"

interface Props {
  visible: boolean
  data?: ContentData
  width?: string | number
  maxHeight?: string | number
}

interface Emits {
  (e: "update:visible", value: boolean): void
  (e: "close"): void
}

const props = withDefaults(defineProps<Props>(), {
  width: "60%",
  maxHeight: "500vh"
})

const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => {
    emit("update:visible", value)
    if (!value) {
      emit("close")
    }
  }
})

const contentRef = ref<HTMLElement>()

// 处理对话框关闭
function handleClose() {
  dialogVisible.value = false
}

// 处理内容区域的样式
const contentStyle = computed(() => ({
  maxHeight: typeof props.maxHeight === "number" ? `${props.maxHeight}px` : props.maxHeight,
  overflow: "auto",
  padding: "16px",
  lineHeight: "1.6",
  fontSize: "14px",
  color: "#333"
}))
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="data?.title"
    :width="width"
    :before-close="handleClose"
    class="content-viewer-dialog"
    append-to-body
    destroy-on-close
    center
  >
    <template #header>
      <div class="dialog-header">
        <span class="title">{{ data?.title }}</span>
        <br>
        <span class="datetime" v-if="data?.datetime">
          发布时间：{{ formatDateTime(data.datetime) }}
        </span>
        <span class="author" v-if="data?.author">
          发布人：{{ data.author }}
        </span>
      </div>
    </template>

    <div
      ref="contentRef"
      class="content-viewer-body"
      :style="contentStyle"
      v-html="data?.content"
    />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.content-viewer-dialog {
  --el-dialog-border-radius: 8px;
}

.content-viewer-body {
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.dialog-footer {
  text-align: right;
}
</style>

<style>
/* 全局样式，用于美化wangeditor生成的HTML内容 */
.content-viewer-body h1,
.content-viewer-body h2,
.content-viewer-body h3,
.content-viewer-body h4,
.content-viewer-body h5,
.content-viewer-body h6 {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

.content-viewer-body h1 {
  font-size: 24px;
  color: #303133;
}

.content-viewer-body h2 {
  font-size: 20px;
  color: #303133;
}

.content-viewer-body h3 {
  font-size: 18px;
  color: #606266;
}

.content-viewer-body h4 {
  font-size: 16px;
  color: #606266;
}

.content-viewer-body h5,
.content-viewer-body h6 {
  font-size: 14px;
  color: #909399;
}

.content-viewer-body p {
  margin: 8px 0;
  line-height: 1.6;
}

.content-viewer-body ul,
.content-viewer-body ol {
  margin: 8px 0;
  padding-left: 24px;
}

.content-viewer-body li {
  margin: 4px 0;
  line-height: 1.5;
}

.content-viewer-body blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.content-viewer-body code {
  padding: 2px 4px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
}

.content-viewer-body pre {
  margin: 16px 0;
  padding: 16px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow-x: auto;
}

.content-viewer-body pre code {
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: 0;
}

.content-viewer-body table {
  width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
  border: 1px solid #e4e7ed;
}

.content-viewer-body th,
.content-viewer-body td {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  text-align: left;
}

.content-viewer-body th {
  background-color: #f5f7fa;
  font-weight: 600;
}

.content-viewer-body img {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  border-radius: 4px;
}

.content-viewer-body a {
  color: #409eff;
  text-decoration: none;
}

.content-viewer-body a:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.content-viewer-body hr {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #e4e7ed;
}

.content-viewer-body strong {
  font-weight: 600;
}

.content-viewer-body em {
  font-style: italic;
}

.dialog-header .title {
  font-size: 24px;
  color: #303133;
}

.dialog-header .datetime,
.dialog-header .author {
  display: block;
  margin-top: 20px;
  font-size: 14px;
  color: #909399;
}
</style>

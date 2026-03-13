<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { getBatchDetail } from "../apis"

const emit = defineEmits(["success", "close"])

const detailData = ref<any>()
const visible = ref(false)

function open(options = {
  batchNo: ""
}) {
  console.log(options)
  visible.value = true
  if (options.batchNo) {
    getBatchDetail(options.batchNo).then((response: any) => {
      if (response.code === 0) {
        detailData.value = response.data
        console.log(detailData.value)
      } else {
        ElMessage({
          message: response.message || "获取数据失败",
          type: "error",
          offset: 0
        })
      }
    })
  }
}

function downloadUrl(url: string) {
  window.open(url)
}

function close() {
  visible.value = false
  emit("close")
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="批次详情"
    width="600px"
    :before-close="close"
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item label-width="120" label="批次号">{{ detailData?.batchNo }}</el-descriptions-item>
      <el-descriptions-item label="下载"><el-button type="primary" @click="downloadUrl(detailData?.url)">下载</el-button></el-descriptions-item>
      <el-descriptions-item label="备注">{{ detailData?.remark }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">关闭</el-button>
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

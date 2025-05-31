<script lang="ts" setup>
import { ElMessage } from "element-plus"
import * as XLSX from "xlsx"
import { importProducts } from "./apis"

const emit = defineEmits(["success", "close"])
const visible = ref(false)
const fileList = ref<any[]>([])
const uploadRef = ref()
const importing = ref(false)
const progress = ref(0)
const totalRows = ref(0)
const processedRows = ref(0)
const successCount = ref(0)
const updatedCount = ref(0)
const ignoredCount = ref(0)
const errorCount = ref(0)
const errorMessages = ref<string[]>([])

const fieldMapping = {
  物料编号: "materialId",
  条形码: "barCode",
  型号: "modelType",
  系列: "serie",
  颜色: "color",
  产品名称: "name",
  日常价: "basePrice",
  工程价: "projectPrice",
  出厂价: "factoryPrice",
  备注: "remark"
}

function open() {
  visible.value = true
  resetData()
}

function resetData() {
  fileList.value = []
  importing.value = false
  progress.value = 0
  totalRows.value = 0
  processedRows.value = 0
  successCount.value = 0
  updatedCount.value = 0
  ignoredCount.value = 0
  errorCount.value = 0
  errorMessages.value = []
}

function close() {
  if (importing.value) {
    ElMessage.warning("正在导入中，请稍后关闭")
    return
  }
  visible.value = false
  emit("close")
}

function handleExceed() {
  ElMessage.warning("只能上传一个文件")
}

function handleRemove() {
  fileList.value = []
}

function handleRecent(count: number) {
  if (!importing.value) {
    visible.value = false
    emit("success", count)
  }
}

function beforeUpload(file: any) {
  const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel"
  if (!isExcel) {
    ElMessage.error("只能上传Excel文件!")
    return false
  }
  fileList.value = [file]
  console.log("fileList.value", fileList.value)
  return false // 阻止自动上传
}

function handleFileChange(file: any, list: any[]) {
  console.log("文件变化", file, list)
  if (file && file.raw) {
    fileList.value = [file]
  }
}

async function processFile() {
  console.log("处理文件", fileList.value)
  if (!fileList.value || fileList.value.length === 0) {
    ElMessage.warning("请先选择Excel文件")
    return
  }

  // 确保文件对象存在
  const file = fileList.value[0]
  if (!file) {
    fileList.value = []
    ElMessage.warning("文件无效，请重新选择")
    return
  }

  importing.value = true
  progress.value = 0
  successCount.value = 0
  updatedCount.value = 0
  ignoredCount.value = 0
  errorCount.value = 0
  errorMessages.value = []

  try {
    // 使用 file.raw 获取原始文件对象
    const actualFile = file.raw || file
    console.log("actualFile", actualFile)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "array" })

        // 处理每个工作表
        const allProducts = []

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length < 2) {
            errorMessages.value.push(`工作表 ${sheetName} 数据不足，已跳过`)
            continue
          }

          // 检查表头
          const headers = jsonData[0] as string[]
          if (!headers.includes("物料编号")) {
            errorMessages.value.push(`工作表 ${sheetName} 缺少必要的"物料编号"列，已跳过`)
            continue
          }

          // 解析数据
          const products = []
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[]
            if (!row || row.length === 0) continue

            const product: any = {}
            let hasError = false

            // 映射字段
            for (let j = 0; j < headers.length; j++) {
              const header = headers[j]
              const fieldName = fieldMapping[header as keyof typeof fieldMapping]

              if (fieldName && row[j] !== undefined) {
                // 特殊处理数字字段
                if (["basePrice", "projectPrice", "factoryPrice"].includes(fieldName)) {
                  product[fieldName] = Number.parseFloat(row[j]) || 0
                } else {
                  product[fieldName] = row[j]
                }
              }
            }

            // 检查必填字段
            if (!product.materialId) {
              errorCount.value++
              errorMessages.value.push(`工作表 ${sheetName} 第 ${i + 1} 行缺少物料编号，已跳过`)
              hasError = true
            }

            if (!hasError) {
              products.push(product)
            }
          }

          allProducts.push(...products)
        }

        // 设置总行数
        totalRows.value = allProducts.length

        // 批量处理数据
        if (allProducts.length > 0) {
          const batchSize = 20
          for (let i = 0; i < allProducts.length; i += batchSize) {
            const batch = allProducts.slice(i, i + batchSize)
            try {
              const result = await importProducts(batch)
              if (result.code === 0) {
                successCount.value += result.data.success || 0
                updatedCount.value += result.data.updated || 0
                ignoredCount.value += result.data.ignored || 0
                errorCount.value += result.data.error || 0

                if (result.data.errorMessages) {
                  errorMessages.value.push(...result.data.errorMessages)
                }
              } else {
                errorCount.value += batch.length
                errorMessages.value.push(result.message || "批量导入失败")
              }
            } catch (error: any) {
              errorCount.value += batch.length
              errorMessages.value.push(error.message || "批量导入失败")
            }

            // 更新进度
            processedRows.value += batch.length
            progress.value = Math.floor((processedRows.value / totalRows.value) * 100)
          }

          ElMessage.success(`导入完成，新增: ${successCount.value}，更新: ${updatedCount.value}，忽略: ${ignoredCount.value}，失败: ${errorCount.value}`)
          emit("success")
        } else {
          ElMessage.warning("没有有效的商品数据可导入")
        }
      } catch (error: any) {
        ElMessage.error(`解析Excel文件失败: ${error.message}`)
        errorMessages.value.push(`解析Excel文件失败: ${error.message}`)
      }

      importing.value = false
    }

    // 修改这里，使用 actualFile 而不是 file
    reader.readAsArrayBuffer(actualFile)
  } catch (error: any) {
    importing.value = false
    ElMessage.error(`处理文件失败: ${error.message}`)
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="批量导入商品"
    width="600px"
    :close-on-click-modal="false"
    :before-close="close"
  >
    <div class="import-container">
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          action="#"
          :auto-upload="false"
          :limit="1"
          :on-exceed="handleExceed"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :file-list="fileList"
          accept=".xlsx,.xls"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传Excel文件, 第一行为表头, 必须包含 [<b>物料编号</b>] 列
            </div>
          </template>
        </el-upload>
      </div>

      <div class="progress-area">
        <div class="progress-info">
          <span>处理进度: {{ processedRows }}/{{ totalRows }}</span>
          <span>新增: <el-link @click="handleRecent(successCount)">{{ successCount }}</el-link></span>
          <span>更新: {{ updatedCount }}</span>
          <span>忽略: {{ ignoredCount }}</span>
          <span>失败: {{ errorCount }}</span>
        </div>
        <el-progress :percentage="progress" :status="progress === 100 ? 'success' : ''" />
      </div>

      <div v-if="errorMessages.length > 0" class="error-area">
        <h4>错误信息:</h4>
        <el-scrollbar height="150px">
          <ul class="error-list">
            <li v-for="(msg, index) in errorMessages" :key="index" class="error-item">
              {{ msg }}
            </li>
          </ul>
        </el-scrollbar>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close" :disabled="importing">取消</el-button>
        <el-button type="primary" @click="processFile" :loading="importing">
          {{ importing ? "导入中..." : "开始导入" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.import-container {
  padding: 10px;
}
.upload-area {
  margin-bottom: 20px;
}
.progress-area {
  margin: 20px 0;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.error-area {
  margin-top: 20px;
}
.error-list {
  padding-left: 20px;
  margin: 0;
}
.error-item {
  color: #f56c6c;
  line-height: 1.5;
  margin-bottom: 5px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
.el-upload__tip {
  text-align: end;
}
</style>

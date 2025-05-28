<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import html2canvas from "html2canvas"

const emit = defineEmits(["success", "close"])

const visible = ref(false)
const orderData = ref<any>([])
const summaryData = reactive<any>({})
const title = ref("")

const btnSubmit = reactive({
  loading: false
})

function open(options = {
  data: Array<any>,
  title: "",
  summary: {
    dialyDiscount: 0,
    dailyPrice: 0,
    promotionDiscount: 0,
    promotionPrice: 0,
    flashDiscount: 0,
    flashPrice: 0
  }
}) {
  orderData.value = Array.isArray(options.data) ? options.data.filter(item => item.modelType && item.quantity > 0) : []
  Object.assign(summaryData, options.summary)
  title.value = options.title
  visible.value = true
}

function close() {
  visible.value = false
  emit("close")
}

defineExpose({
  open
})

function saveAsImage() {
  btnSubmit.loading = true
  const element = document.getElementById("print-area")
  if (!element) return
  html2canvas(element).then((canvas) => {
    const link = document.createElement("a")
    link.download = `公牛报价单_${new Date().toLocaleDateString()}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
    btnSubmit.loading = false
  }).catch((err) => {
    console.error("保存图片失败:", err)
    btnSubmit.loading = false
  })
}

// 复制到剪贴板
function copyToClipboard() {
  btnSubmit.loading = true
  const element = document.getElementById("print-area")
  if (!element) return
  html2canvas(element).then((canvas) => {
    canvas.toBlob((blob) => {
      try {
        const item = new ClipboardItem({ "image/png": blob as Blob })
        navigator.clipboard.write([item]).then(() => {
          ElMessage.success("已复制到剪贴板")
          btnSubmit.loading = false
        }).catch((err) => {
          console.error("复制失败:", err)
          ElMessage.success("复制到剪贴板失败，请尝试使用保存图片功能")
          btnSubmit.loading = false
        })
      } catch (err) {
        console.error("复制失败:", err)
        ElMessage.error("您的浏览器不支持复制图片到剪贴板，请尝试使用保存图片功能")
        btnSubmit.loading = false
      }
    })
  }).catch((err) => {
    console.error("生成图片失败:", err)
    btnSubmit.loading = false
  })
}

// 打印功能
function printContent() {
  window.print()
}

function getSummaries(param: any) {
  const { columns, data } = param
  const sums: (string | VNode)[] = []
  columns.forEach((column: { property: string }, index: number) => {
    if (index === 0) {
      sums[index] = h("div", [
        "总计"
      ])
      return
    }
    let values
    if (index === 5) {
      values = data.map((item: Record<string, any>) => {
        if (item.name.includes("套装") || item.name.includes("预售")) {
          return Number(item[column.property]) * 10
        } else if (item.isBonus || item.id === "") {
          return 0
        } else {
          return Number(item[column.property])
        }
      })
    } else {
      values = data.map((item: Record<string, any>) => Number(item[column.property]))
    }
    if (index === 5 || index === 7 || index === 9) {
      if (!values.every((value: number) => Number.isNaN(value))) {
        sums[index] = Number(`${values.reduce((prev: number, curr: number) => {
          const value = Number(curr)
          if (!Number.isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)}`).toFixed(index === 5 ? 0 : 2)
      }
    } else {
      sums[index] = ""
    }
  })

  return sums
}
</script>

<template>
  <el-dialog
    v-model="visible"
    fullscreen
    :show-close="false"
    :before-close="close"
    style="background-color: #4b8f88"
  >
    <div id="print-area" style="background-color: #4b8f88; padding: 10px 10px 0 10px;">
      <div class="header-container">
        <div class="logo"><img src="@@/assets/images/layouts/bull-logo.png"></div>
        <div class="title">
          公牛官方报价单
          <span>授权编码：2212077530202253</span>
        </div>
        <div class="intro"><span>10</span>户中国家庭  <span>7</span>户用公牛</div>
      </div>

      <el-table
        :data="orderData"
        :summary-method="getSummaries"
        show-summary
        border
      >
        <el-table-column prop="imageUrl" label="产品主图" width="100" align="center">
          <template #default="{ row }">
            <div class="product-image-container">
              <el-image
                style="width: 80px; height: 80px"
                :src="row.imageUrl"
                fit="cover"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="modelType" label="型号" width="150" align="center" />
        <el-table-column prop="serie" label="系列" width="120" align="center" />
        <el-table-column prop="color" label="颜色" width="120" align="center" />
        <el-table-column prop="name" label="名称" min-width="200" align="center" />
        <el-table-column prop="quantity" label="数量" width="120" align="center" />
        <el-table-column prop="basePrice" label="单价" width="80" align="center">
          <template #default="{ row }"><del>{{ row.basePrice }}</del></template>
        </el-table-column>
        <el-table-column prop="originPrice" label="总价" width="120" align="center">
          <template #default="{ row }"><del>{{ row.originPrice }}</del></template>
        </el-table-column>
        <el-table-column prop="finalUnitPrice" label="到手单价" width="100" align="center">
          <template #default="{ row }"><span class="highlight-price">{{ row.finalUnitPrice }}</span></template>
        </el-table-column>
        <el-table-column prop="payPrice" label="到手总价" width="100" align="center">
          <template #default="{ row }"><span class="highlight-price">{{ row.payPrice }}</span></template>
        </el-table-column>
      </el-table>

      <div class="footer-container">
        <el-row :gutter="10">
          <el-col :span="24">
            <div class="price-summary-table">
              <el-descriptions
                class="margin-top"
                :column="3"
                border
              >
                <el-descriptions-item align="right" label-width="150">
                  <template #label>
                    <div class="cell-item">
                      日常优惠券
                    </div>
                  </template>
                  {{ summaryData.dialyDiscount }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      活动优惠券
                    </div>
                  </template>
                  {{ summaryData.promotionDiscount }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      限时优惠券
                    </div>
                  </template>
                  {{ summaryData.flashDiscount }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      日常到手价
                    </div>
                  </template>
                  {{ summaryData.dailyPrice }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      活动到手价
                    </div>
                  </template>
                  {{ summaryData.promotionPrice }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item" style="color: red; font-weight: bold;">
                      限时到手价
                    </div>
                  </template>
                  <span style="color: red; font-weight: bold;">{{ summaryData.flashPrice }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="0" class="footer-info">
          <el-col :span="8">
            VIP专属：
            <span>{{ title }}</span>
          </el-col>
          <el-col :span="8">
            报价时间：
            <span>{{ formatDateTime(new Date(), "YYYY-MM-DD HH:mm") }}</span>
          </el-col>
          <el-col :span="8">
            <span class="bonus">{{ (summaryData.dailyPrice * 0.03 - summaryData.bonusUsed).toFixed(2) }}</span>
            <span class="bonus">{{ (summaryData.promotionPrice * 0.03 - summaryData.bonusUsed).toFixed(2) }}</span>
            <span class="bonus">{{ (summaryData.flashPrice * 0.03 - summaryData.bonusUsed).toFixed(2) }}</span>
          </el-col>
        </el-row>
      </div>
    </div>
    <template #footer>
      <div class="footer-buttons">
        <el-button @click="close">关闭</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="printContent">打印</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="copyToClipboard">复制到粘贴板</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="saveAsImage">另存为图片</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style>
.dialog-footer {
  display: flex;
  justify-content: center;
}
.header-container {
  height: 90px;
  display: flex;
  margin-bottom: 10px;
  justify-content: center;
  align-items: center;
}
.header-container .logo {
  margin-left: 35px;
  width: 200px;
  text-align: center;
  background: #fff;
  padding: 8px;
  border-bottom-right-radius: 20px;
  border-bottom-left-radius: 20px;
}
.header-container .title {
  font-weight: bold;
  font-size: 38px;
  color: #fff;
  margin-left: 60px;
}
.header-container .title span {
  display: block;
  font-weight: normal;
  font-size: 16px;
  margin-top: 10px;
}
.header-container .intro {
  width: 600px;
  font-weight: bold;
  font-size: 35px;
  color: #fff;
  margin-left: 20px;
  line-height: 80px;
  text-align: center;
}
.header-container .intro span {
  font-size: 50px;
}
.price-summary-table {
  margin: auto;
  width: 800px;
  margin-bottom: 10px;
}

.price-summary-table table {
  width: 100%;
  border-collapse: collapse;
  background-color: #e6f1ff;
}

.price-summary-table td {
  padding: 8px;
  border: 1px solid #ccc;
  text-align: center;
}

.price-summary-table td:first-child {
  text-align: left;
  font-weight: bold;
}
.footer-container {
  background-color: #f5f7fa;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #ebeef5;
}

.highlight-price {
  color: red;
}
:deep(.highlight-price) {
  color: red;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 20px;
}
.image-slot .el-icon {
  font-size: 20px;
}
.footer-info {
  text-align: center;
  background-color: #4b8f88;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 12px;
}
.footer-buttons {
  margin: auto;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.bonus {
  margin-right: 20px;
}
.cell-item {
  font-size: 16px;
}
#print-area .el-table td.el-table__cell div {
  font-size: 16px;
}
/* 打印样式 */
@media print {
  .el-dialog__footer,
  .footer-buttons {
    display: none !important;
  }
  #print-area {
    width: 100%;
    height: auto;
  }
}
</style>

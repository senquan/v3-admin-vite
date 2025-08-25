<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import html2canvas from "html2canvas"

const emit = defineEmits(["success", "close"])

const visible = ref(false)
const orderData = ref<any>([])
const summaryData = reactive<any>({})
const title = ref("")
const platform = ref(0)
const license = ref("")
const platformBackgroundColor = ref("#4b8f88")
const type = ref(1)
const perkSum = ref(0)
const otherSum = ref(0)

const btnSubmit = reactive({
  loading: false
})

const project = computed(() => {
  return type.value === 1 ? "" : "工程"
})

function open(options = {
  data: Array<any>,
  platformId: 0,
  type: 1,
  title: "",
  license: "",
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
  license.value = options.license
  visible.value = true
  platform.value = options.platformId
  type.value = options.type
  if (options.platformId === 2 || options.platformId === 6) {
    platformBackgroundColor.value = "#a30c1a"
  } else if (options.platformId === 3 || options.platformId === 4) {
    platformBackgroundColor.value = "#3d7fff"
  } else if (options.platformId === 7) {
    platformBackgroundColor.value = "#e53953"
  }

  perkSum.value = 0
  otherSum.value = 0
  if (options.platformId !== 2 && options.platformId !== 6) {
    orderData.value.forEach((item: any) => {
      if (item.serie && (
        item.serie?.indexOf("G70") > -1
        || item.serie?.indexOf("G60") > -1
        || item.serie?.indexOf("G12") > -1
        || item.serie?.indexOf("G39") > -1
        || item.serie?.indexOf("G57") > -1
        || item.serie?.indexOf("无边") > -1
      )) {
        perkSum.value += Number(item.payPrice)
      } else {
        otherSum.value += Number(item.payPrice)
      }
    })
  }
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
    if (index === 2) {
      values = data.map((item: Record<string, any>) => {
        if (item.serie.includes("套装") || item.serie.includes("预售")) {
          const q = extractPackageQuantity(item.name) || 10
          return Number(item[column.property]) * q
        } else if (item.isBonus || item.id === "") {
          return 0
        } else {
          return Number(item[column.property])
        }
      })
    } else {
      values = data.map((item: Record<string, any>) => Number(item[column.property]))
    }
    if (index === 2 || index === 4 || index === 6) {
      if (!values.every((value: number) => Number.isNaN(value))) {
        sums[index] = Number(`${values.reduce((prev: number, curr: number) => {
          const value = Number(curr)
          if (!Number.isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)}`).toFixed(index === 2 ? 0 : 2)
        sums[index] = formatPrice(sums[index])
      }
    } else {
      sums[index] = ""
    }
  })

  return sums
}

function formatPrice(price: string) {
  return String(Math.floor(Number(price) * 10) / 10)
}

/**
 * 从"x只装"格式的字符串中提取数字
 * @param text 包含"x只装"格式的字符串，例如："10只装"
 * @returns 提取的数字，如果没有匹配则返回null
 */
function extractPackageQuantity(text: string): number | null {
  if (!text || typeof text !== "string") {
    return null
  }
  const match = text.match(/(\d+)只装/)
  if (match && match[1]) {
    return Number.parseInt(match[1], 10)
  }
  return null
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    :before-close="close"
    top="50px"
    draggable
    overflow
    width="1200px"
    :style="`background-color: ${platformBackgroundColor}`"
  >
    <div id="print-area" :style="`background-color: ${platformBackgroundColor}; padding: 10px 10px 0 10px;`">
      <div class="header-container" v-if="type === 1">
        <div class="logo"><img src="@@/assets/images/layouts/bull-logo.png"></div>
        <div class="title">
          公牛官方报价单
          <span>授权编码：{{ license }}</span>
        </div>
        <div class="intro"><span>10</span>户中国家庭  <span>7</span>户用公牛</div>
      </div>
      <div class="header-container" v-else>
        <div class="form-header" />
      </div>

      <el-table
        :data="orderData"
        :summary-method="getSummaries"
        show-summary
        border
      >
        <el-table-column prop="imageUrl" label="产品主图" width="120" align="center">
          <template #default="{ row }">
            <div class="product-image-container">
              <el-image
                style="width: 80px; height: 80px"
                :src="row.imageUrl?.replace('uploads', 'uploads/thumb/')"
                :preview-src-list="row.imageUrls"
                :preview-teleported="true"
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
        <el-table-column prop="name" label="商品信息" min-width="200" align="center">
          <template #default="{ row }">
            <div class="product-info">
              <span>{{ row.modelType }} · {{ row.serie }}</span>
              <el-text truncated>{{ row.name }} · {{ row.color }}</el-text>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="basePrice" :label="`${project}单价`" width="120" align="center">
          <template #default="{ row }"><del>{{ formatPrice(row.basePrice) }}</del></template>
        </el-table-column>
        <el-table-column prop="originPrice" :label="`${project}总价`" width="120" align="center">
          <template #default="{ row }"><del>{{ formatPrice(row.originPrice) }}</del></template>
        </el-table-column>
        <el-table-column prop="finalUnitPrice" label="到手单价" width="120" align="center">
          <template #default="{ row }"><span class="highlight-price">{{ row.finalUnitPrice }}</span></template>
        </el-table-column>
        <el-table-column prop="payPrice" label="到手总价" width="120" align="center">
          <template #default="{ row }"><span class="highlight-price">{{ formatPrice(row.payPrice) }}</span></template>
        </el-table-column>
      </el-table>

      <div class="footer-container">
        <el-row :gutter="10">
          <el-col :span="24">
            <div class="price-summary-table" :class="perkSum > 0 ? 'with-perk' : ''">
              <el-descriptions
                class="margin-top"
                :column="perkSum > 0 ? 4 : 3"
                border
              >
                <el-descriptions-item align="right" label-width="150">
                  <template #label>
                    <div class="cell-item">
                      日常优惠券
                    </div>
                  </template>
                  {{ formatPrice(summaryData.dialyDiscount) }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      活动优惠券
                    </div>
                  </template>
                  {{ formatPrice(summaryData.promotionDiscount) }}
                </el-descriptions-item>
                <el-descriptions-item v-if="perkSum > 0" align="right">
                  <template #label>
                    <div class="cell-item">
                      国补活动价
                    </div>
                  </template>
                  {{ formatPrice(perkSum.toFixed(2)) }}
                </el-descriptions-item>
                <el-descriptions-item :rowspan="2" align="right">
                  <template #label>
                    <div class="cell-item-larger">
                      {{ type === 2 ? "工程限时价" : "限时到手价" }}
                    </div>
                  </template>
                  <span class="cell-item-larger">{{ formatPrice(summaryData.flashPrice) }}</span>
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      日常到手价
                    </div>
                  </template>
                  {{ formatPrice(summaryData.dailyPrice) }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item">
                      活动到手价
                    </div>
                  </template>
                  {{ formatPrice(summaryData.promotionPrice) }}
                </el-descriptions-item>
                <el-descriptions-item v-if="perkSum > 0" align="right">
                  <template #label>
                    <div class="cell-item">
                      配件活动价
                    </div>
                  </template>
                  {{ formatPrice(otherSum.toFixed(2)) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="0" class="footer-info" :style="`background-color: ${platformBackgroundColor}`">
          <el-col :span="8">
            VIP专属：
            <span>{{ title }}</span>
          </el-col>
          <el-col :span="8">
            报价时间：
            <span>{{ formatDateTime(new Date(), "YYYY-MM-DD HH:mm") }}</span>
          </el-col>
          <el-col :span="8">
            <div v-if="(platform === 1 || platform === 7) && type === 1">
              <span class="bonus">{{ formatPrice((summaryData.dailyPrice * 0.03 - summaryData.bonusUsed).toFixed(2)) }}</span>
              <span class="bonus">{{ formatPrice((summaryData.promotionPrice * 0.03 - summaryData.bonusUsed).toFixed(2)) }}</span>
              <span class="bonus">{{ formatPrice((summaryData.flashPrice * 0.03 - summaryData.bonusUsed).toFixed(2)) }}</span>
            </div>
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

<style scoped>
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
  .form-header {
    background: url("@@/assets/images/layouts/preview-header.png") no-repeat;
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
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
  width: 480px;
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
.product-info span {
  height: 35px;
  line-height: 35px;
  display: flex;
  align-items: center;
}
.price-summary-table {
  margin: auto;
  width: 920px;
  margin-bottom: 10px;
}
.price-summary-table.with-perk {
  width: 95%;
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
  margin-top: 10px;
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
.el-table .cell {
  font-size: 16px;
}
.bonus {
  margin-right: 20px;
}
.cell-item {
  font-size: 16px;
}
.cell-item-larger {
  font-size: 38px;
  color: red;
  font-weight: bold;
}
:deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
  font-size: 25px;
}
:deep(.el-table td.el-table__cell div) {
  font-size: 25px;
  color: black;
}
.product-info {
  display: inline;
}
.product-info span {
  font-size: 21px;
  color: black;
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

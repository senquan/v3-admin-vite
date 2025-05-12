<script lang="ts" setup>
import type { ProductListData } from "../product/apis/type"
import { fetchModels as fetchIds, fetchList as fetchProducts } from "../product/apis"
import { calculateOrderPrice, createOrder, fetchOrder, updateOrder } from "./apis"

// 定义表格行的接口
interface TableRowData {
  id: string
  serie: string
  color: string
  name: string
  quantity: number
  basePrice: number
  originPrice: number
  finalUnitPrice: number
  payPrice: number
  colorOptions: Array<{ value: any, label: string }>
  backupProducts: Array<ProductListData>
}

const router = useRouter()
const platformId = ref(0)
const orderId = ref(0)
const defaultRecord: TableRowData = {
  id: "",
  serie: "",
  color: "",
  name: "",
  quantity: 0,
  basePrice: 0,
  originPrice: 0,
  finalUnitPrice: 0,
  payPrice: 0,
  colorOptions: [],
  backupProducts: []
}
const loading = ref(false)
const tableData = ref<TableRowData[]>([
  { ...defaultRecord },
  { ...defaultRecord }
])
// 添加型号选项数据
const idOptions = ref<any>([])
const searchLoading = ref(false)
const calculatedPrice = ref<any>([])
const formData = ref({
  id: 0,
  type: 0,
  platformId: 0,
  name: "",
  originPrice: 0,
  flashPrice: 0,
  dailyPrice: 0,
  promotionPrice: 0,
  products: [] as any[],
  matchLogs: [] as any[]
})
const defaultColor = ref("")
const bodyHeight = ref("calc(100vh - 450px)")

// 添加表格引用
const tableRef = ref()
const formRef = ref()

const dialyDiscount = computed(() => {
  return calculatedPrice.value?.dailyDiscount || 0
})
const dailyPrice = computed(() => {
  return calculatedPrice.value?.dailyPrice || 0
})
const promotionDiscount = computed(() => {
  return calculatedPrice.value?.promotionDiscount || 0
})
const promotionPrice = computed(() => {
  return calculatedPrice.value?.promotionPrice || 0
})
const flashDiscount = computed(() => {
  return calculatedPrice.value?.flashDiscount || 0
})
const flashPrice = computed(() => {
  return calculatedPrice.value?.flashPrice || 0
})
const bonusLeft = computed(() => {
  return calculatedPrice.value?.flashPrice * 0.03 - calculatedPrice.value?.usedBonusPoint || 0
})

const priceDetailVisible = ref(false)
const priceDetailData = ref<any>([])

const rules = {
  name: [{ required: true, message: "请输入订单名称", trigger: "blur" }]
}

// 添加行函数
function addRow() {
  tableData.value.splice(tableData.value.length - 1, 0, { ...defaultRecord })
  // 焦点设置在新加行第一个输入框
  nextTick(() => {
    const newRowIndex = tableData.value.length - 2
    const inputs = tableRef.value?.$el.querySelectorAll(".el-table__row")
    if (inputs && inputs[newRowIndex]) {
      const firstInput = inputs[newRowIndex].querySelector("input")
      if (firstInput) {
        firstInput.focus()
      }
    }
  })
}

// 修改颜色选项的处理方式
function handelSearchId(query: any, _row: TableRowData | null = null) {
  if (query === "" || query.length < 2) return
  searchLoading.value = true
  fetchIds({ keyword: query }).then((response: any) => {
    if (response.code === 0) {
      idOptions.value = response.data.models.map((model: any) => ({
        value: model.id,
        label: model.name
      }))
      searchLoading.value = false
    } else {
      ElMessage.error(`获取物料编号列表失败: ${response.message}`)
    }
  })
}

async function handelSearchProduct(modelType: string, row: any, refresh: boolean = true) {
  try {
    fetchProducts({ model: modelType }).then((response: any) => {
      if (response.code === 0) {
        const colorOpts = response.data.colors.map((color: any) => ({
          value: color.id,
          label: color.value
        }))
        if (row) {
          row.colorOptions = colorOpts
        }
        if (refresh) {
          row.backupProducts = response.data.products
          let selectedProduct = null
          if (defaultColor.value) {
            selectedProduct = row.backupProducts.find((product: any) =>
              product.color?.value === defaultColor.value
            )
          }
          if (!selectedProduct && row.backupProducts.length > 0) {
            selectedProduct = row.backupProducts[0]
          }
          if (selectedProduct) {
            fillRowAndPrice(selectedProduct, row)
          }
        }
        searchLoading.value = false
      } else {
        ElMessage.error(`获取物料编号列表失败: ${response.message}`)
      }
    })
  } catch (error) {
    console.error("获取产品信息失败:", error)
    ElMessage.error("获取产品信息失败，请重试")
    searchLoading.value = false
  }
}

async function handleIdChange(value: any, row: any) {
  const selectedOption = idOptions.value.find((option: { value: any, label: string }) => option.value === value)
  const label = selectedOption ? selectedOption.label : ""
  await handelSearchProduct(label, row)
  if (tableData.value.indexOf(row) === tableData.value.length - 2) {
    addRow()
  }
}

async function handelReloadColors(visible: boolean, row: any) {
  if (visible) {
    if (row.colorOptions.length === 0 && row.modelType !== "") {
      await handelSearchProduct(row.modelType, row, false)
    }
  }
}

function fillRowAndPrice(product: any, row: any) {
  fillRow(product, row)
  if (tableData.value.indexOf(row) === 0) {
    defaultColor.value = row.color
  }
  calculatePrice(row)
}

function fillRow(product: any, row: any) {
  row.id = product.id
  row.serie = product.modelType?.serie?.name || ""
  row.color = product.color?.value || ""
  row.name = product.name || ""
  row.imageUrls = product.imageUrls?.split(",") || []
  row.imageUrl = row.imageUrls[0] || ""
  row.basePrice = product.basePrice || "0"
  row.finalUnitPrice = product.finalUnitPrice || "0"
  row.quantity = row.quantity || 1
  row.payPrice = (Number.parseFloat(product.finalUnitPrice || "0") * Number.parseFloat(row.quantity)).toFixed(2)
}

function handleColorChange(color: number, row: any) {
  if (!row.backupProducts) return
  const selectedProduct = row.backupProducts.find((product: any) => product.colorId === color)
  if (selectedProduct) {
    fillRowAndPrice(selectedProduct, row)
    if (tableData.value.indexOf(row) === 0) {
      tableData.value.forEach((otherRow, index) => {
        if (index !== 0 && index !== tableData.value.length - 1 && otherRow.backupProducts && otherRow.backupProducts.length > 0) {
          const sameColorProduct = otherRow.backupProducts.find((product: any) =>
            product.color?.value === defaultColor.value
          )
          if (sameColorProduct) {
            fillRowAndPrice(sameColorProduct, otherRow)
          }
        }
      })
    }
  }
}

function calculatePrice(row: any) {
  if (row && row.basePrice && row.quantity) {
    row.originPrice = (Number.parseFloat(row.basePrice) * Number.parseFloat(row.quantity)).toFixed(2)
  }
  const products = tableData.value.filter((item: any) => item.quantity > 0).map((item: any) => ({
    id: item.id,
    quantity: item.quantity
  }))
  if (products.length === 0) {
    calculatedPrice.value = {}
    return
  }
  calculateOrderPrice({ platformId: platformId.value, products }).then((response: any) => {
    if (response.code === 0) {
      calculatedPrice.value = response.data
      const productsMap = response.data.products || []
      formData.value.matchLogs = response.data.matchLogs || []
      tableData.value.forEach((row: TableRowData) => {
        if (row.id) {
          const matchedProduct = productsMap.find((p: any) => p.id === Number(row.id))
          if (matchedProduct) {
            row.finalUnitPrice = Number(matchedProduct.unitPrice)
            row.payPrice = Number((row.finalUnitPrice * row.quantity).toFixed(2))
          }
        }
      })
    } else {
      ElMessage.error(`计算订单价格失败: ${response.message}`)
    }
  })
}

function priceDetail(id: number) {
  priceDetailVisible.value = true
  priceDetailData.value = []

  const matchLogsObj = formData.value.matchLogs

  // 定义类型名称映射
  const typeNames: Record<string, string> = {
    daily: "日常折扣",
    promotion: "活动折扣",
    flash: "限时折扣"
  }

  // 遍历每种类型的折扣规则
  for (const [type, logs] of Object.entries(matchLogsObj)) {
    // 过滤出当前产品的匹配记录
    const productLogs = logs.filter((log: { productId: number }) => log.productId === id)
    productLogs.forEach((log: any) => {
      priceDetailData.value.push({
        message: `${typeNames[type]}: ${log.name}`,
        value: `${(Number(log.value) * 100).toFixed(4)}%`,
        step: `${Number(log.stepPrice).toFixed(2)}`
      })
    })
  }
}

interface SpanMethodProps {
  _row?: ProductListData
  _column?: any
  rowIndex: number
  columnIndex: number
}

function arraySpanMethod({ _row, _column, rowIndex, columnIndex }: SpanMethodProps) {
  if (rowIndex === tableData.value.length - 1) {
    if (columnIndex === 0) {
      return {
        rowspan: 1,
        colspan: 11
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
  return {
    rowspan: 1,
    colspan: 1
  }
}

function getSummaries(param: any) {
  const { columns, data } = param
  const sums: (string | VNode)[] = []
  columns.forEach((column: { property: string }, index: number) => {
    if (index === 0) {
      sums[index] = h("div", { style: { textDecoration: "underline" } }, [
        "总计"
      ])
      return
    }
    const values = data.map((item: Record<string, any>) => Number(item[column.property]))
    if (index === 4 || index === 6 || index === 8) {
      if (!values.every((value: number) => Number.isNaN(value))) {
        sums[index] = Number(`${values.reduce((prev: number, curr: number) => {
          const value = Number(curr)
          if (!Number.isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)}`).toFixed(2)
      }
      if (index === 6) {
        formData.value.originPrice = Number(sums[index])
      }
    } else {
      sums[index] = ""
    }
  })

  return sums
}

function submitOrder(type: number) {
  formRef.value.validate((valid: any) => {
    if (!valid) return
    const products = tableData.value.filter((item: any) => item.id !== "" && item.quantity > 0).map((item: any) => ({
      id: item.id,
      unitPrice: item.finalUnitPrice,
      quantity: item.quantity
    }))
    if (products.length === 0) {
      ElMessage.warning("请添加商品")
      return
    }
    formData.value.type = type
    formData.value.platformId = platformId.value
    formData.value.products = products
    const request = formData.value.id > 0 ? updateOrder(formData.value.id, formData.value) : createOrder(formData.value)
    request.then((response: any) => {
      if (response.code === 0) {
        ElMessage.success("提交订单成功")
        router.push({
          path: "/quotation/quotation"
        })
      } else {
        ElMessage.error(`提交订单失败: ${response.message}`)
      }
    })
  })
}

function handleDelete(row: any) {
  const index = tableData.value.indexOf(row)
  if (index !== -1) {
    tableData.value.splice(index, 1)
  }
  calculatePrice(null)
}

// 处理数量变化
function handleQuantityChange(row: any) {
  calculatePrice(row)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.code === "Enter") {
    event.preventDefault()
    addRow()
  }
}

onMounted(() => {
  platformId.value = Number(router.currentRoute.value.query.platform)
  orderId.value = Number(router.currentRoute.value.query.id)
  if (orderId.value > 0) {
    // 获取订单详情
    fetchOrder(orderId.value).then((response: any) => {
      if (response.code === 0) {
        const order = response.data
        formData.value.id = order.id
        platformId.value = order.platformId
        formData.value.name = order.name
        tableData.value = order.items.map((item: any) => {
          const originPrice = (Number.parseFloat(item.product.basePrice) * Number.parseFloat(item.quantity)).toFixed(2)
          return {
            id: item.product.id,
            modelType: item.product.modelType?.name || "",
            serie: item.product.series?.name || "",
            color: item.product.color?.value || "",
            name: item.product.name || "",
            quantity: item.quantity || 1,
            basePrice: item.product.basePrice || "0",
            originPrice: originPrice || "0",
            finalUnitPrice: item.product.finalUnitPrice || "0",
            payPrice: item.product.payPrice || "0",
            colorOptions: []
          }
        })
        tableData.value.push(defaultRecord)
        calculatePrice(null)
      }
    })
  }
  window.addEventListener("keydown", handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown)
})
</script>

<template>
  <div class="quotation-main-container">
    <div class="header-container">
      <div class="logo"><img src="@@/assets/images/layouts/bull-logo.png"></div>
      <div class="title">
        公牛官方报价单
        <span>授权编码：2212077530202253</span>
      </div>
      <div class="intro"><span>10</span>户中国家庭  <span>7</span>户用公牛</div>
    </div>

    <div class="grid-grouping" :style="{ height: bodyHeight }">
      <el-table
        ref="tableRef"
        :data="tableData"
        :span-method="arraySpanMethod"
        border
        height="100%"
        v-loading="loading"
        :summary-method="getSummaries"
        show-summary
        style="width: 100%"
        resizable
      >
        <el-table-column prop="id" label="型号" width="150" align="center">
          <template #default="{ row, $index }">
            <template v-if="$index === tableData.length - 1">
              <div class="last-row-action">
                <el-button @click="addRow" style="width: 200px;">
                  <el-icon style="margin-right: 20px;"><Plus /></el-icon>添加商品
                </el-button>
              </div>
            </template>
            <template v-else>
              <el-select
                v-model="row.modelType"
                filterable
                default-first-option
                remote
                placeholder="请输入编号搜索"
                :remote-method="handelSearchId"
                :loading="searchLoading"
                @change="(val) => handleIdChange(val, row)"
              >
                <el-option
                  v-for="item in idOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </el-select>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="serie" label="系列" width="120" align="center" />
        <el-table-column prop="color" label="颜色" width="120" align="center">
          <template #default="{ row, $index }">
            <template v-if="$index !== tableData.length - 1">
              <el-select
                v-model="row.color"
                placeholder="选择颜色"
                @change="(val) => handleColorChange(val, row)"
                @visible-change="(val) => handelReloadColors(val, row)"
                style="width: 100%"
              >
                <el-option
                  v-for="item in row.colorOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </el-select>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="imageUrl" label="产品主图" width="100" align="center">
          <template #default="{ row }">
            <div class="product-image-container">
              <el-image
                style="width: 80px; height: 80px"
                :src="row.imageUrl"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                :preview-src-list="row.imageUrls"
                show-progress
                :initial-index="0"
                fit="cover"
                :preview-teleported="true"
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
        <el-table-column prop="name" label="名称" min-width="200" align="center" />
        <el-table-column prop="quantity" label="数量" width="120" align="center">
          <template #default="{ row, $index }">
            <template v-if="$index !== tableData.length - 1">
              <el-input-number
                v-model="row.quantity"
                controls-position="right"
                :min="1"
                :precision="0"
                @change="handleQuantityChange(row)"
                style="width: 100%;"
              />
            </template>
          </template>
        </el-table-column>
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
          <template #default="{ row }"><span class="highlight-price" style="cursor: pointer;" @click="priceDetail(row.id)">{{ row.payPrice }}</span></template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button @click="handleDelete(row)" link>
              <el-icon :size="18" color="red"><CloseBold /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="footer-container">
        <div class="footer-action">
          <div class="price-summary-table">
            <el-descriptions
              class="margin-top"
              :column="3"
              border
            >
              <el-descriptions-item
                :rowspan="2"
                :width="250"
                align="center"
              />
              <el-descriptions-item align="right">
                <template #label>
                  <div class="cell-item">
                    <el-icon style="margin-right: 5px;"><PriceTag /></el-icon>
                    日常优惠券
                  </div>
                </template>
                {{ dialyDiscount }}
              </el-descriptions-item>
              <el-descriptions-item align="right">
                <template #label>
                  <div class="cell-item">
                    <el-icon style="margin-right: 5px;"><Money /></el-icon>
                    日常到手价
                  </div>
                </template>
                {{ dailyPrice }}
              </el-descriptions-item>
              <el-descriptions-item align="right">
                <template #label>
                  <div class="cell-item">
                    <el-icon style="margin-right: 5px;"><PriceTag /></el-icon>
                    活动优惠券
                  </div>
                </template>
                {{ promotionDiscount }}
              </el-descriptions-item>
              <el-descriptions-item align="right">
                <template #label>
                  <div class="cell-item">
                    <el-icon style="margin-right: 5px;"><Money /></el-icon>
                    活动到手价
                  </div>
                </template>
                {{ promotionPrice }}
              </el-descriptions-item>
              <el-descriptions-item
                :width="250"
                label="赠品剩余额度"
                align="center"
              >
                {{ bonusLeft.toFixed(2) }}
              </el-descriptions-item>
              <el-descriptions-item align="right">
                <template #label>
                  <div class="cell-item">
                    <el-icon style="margin-right: 5px;"><Timer /></el-icon>
                    限时活动
                  </div>
                </template>
                {{ flashDiscount }}
              </el-descriptions-item>
              <el-descriptions-item align="right">
                <template #label>
                  <div class="cell-item" style="color: red; font-weight: bold;">
                    <el-icon style="margin-right: 5px;"><Money /></el-icon>
                    限时到手价
                  </div>
                </template>
                <span style="color: red; font-weight: bold;">{{ flashPrice }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
          >
            <el-form-item label="订单名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入订单名称" />
            </el-form-item>
            <el-form-item align="right">
              <el-button type="primary" @click="submitOrder(0)">暂存草稿</el-button>
              <el-button type="primary" @click="submitOrder(1)">提交订单</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <div class="footer-container">
      <el-dialog v-model="priceDetailVisible" title="计价详情" width="600">
        <el-table :data="priceDetailData" empty-text="没有优惠">
          <el-table-column property="message" label="规则" min-width="300" />
          <el-table-column property="value" label="折扣值" width="100" />
          <el-table-column property="step" label="折后价" width="100" />
        </el-table>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
.quotation-main-container {
  background-color: #4b8f88;
  padding: 20px;
}
.header-container {
  height: 90px;
  display: inline-flex;
  margin-bottom: 10px;
  .logo {
    margin-left: 35px;
    width: 200px;
    text-align: center;
    background: #fff;
    padding: 8px;
    border-bottom-right-radius: 20px;
    border-bottom-left-radius: 20px;
  }
  .title {
    font-weight: bold;
    font-size: 38px;
    color: #fff;
    margin-left: 60px;
    span {
      display: block;
      font-weight: normal;
      font-size: 16px;
      margin-top: 20px;
    }
  }
  .intro {
    width: 600px;
    font-weight: bold;
    font-size: 35px;
    color: #fff;
    margin-left: 20px;
    line-height: 80px;
    text-align: center;
    span {
      font-size: 50px;
    }
  }
}

.last-row-action {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 10px;
  width: 100%;
}

.footer-container {
  background-color: #f5f7fa;
  padding: 10px;
  margin-top: 10px;
  border: 1px solid #ebeef5;
}

.footer-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  padding: 10px;
}

.footer-action span {
  font-size: 16px;
  font-weight: bold;
}

.price-summary-table {
  width: 80%;
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

.final-price {
  color: red;
  font-weight: bold;
  font-size: 18px;
  vertical-align: middle;
  text-align: center;
}

.final-price span {
  font-size: 24px;
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
</style>

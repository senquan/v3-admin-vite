<script lang="ts" setup>
import type { ProductListData } from "../product/apis/type"
import type { PromotionListData, RulesWithPromotionType } from "../promotion/apis/type"
import type { OrderDetailResponseData, OrderItemsData } from "./apis/type"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { initPromotionRules, calculateOrderPrice as localCalculatePrice } from "@@/utils/pricing"
import { fetchModels as fetchIds, fetchList as fetchProducts } from "../product/apis"
import { fetchPromotionRules } from "../promotion/apis"
import PreviewForm from "./_preview.vue"
import { createOrder, fetchOrder, updateOrder } from "./apis"

// 定义表格行的接口
interface TableRowData {
  rowId: string
  id: string
  modelType: string
  modelTypeId: string
  modelOld: string
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
  colorEditable: false
  popoverVisible: boolean
  isBonus: boolean
  imageUrls: string[]
  imageUrl: string
}

const EMPTY_COLOR_NAME = "[默认色]"
const PROMOTION_TYPE_DAILY = 1
const PROMOTION_TYPE_PROMOTION = 2
const PROMOTION_TYPE_FLASH = 3

const systemParamsStore = useSystemParamsStore()
const bonusSeriesIds = computed(() => systemParamsStore.getNumberArrayParam("bonus_series_ids"))

const router = useRouter()
const platformId = ref(0)
const orderId = ref(0)
const defaultRecord: TableRowData = {
  rowId: "",
  id: "",
  modelType: "",
  modelTypeId: "",
  modelOld: "",
  serie: "",
  color: "",
  name: "",
  quantity: 0,
  basePrice: 0,
  originPrice: 0,
  finalUnitPrice: 0,
  payPrice: 0,
  colorOptions: [],
  backupProducts: [],
  colorEditable: false,
  popoverVisible: false,
  isBonus: false,
  imageUrls: [],
  imageUrl: ""
}
const loading = ref(false)
const tableData = ref<TableRowData[]>([
  { ...defaultRecord },
  { ...defaultRecord }
])
// 添加型号选项数据
const modelOptions = ref<any>([{ value: "", label: "" }])
const searchLoading = ref(false)
const calculatedPrice = ref<any>({})
const rulesInitialized = ref(false)
const calculateQuested = ref<boolean>(false)
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
const bodyHeight = ref("calc(100vh - 310px)")
const ignoreBlur = ref(false) // 忽略离焦事件

// 添加表格引用
const tableRef = ref()
const formRef = ref()
const oldInputRef = ref()
const previewFormRef = ref()
const previewFormVisible = ref(false)
const onFocusQuantity = ref("")
const currentRow = ref<any>(null)

// 列选中功能
const selectedCells = ref<Array<{ rowIndex: number, columnIndex: number }>>([])
const hoveredCell = ref<{ rowIndex: number, columnIndex: number } | null>(null)
const lastSelectedCell = ref<{ rowIndex: number, columnIndex: number } | null>(null)
const copiedValue = ref("")

const dialyDiscount = computed(() => {
  return calculatedPrice.value?.resultMap?.get(PROMOTION_TYPE_DAILY)?.discount || 0
})
const dailyPrice = computed(() => {
  return Number((calculatedPrice.value?.totalBasePrice - dialyDiscount.value).toFixed(2))
})
const promotionDiscount = computed(() => {
  return calculatedPrice.value?.resultMap?.get(PROMOTION_TYPE_PROMOTION)?.discount || 0
})
const promotionPrice = computed(() => {
  return Number((calculatedPrice.value?.totalBasePrice - promotionDiscount.value).toFixed(2))
})
const flashDiscount = computed(() => {
  return calculatedPrice.value?.resultMap?.get(PROMOTION_TYPE_FLASH)?.discount || 0
})
const flashPrice = computed(() => {
  return Number((Math.min(dailyPrice.value, promotionPrice.value) - flashDiscount.value).toFixed(2))
})
const bonusUsed = computed(() => {
  return calculatedPrice.value?.usedBonusPoint || 0
})
const bonusLeft = computed(() => {
  return flashPrice.value * 0.03 - calculatedPrice.value?.usedBonusPoint || 0
})

const priceDetailVisible = ref(false)
const priceDetailData = ref<any>([])

const replaceFormVisible = ref(false)
const replaceForm = ref({
  old: "",
  new: ""
})

const rules = {
  name: [{ required: true, message: "请输入订单名称", trigger: "blur" }]
}

const modelCache = ref<Map<string, any>>(new Map())
const cacheInitialized = ref(false)
const cacheExpiry = 30 * 60 * 1000 // 30分钟缓存过期
const lastCacheTime = ref(0)
const productCache = ref<Map<number, ProductListData>>(new Map())

// 添加行函数
function addRow() {
  const newRow = { ...defaultRecord, rowId: getRowIdentity() }
  tableData.value.splice(tableData.value.length - 1, 0, newRow)
  nextTick(() => {
    const newRowIndex = tableData.value.length - 2
    focusInput(newRowIndex)
  })
}

function addRowNext(row: any) {
  const newRowIndex = tableData.value.indexOf(row)
  const newRow = { ...defaultRecord, rowId: getRowIdentity() }
  tableData.value.splice(newRowIndex, 0, newRow)
  nextTick(() => {
    focusInput(newRowIndex)
  })
}

function focusInput(index: number) {
  const inputs = tableRef.value?.$el.querySelectorAll(".el-table__row")
  if (inputs && inputs[index]) {
    const firstInput = inputs[index].querySelector("input")
    if (firstInput) {
      firstInput.focus()
    }
  }
}

function handelSearchId(query: any, row: TableRowData | null = null) {
  if (query === "" || query.length < 2) return
  if (row != null) row.popoverVisible = true
  if (!cacheInitialized.value || Date.now() - lastCacheTime.value > cacheExpiry) {
    // 缓存未初始化或已过期，使用原有的远程搜索
    searchLoading.value = true
    fetchIds({ keyword: query }).then((response: any) => {
      if (response.code === 0) {
        modelOptions.value = response.data.models.map((model: any) => ({
          value: model.id,
          label: model.name
        }))
        searchLoading.value = false
      } else {
        ElMessage.error(`获取物料编号列表失败: ${response.message}`)
      }
    })
    initModelCache()
    return
  }

  searchLoading.value = true
  const results: any[] = []
  modelCache.value.forEach((model, id) => {
    if (model.name.toLowerCase().includes(query.toLowerCase())) {
      results.push({
        value: id,
        label: model.name
      })
    }
  })

  modelOptions.value = results
  searchLoading.value = false
  if (modelOptions.value.length === 0) {
    modelOptions.value = [{ value: "", label: "无匹配结果" }]
  }
}

function handelModelTypeBlur(row: any) {
  if (!ignoreBlur.value && modelOptions.value.length > 0) {
    const matchedModel = modelOptions.value.find((option: { label: string }) =>
      option.label.toLowerCase() === row.modelType.toLowerCase()
    )
    if (matchedModel) {
      handleIdChange(matchedModel.value, row)
    } else {
      row.modelType = row.modelOld
    }
  }
  ignoreBlur.value = false
}

async function handelSearchProduct(modelType: string, row: any, refresh: boolean = true) {
  try {
    fetchProducts({ model: modelType }).then((response: any) => {
      if (response.code === 0) {
        const colorOpts = response.data.colors.map((color: any) => ({
          value: color.id,
          label: color.value || EMPTY_COLOR_NAME
        }))
        if (row) {
          row.colorOptions = colorOpts
        }
        response.data.products.forEach((product: ProductListData) => {
          productCache.value.set(product.id, product)
        })
        row.backupProducts = response.data.products.sort((a: any, b: any) => {
          if (a.color === null) return -1
          if (b.color === null) return 1
          return 0
        })
        if (refresh) {
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
    ElMessage.error(`获取产品信息失败，请重试：${error}`)
    searchLoading.value = false
  }
}

async function handleIdChange(value: any, row: any) {
  const selectedOption = modelOptions.value.find((option: { value: any, label: string }) => option.value === value)
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
  row.modelType = product.modelType?.name || ""
  row.modelOld = product.modelType?.name || ""
  row.serie = product.modelType?.serie?.name || ""
  row.color = product.color?.value || ""
  row.name = product.name || ""
  row.imageUrls = product.imageUrls?.split(",") || []
  row.imageUrl = row.imageUrls[0] || ""
  row.isBonus = bonusSeriesIds.value.includes(product.modelType?.serie?.id)
  row.basePrice = product.basePrice || "0"
  row.finalUnitPrice = product.finalUnitPrice || "0"
  row.quantity = row.quantity || 1
  row.payPrice = (Number.parseFloat(product.finalUnitPrice || "0") * Number.parseFloat(row.quantity)).toFixed(2)
}

function handleColorChange(color: number, row: any) {
  row.colorEditable = false
  if (!row.backupProducts) return
  let c: number | null = color
  if (!color) c = null
  const selectedProduct = row.backupProducts.find((product: any) => product.colorId === c)
  if (selectedProduct) {
    fillRowAndPrice(selectedProduct, row)
    if (tableData.value.indexOf(row) === 0) {
      tableData.value.forEach((otherRow, index) => {
        if (index !== 0 && index !== tableData.value.length - 1 && otherRow.backupProducts && otherRow.backupProducts.length > 0) {
          const sameColorProduct = otherRow.backupProducts.find((product: any) =>
            product.color?.value === (defaultColor.value === "" ? undefined : defaultColor.value)
          )
          if (sameColorProduct) {
            fillRowAndPrice(sameColorProduct, otherRow)
          }
        }
      })
    }
  }
}

function handleReplace() {
  replaceFormVisible.value = true
  setTimeout(() => {
    oldInputRef.value?.input?.focus()
  }, 200)
}

function batchChangeModelType() {
  replaceFormVisible.value = false
  const search = replaceForm.value.old.toUpperCase()
  const replace = replaceForm.value.new.toUpperCase()
  if (!search) return
  for (const row of tableData.value) {
    if (row.modelType) {
      if (row.modelType.includes(search)) {
        const newModel = row.modelType.replace(search, replace)
        modelCache.value.forEach((model) => {
          if (model.name === newModel) {
            row.modelType = model.name
            handelSearchProduct(row.modelType, row)
          }
        })
      }
    }
  }
  replaceForm.value.old = ""
  replaceForm.value.new = ""
}

function calculatePrice(row: any) {
  if (row && row.basePrice && row.quantity) {
    row.originPrice = (Number.parseFloat(row.basePrice) * Number.parseFloat(row.quantity)).toFixed(2)
  }

  if (!rulesInitialized.value) {
    calculateQuested.value = true
    return
  }

  const products = tableData.value.filter((item: any) => item && item.quantity > 0).map((item: any) => {
    const product = productCache.value.get(Number(item.id))
    if (!product) return null
    return {
      ...product,
      quantity: item.quantity
    }
  }).filter(product => product !== null)

  if (products.length === 0) {
    calculatedPrice.value = {}
    return
  }

  calculatedPrice.value = localCalculatePrice({ products })
  if (calculatedPrice.value && calculatedPrice.value.resultMap) {
    tableData.value.forEach((row: TableRowData) => {
      if (row.id) {
        const matchedProduct = calculatedPrice.value?.products.find((p: any) => p.id === Number(row.id))
        if (matchedProduct) {
          let minPrice = Math.min(matchedProduct.priceMap.get(PROMOTION_TYPE_DAILY)?.price || 0, matchedProduct.priceMap.get(PROMOTION_TYPE_PROMOTION)?.price || 0)
          const flashDiscount = Number(((matchedProduct.priceMap.get(PROMOTION_TYPE_FLASH)?.discount || 0) / matchedProduct.quantity).toFixed(2))
          if (minPrice === 0) minPrice = Number(matchedProduct.unitPrice)
          row.finalUnitPrice = Number((minPrice - flashDiscount).toFixed(2))
          row.payPrice = Number((row.finalUnitPrice * row.quantity).toFixed(2))
        }
      }
    })
    formData.value.matchLogs = calculatedPrice.value.resultMap
  }
}

function priceDetail(id: number) {
  priceDetailVisible.value = true
  priceDetailData.value = []

  const matchLogsObj = formData.value.matchLogs
  const typeNames: Record<number, string> = {
    [PROMOTION_TYPE_DAILY]: "日常折扣",
    [PROMOTION_TYPE_PROMOTION]: "活动折扣",
    [PROMOTION_TYPE_FLASH]: "限时折扣"
  }

  // 检查 matchLogsObj 是否为 Map
  if (matchLogsObj instanceof Map) {
    // 使用 Map 的 forEach 方法遍历
    matchLogsObj.forEach((value, type) => {
      const productLogs = value.matchLogs.get(Number(id))
      if (!productLogs) return
      productLogs.forEach((log: any) => {
        priceDetailData.value.push({
          message: `${typeNames[type]}: ${log.name}`,
          value: `${(Number(log.value) * 100).toFixed(4)}%`,
          step: `${Number(log.stepPrice).toFixed(2)}`
        })
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
      sums[index] = h("div", [
        "总计"
      ])
      return
    }
    let values
    if (index === 4) {
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
    if (index === 4 || index === 6 || index === 8) {
      if (!values.every((value: number) => Number.isNaN(value))) {
        sums[index] = Number(`${values.reduce((prev: number, curr: number) => {
          const value = Number(curr)
          if (!Number.isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)}`).toFixed(index === 4 ? 0 : 2)
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

function handleBlurQuantity() {
  onFocusQuantity.value = ""
}

function handleFocusQuantity(row: any) {
  onFocusQuantity.value = row.rowId
}

function handleKeyDown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && (event.key === "c" || event.code === "KeyC")) {
    if (selectedCells.value.length === 1) {
      event.preventDefault()
      copySelectedCells()
    }
    return
  }
  if ((event.ctrlKey || event.metaKey) && (event.key === "v" || event.code === "KeyV")) {
    if (selectedCells.value.length > 0) {
      event.preventDefault()
      pasteSelectedCells()
    }
    return
  }

  if (event.key === "Enter" || event.code === "Enter") {
    if (replaceFormVisible.value) {
      event.preventDefault()
      batchChangeModelType()
      return
    }
    event.preventDefault()
    if (onFocusQuantity.value) {
      const currentRowIndex = tableData.value.findIndex((row: any) => row.rowId === onFocusQuantity.value)
      if (currentRowIndex !== -1 && currentRowIndex < tableData.value.length - 2) {
        const nextRowIndex = currentRowIndex + 1
        nextTick(() => {
          const quantityInputs = tableRef.value.$el.querySelectorAll(".el-input-number input")
          if (quantityInputs && quantityInputs[nextRowIndex]) {
            quantityInputs[nextRowIndex].focus()
            quantityInputs[nextRowIndex].select()
          }
        })
      } else {
        addRow()
      }
      onFocusQuantity.value = ""
    } else {
      addRow()
    }
  }

  // 如果没有选中单元格，不处理方向键
  if (selectedCells.value.length === 0 || !lastSelectedCell.value) return

  // 方向键导航
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    event.preventDefault()

    let { rowIndex, columnIndex } = lastSelectedCell.value

    switch (event.key) {
      case "ArrowUp":
        rowIndex = Math.max(0, rowIndex - 1)
        break
      case "ArrowDown":
        rowIndex = Math.min(tableData.value.length - 2, rowIndex + 1)
        break
      case "ArrowLeft":
        columnIndex = Math.max(0, columnIndex - 1)
        break
      case "ArrowRight":
        columnIndex = Math.min(9, columnIndex + 1) // 假设有10列，根据实际情况调整
        break
    }

    // 如果按住Shift键，则扩展选择范围
    if (event.shiftKey) {
      // 清除之前的选择
      selectedCells.value = []

      // 计算选择范围
      const startRow = Math.min(lastSelectedCell.value.rowIndex, rowIndex)
      const endRow = Math.max(lastSelectedCell.value.rowIndex, rowIndex)
      const startCol = Math.min(lastSelectedCell.value.columnIndex, columnIndex)
      const endCol = Math.max(lastSelectedCell.value.columnIndex, columnIndex)

      // 选择范围内的所有单元格
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (r < tableData.value.length - 1) { // 排除最后一行
            selectedCells.value.push({ rowIndex: r, columnIndex: c })
          }
        }
      }
    } else {
      // 否则只选中当前单元格
      const newCell = { rowIndex, columnIndex }
      selectedCells.value = [newCell]
      lastSelectedCell.value = newCell
    }
  }
}

function copySelectedCells() {
  // 获取选中单元格的数据
  const cell = selectedCells.value[0]
  const row = tableData.value[cell.rowIndex]

  // 根据列索引获取对应的属性
  const columnProps = ["modelType", "serie", "color", "name", "quantity", "basePrice", "originPrice", "finalUnitPrice", "payPrice"]
  const prop = columnProps[cell.columnIndex]

  if (prop === "color") {
    if (typeof row.color === "number" && row.colorOptions.length > 0) {
      const selectedColor = row.colorOptions.find((color: any) => color.value === row.color)
      if (selectedColor !== undefined) {
        copiedValue.value = selectedColor.label
      }
    } else {
      if (row.color === "") {
        copiedValue.value = EMPTY_COLOR_NAME
      } else {
        copiedValue.value = row.color
      }
    }
    ElMessage.success(`已复制单元格内容: ${copiedValue.value}`)
  }
}

async function pasteSelectedCells() {
  // 创建一个 Promise 数组来跟踪所有异步操作
  const promises = selectedCells.value.map(async (cell) => {
    const row = tableData.value[cell.rowIndex]

    const columnProps = ["modelType", "serie", "color", "name", "quantity", "basePrice", "originPrice", "finalUnitPrice", "payPrice"]
    const prop = columnProps[cell.columnIndex]

    if (prop === "color" && copiedValue.value) {
      if (row.colorOptions.length === 0 && row.modelType) {
        await handelReloadColors(true, row)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      const matchedColor = row.colorOptions.find((option: any) =>
        option.label.toLowerCase() === copiedValue.value.toLowerCase()
      )
      if (matchedColor) {
        row.color = matchedColor.value
        handleColorChange(matchedColor.value, row)
      } else {
        ElMessage.warning(`未找到匹配的颜色: ${copiedValue.value}`)
      }
    }
  })

  // 等待所有操作完成
  await Promise.all(promises)
  calculatePrice(null)
}

function handleCellClick(row: any, column: any, _cell: any, event: any) {
  if (currentRow.value && (row.rowId !== currentRow.value.rowId || column.property !== "color")) {
    currentRow.value.colorEditable = false
    currentRow.value = null
  }

  // 只处理颜色一列
  if (column.property !== "color") return

  // 最后一行不参与选中
  if (tableData.value.indexOf(row) === tableData.value.length - 1) {
    return
  }

  const rowIndex = tableData.value.findIndex(item => item.rowId === row.rowId)
  const columnIndex = event.target.parentElement.cellIndex || 2
  const cellInfo = { rowIndex, columnIndex }
  // Ctrl/Command键多选不连续单元格
  if (event.ctrlKey || event.metaKey) {
    const existingIndex = selectedCells.value.findIndex(
      cell => cell.rowIndex === rowIndex && cell.columnIndex === columnIndex
    )

    if (existingIndex >= 0) {
      // 如果已选中，则取消选中
      selectedCells.value.splice(existingIndex, 1)
    } else {
      // 否则添加到选中数组
      selectedCells.value.push(cellInfo)
      lastSelectedCell.value = cellInfo
    }
  } else if (event.shiftKey && lastSelectedCell.value) {
    // 清除之前的选择
    selectedCells.value = []

    // 计算选择范围
    const startRow = Math.min(lastSelectedCell.value.rowIndex, rowIndex)
    const endRow = Math.max(lastSelectedCell.value.rowIndex, rowIndex)
    const startCol = Math.min(lastSelectedCell.value.columnIndex, columnIndex)
    const endCol = Math.max(lastSelectedCell.value.columnIndex, columnIndex)

    // 选择范围内的所有单元格
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < tableData.value.length - 1) { // 排除最后一行
          selectedCells.value.push({ rowIndex: r, columnIndex: c })
        }
      }
    }
  } else {
    selectedCells.value = [cellInfo]
    lastSelectedCell.value = cellInfo
  }
}

function handleCellDoubleClick(row: any, column: any, _cell: any, _event: any) {
  if (column.property === "color") {
    currentRow.value = row
    row.colorEditable = true
  }
}

function handleCellMouseEnter(row: any, column: any, cell: any, event: any) {
  const rowIndex = tableData.value.findIndex(item => item.rowId === row.rowId)
  const columnIndex = event.target.parentElement.cellIndex

  hoveredCell.value = { rowIndex, columnIndex }
}

function handleCellMouseLeave() {
  hoveredCell.value = null
}

function isCellSelected(rowIndex: number, columnIndex: number): boolean {
  return selectedCells.value.some(
    cell => cell.rowIndex === rowIndex && cell.columnIndex === columnIndex
  )
}

function isCellHovered(rowIndex: number, columnIndex: number): boolean {
  return hoveredCell.value !== null
    && hoveredCell.value.rowIndex === rowIndex
    && hoveredCell.value.columnIndex === columnIndex
}

function cellClassName({ row, _column, rowIndex, columnIndex }: any) {
  // 最后一行不参与选中
  if (rowIndex === tableData.value.length - 1) {
    return ""
  }

  // 获取实际的行索引（考虑到可能有删除行的情况）
  const actualRowIndex = tableData.value.findIndex(item => item.rowId === row.rowId)

  if (isCellSelected(actualRowIndex, columnIndex)) {
    return "selected-cell"
  } else if (isCellHovered(actualRowIndex, columnIndex)) {
    return "hovered-cell"
  }
  return ""
}

function orderPreview() {
  previewFormRef.value?.open({
    data: tableData.value,
    title: formData.value?.name || "",
    summary: {
      dialyDiscount,
      dailyPrice,
      promotionDiscount,
      promotionPrice,
      flashDiscount,
      flashPrice,
      bonusUsed
    }
  })
  previewFormVisible.value = true
}

async function initModelCache() {
  if (cacheInitialized.value && Date.now() - lastCacheTime.value < cacheExpiry) {
    return true
  }
  try {
    const response = await fetchIds({ type: "all" })
    if (response.code === 0 && response.data.models) {
      modelCache.value.clear()
      response.data.models.forEach((model: any) => {
        modelCache.value.set(model.id, {
          id: model.id,
          name: model.name
        })
      })
      cacheInitialized.value = true
      lastCacheTime.value = Date.now()
      console.log(`已缓存 ${modelCache.value.size} 个型号`)
      return true
    }
    return false
  } catch (error) {
    console.error("初始化型号缓存失败:", error)
    ElMessage.error("初始化型号数据失败，将使用实时搜索")
    return false
  }
}

onMounted(async () => {
  platformId.value = Number(router.currentRoute.value.query.platform)
  orderId.value = Number(router.currentRoute.value.query.id)
  if (orderId.value > 0) {
    // 获取订单详情
    fetchOrder(orderId.value).then((response: OrderDetailResponseData) => {
      if (response.code === 0) {
        const order = response.data
        formData.value.id = order.id
        platformId.value = order.platformId
        formData.value.name = order.name
        tableData.value = order.items.map((item: OrderItemsData) => {
          const product = item.product
          const originPrice = Number((product.basePrice * item.quantity).toFixed(2))
          productCache.value.set(product.id, product)
          const images = product.imageUrls?.split(",") || []
          return {
            rowId: getRowIdentity(),
            id: String(product.id),
            modelType: product.modelType?.name || "",
            modelTypeId: product.modelType?.name || "",
            modelOld: product.modelType?.name || "",
            serie: product.modelType?.serie?.name || "",
            color: product.color?.value || "",
            name: product.name || "",
            quantity: item.quantity || 1,
            basePrice: product.basePrice || 0,
            originPrice: originPrice || 0,
            finalUnitPrice: 0,
            payPrice: 0,
            colorOptions: [],
            backupProducts: [],
            colorEditable: false,
            popoverVisible: false,
            isBonus: bonusSeriesIds.value.includes(product.modelType?.serie?.id),
            imageUrls: images,
            imageUrl: images.length > 0 ? images[0] : ""
          }
        })
        tableData.value.push({ ...defaultRecord, rowId: getRowIdentity() })
        tableData.value.forEach((row: any) => {
          handelReloadColors(true, row)
        })
        calculatePrice(null)
      }
    })
  } else {
    // 初始化两行数据，确保每行都有唯一的 rowId
    tableData.value = [
      { ...defaultRecord, rowId: getRowIdentity() },
      { ...defaultRecord, rowId: getRowIdentity() }
    ]
  }
  await initModelCache()

  try {
    fetchPromotionRules({ platformId: platformId.value }).then((response: any) => {
      if (response.code === 0) {
        const roles = response.data.promotions.flatMap((promotion: PromotionListData) => {
          return promotion.rules.map((rule: RulesWithPromotionType) => ({
            ...rule,
            promotionType: promotion.type
          }))
        })
        initPromotionRules(roles)
        rulesInitialized.value = true
        if (calculateQuested.value) {
          calculatePrice(null)
        }
      }
    })
  } catch (error) {
    console.error("获取促销规则失败:", error)
  }

  window.addEventListener("keydown", handleKeyDown)
})

function getRowIdentity() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown)
})

function handleModelSelect(option: any, row: any) {
  ignoreBlur.value = true
  row.modelTypeId = option.value
  row.modelType = option.label
  row.popoverVisible = false
  if (option.value === "") {
    row.modelType = row.modelOld
    ElMessage.warning("型号无匹配结果")
    return
  }
  handleIdChange(option.value, row)
}

function handleModelEnter(event: Event | KeyboardEvent, row: any) {
  event.stopPropagation()
  event.preventDefault()
  if (modelOptions.value.length > 0) {
    handleModelSelect(modelOptions.value[0], row)
  }
}
</script>

<template>
  <div class="quotation-main-container">
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
        @cell-click="handleCellClick"
        @cell-dblclick="handleCellDoubleClick"
        @cell-mouse-enter="handleCellMouseEnter"
        @cell-mouse-leave="handleCellMouseLeave"
        :cell-class-name="cellClassName"
      >
        <el-table-column prop="id" label="型号" width="150" align="center">
          <template #default="{ row, $index }">
            <template v-if="$index === tableData.length - 1">
              <div class="last-row-action">
                <el-button @click="addRow" style="width: 200px;">
                  <el-icon style="margin-right: 20px;"><Plus /></el-icon>添加商品
                </el-button>
                <el-button type="primary" @click="handleReplace">批量修改型号</el-button>
              </div>
            </template>
            <template v-else>
              <el-popover
                placement="bottom"
                :width="150"
                trigger="click"
                v-model:visible="row.popoverVisible"
                popper-class="model-search-popover"
              >
                <template #reference>
                  <el-input
                    v-model="row.modelType"
                    placeholder="请输入型号搜索"
                    @input="(val) => handelSearchId(val, row)"
                    @blur="() => handelModelTypeBlur(row)"
                    @keydown.enter="(e: Event | KeyboardEvent) => handleModelEnter(e, row)"
                  />
                </template>
                <div class="model-options">
                  <div
                    v-for="item in modelOptions"
                    :key="item.value"
                    class="model-option"
                    @click="handleModelSelect(item, row)"
                    @mousedown.prevent
                  >
                    {{ item.label }}
                  </div>
                  <div v-if="searchLoading" class="model-option loading">
                    <el-icon class="is-loading"><loading /></el-icon> 搜索中...
                  </div>
                  <div v-if="modelOptions.length === 0 && !searchLoading" class="model-option empty">
                    无匹配结果
                  </div>
                </div>
              </el-popover>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="serie" label="系列" width="120" align="center" />
        <el-table-column prop="color" label="颜色" width="120" align="center">
          <template #default="{ row, $index }">
            <template v-if="$index !== tableData.length - 1">
              {{ row.colorEditable ? "" : row.colorOptions.find((item: any) => item.value === row.color)?.label || row.color }}
              <el-select
                v-if="row.colorEditable"
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
                @blur="handleBlurQuantity"
                @focus="handleFocusQuantity(row)"
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
            <el-button @click="addRowNext(row)" link>
              <el-icon :size="18" color="red"><Plus /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="footer-container">
        <el-row :gutter="10">
          <el-col :span="18">
            <div class="price-summary-table">
              <el-descriptions
                class="margin-top"
                :column="2"
                border
              >
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
          </el-col>
          <el-col :span="6">
            <el-form
              ref="formRef"
              :model="formData"
              :rules="rules"
            >
              <el-form-item label="VIP专属:" prop="name">
                <el-input v-model="formData.name" placeholder="请输入订单名称" />
              </el-form-item>
              <el-form-item>
                <div class="button-container">
                  <el-button type="success" @click="orderPreview()">报价预览</el-button>
                  <el-button type="primary" @click="submitOrder(0)">暂存草稿</el-button>
                  <el-button type="primary" @click="submitOrder(1)">提交订单</el-button>
                </div>
              </el-form-item>
              <div class="bonus-item">
                赠品剩余额度 {{ bonusLeft.toFixed(2) }}
              </div>
            </el-form>
          </el-col>
        </el-row>
      </div>
    </div>

    <div>
      <el-dialog v-model="priceDetailVisible" title="计价详情" width="600">
        <el-table :data="priceDetailData" empty-text="没有优惠">
          <el-table-column property="message" label="规则" min-width="300" />
          <el-table-column property="value" label="折扣值" width="100" />
          <el-table-column property="step" label="折后价" width="100" />
        </el-table>
      </el-dialog>
    </div>

    <el-dialog v-model="replaceFormVisible" title="批量修改型号" width="500">
      <el-form :model="replaceForm">
        <el-form-item label="关键字" label-width="100">
          <el-input v-model="replaceForm.old" ref="oldInputRef" />
        </el-form-item>
        <el-form-item label="替换为" label-width="100">
          <el-input v-model="replaceForm.new" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="replaceFormVisible = false">取消</el-button>
          <el-button type="primary" @click="batchChangeModelType">
            替换
          </el-button>
        </div>
      </template>
    </el-dialog>

    <PreviewForm
      ref="previewFormRef"
      @close="previewFormVisible = false"
    />
  </div>
</template>

<style scoped>
.quotation-main-container {
  padding: 20px;
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

.price-summary-table {
  margin: auto;
  width: 50%;
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

:deep(.el-descriptions__content) {
  background-color: var(--el-descriptions-item-bordered-label-background);
}

.button-container {
  width: 100%;
  text-align: center;
}

.bonus-item {
  text-align: center;
  font-size: 14px;
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

<style>
.el-table .selected-cell {
  border: 2px solid #409eff !important;
  background-color: rgba(64, 158, 255, 0.1) !important;
  box-sizing: border-box;
}
.el-table .hovered-cell {
  border: 1px dashed #409eff !important;
  box-sizing: border-box;
}
.el-table td.selected-cell,
.el-table td.hovered-cell {
  padding: 10px !important;
}
.model-options {
  max-height: 200px;
  overflow-y: auto;
}

.model-option {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-option:hover {
  background-color: #f5f7fa;
}

.model-option.loading,
.model-option.empty {
  text-align: center;
  color: #909399;
  cursor: default;
}

.model-option.loading:hover,
.model-option.empty:hover {
  background-color: transparent;
}

.model-search-popover .el-popover__title {
  margin: 0;
  padding: 5px 12px;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
}

.el-button + .el-button {
  margin-left: 6px;
}
</style>

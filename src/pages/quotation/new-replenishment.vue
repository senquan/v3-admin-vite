<script lang="ts" setup>
import type { ProductListData } from "../product/apis/type"
import type { OrderDetailResponseData, OrderItemsData } from "./apis/type"
import { copyTextToClipboard } from "@/common/utils/helper"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { fetchModels as fetchIds, fetchList as fetchProducts } from "../product/apis"
import PreviewForm from "./_preview.vue"
import { createOrder, fetchOrder, updateOrder } from "./apis"

// 定义表格行的接口
interface TableRowData {
  rowId: string
  id: string
  modelType: string
  modelTypeId: string
  modelOld: string
  materialId: string
  serie: string
  color: string
  name: string
  quantity: number
  basePrice: number
  discount: number
  originPrice: number
  finalUnitPrice: number
  payPrice: number
  payPricePrecision: number
  colorOptions: Array<{ value: any, label: string }>
  backupProducts: Array<ProductListData>
  colorEditable: false
  popoverVisible: boolean
  isBonus: boolean
  imageUrls: string[]
  imageUrl: string
}

const EMPTY_COLOR_NAME = "[默认色]"

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
  materialId: "",
  serie: "",
  color: "",
  name: "",
  quantity: 0,
  discount: 1,
  basePrice: 0,
  originPrice: 0,
  finalUnitPrice: 0,
  payPrice: 0,
  payPricePrecision: 0,
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
const calculatedPrice = ref<any>({
  totalBasePrice: 0,
  totalPayPrice: 0,
  totalDiscountAmount: 0,
  resultMap: new Map<number, any>(),
  usedBonusPoint: 0
})
const formData = ref({
  id: 0,
  type: 3,
  status: 0,
  platformId: 0,
  name: "",
  originPrice: 0,
  flashPrice: 0,
  dailyPrice: 0,
  promotionPrice: 0,
  bonusUsed: 0,
  products: [] as any[],
  matchLogs: [] as any[]
})
const defaultColor = ref("")
const bodyHeight = ref("calc(100vh - 310px)")

// 添加表格引用
const tableRef = ref()
const formRef = ref()

// 防重复提交状态
const isSubmitting = ref(false)
const oldInputRef = ref()
const previewFormRef = ref()
const previewFormVisible = ref(false)
const onFocusQuantity = ref("")
const currentRow = ref<any>(null)
const licenseCode = ref("")

// 列选中功能
const selectedCells = ref<Array<{ rowIndex: number, columnIndex: number }>>([])
const hoveredCell = ref<{ rowIndex: number, columnIndex: number } | null>(null)
const lastSelectedCell = ref<{ rowIndex: number, columnIndex: number } | null>(null)
const copiedValue = ref("")
const materialList = ref("")

const finalDiscount = computed(() => {
  return Number(calculatedPrice.value.totalDiscountAmount.toFixed(2)) || 0
})
const finalPrice = computed(() => {
  return Number(calculatedPrice.value.totalPayPrice.toFixed(2)) || 0
})
const bonusUsed = computed(() => {
  return calculatedPrice.value?.usedBonusPoint || 0
})
const bonusLeft = computed(() => {
  return finalPrice.value * 0.03 - calculatedPrice.value?.usedBonusPoint || 0
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

// 修改modelType后，如果没有匹配的型号则还原
function handelModelTypeBlur(row: any) {
  if (row.modelOld !== "" && row.modelType !== row.modelOld && modelOptions.value.length > 0) {
    const matchedModel = modelOptions.value.find((option: { label: string }) =>
      option.label.toLowerCase() === row.modelType.toLowerCase()
    )
    if (matchedModel) {
      handleIdChange(matchedModel.value, row)
    } else {
      row.modelType = row.modelOld
    }
  }
}

function handleModelFocus(row: any) {
  row.popoverVisible = false
  modelOptions.value = []
}

async function handelSearchProduct(modelType: string, row: any, refresh: boolean = true) {
  try {
    loading.value = true
    fetchProducts({ model: modelType, platform: platformId.value }).then((response: any) => {
      if (response.code === 0) {
        const colorOpts = response.data.colors.map((color: any) => ({
          value: color.id,
          label: color.value || EMPTY_COLOR_NAME
        }))
        if (row) {
          defaultColor.value = row.color
          row.colorOptions = colorOpts
        }
        const productData = response.data.products
        productData.forEach((product: ProductListData) => {
          product.basePrice = formData.value.type === 2 ? Math.round(product.basePrice * 0.9 * 100) / 100 : product.basePrice || 0
          productCache.value.set(product.id, product)
        })
        row.backupProducts = productData.sort((a: any, b: any) => {
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
        loading.value = false
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
  row.materialId = product.materialId || ""
  row.serie = product.serie?.name || ""
  row.color = product.color?.value || ""
  row.name = product.name || ""
  row.imageUrls = product.imageUrls?.split(",") || []
  row.imageUrl = row.imageUrls[0] || ""
  row.isBonus = bonusSeriesIds.value.includes(product.serie?.id)
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
    row.finalUnitPrice = (Number.parseFloat(row.basePrice) * Number.parseFloat(row.discount)).toFixed(2)
    row.payPricePrecision = Number((row.originPrice * Number.parseFloat(row.discount)).toFixed(4))
    row.payPrice = Number(row.payPricePrecision.toFixed(2))
  }

  calculatedPrice.value.totalBasePrice = 0
  calculatedPrice.value.totalPayPrice = 0
  calculatedPrice.value.totalDiscountAmount = 0
  tableData.value.filter((item: any) => item && item.quantity > 0).forEach((item: any) => {
    calculatedPrice.value.totalBasePrice += Number.parseFloat(item.basePrice) * Number.parseFloat(item.quantity)
    calculatedPrice.value.totalPayPrice += Number.parseFloat(item.payPrice)
    calculatedPrice.value.totalDiscountAmount += item.originPrice - item.payPrice
  })
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
    if (index === 5) {
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
    } else if (index === 9) {
      values = data.map((item: Record<string, any>) => Number(item.payPricePrecision))
    } else {
      values = data.map((item: Record<string, any>) => Number(item[column.property]))
    }
    if (index === 5 || index === 9) {
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

function submitOrder(status: number) {
  // 防重复提交检查
  if (isSubmitting.value) {
    ElMessage.warning("正在提交中，请勿重复操作")
    return
  }

  formRef.value.validate((valid: any) => {
    if (!valid) return
    const products = tableData.value.filter((item: any) => item.id !== "" && item.quantity > 0).map((item: any) => ({
      id: item.id,
      unitPrice: item.finalUnitPrice,
      quantity: item.quantity,
      materialId: item.materialId
    }))
    if (products.length === 0) {
      ElMessage.warning("请添加商品")
      return
    }

    // 设置提交状态
    isSubmitting.value = true

    materialList.value = ""
    for (const product of products) {
      materialList.value += `<${product.materialId}*${product.quantity}>`
    }
    formData.value.status = status
    formData.value.platformId = platformId.value
    formData.value.products = products
    formData.value.flashPrice = finalPrice.value || 0
    formData.value.dailyPrice = 0
    formData.value.promotionPrice = 0
    formData.value.bonusUsed = bonusUsed.value || 0
    const request = formData.value.id > 0 ? updateOrder(formData.value.id, formData.value) : createOrder(formData.value)
    request.then((response: any) => {
      if (response.code === 0) {
        if (status === 1) {
          ElMessageBox.alert(materialList.value, "提交订单成功", {
            confirmButtonText: "复制物料详情并关闭",
            callback: () => {
              copyTextToClipboard(materialList.value)
              router.push({
                path: "/quotation/quotation/replenishment"
              })
            }
          })
        } else {
          ElMessage.success("暂存草稿成功")
          router.push({
            path: "/quotation/quotation/replenishment"
          })
        }
      } else {
        ElMessage.error(`提交订单失败: ${response.message}`)
      }
    }).catch((error: any) => {
      ElMessage.error(`提交订单失败: ${error.message || "网络错误"}`)
    }).finally(() => {
      isSubmitting.value = false
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
  const columnProps = ["action", "modelType", "serie", "color", "name", "quantity", "basePrice", "originPrice", "finalUnitPrice", "payPrice"]
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

    const columnProps = ["action", "modelType", "serie", "color", "name", "quantity", "basePrice", "originPrice", "finalUnitPrice", "payPrice"]
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
  const columnIndex = event.target.parentElement.cellIndex || 3
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
  if (loading.value) {
    ElMessage.warning("正在加载数据，请稍等。")
    return
  }
  previewFormRef.value?.open({
    data: tableData.value,
    type: formData.value?.type || 1,
    title: formData.value?.name || "",
    platformId: platformId.value || 0,
    license: licenseCode.value || "",
    summary: {
      dialyDiscount: 0,
      dailyPrice: 0,
      promotionDiscount: 0,
      promotionPrice: 0,
      flashDiscount: finalDiscount.value,
      flashPrice: finalPrice.value,
      bonusUsed
    }
  })
  previewFormVisible.value = true
}

function orderMateria() {
  materialList.value = ""
  tableData.value.forEach((item: any) => {
    if (item.materialId)
      materialList.value += `<${item.materialId}*${item.quantity}>`
  })
  ElMessageBox.alert(materialList.value, "物料详情", {
    confirmButtonText: "复制物料详情并关闭",
    callback: () => {
      copyTextToClipboard(materialList.value)
    }
  })
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
  licenseCode.value = String(router.currentRoute.value.query.code) || ""
  formData.value.type = Number(router.currentRoute.value.query.type) || 3
  if (orderId.value > 0) {
    // 获取订单详情
    loading.value = true
    fetchOrder(orderId.value).then(async (response: OrderDetailResponseData) => {
      if (response.code === 0) {
        const order = response.data
        formData.value.id = order.id
        platformId.value = order.platformId
        licenseCode.value = order.platform?.remark || ""
        formData.value.name = order.name
        formData.value.type = order.type
        tableData.value = order.items.map((item: OrderItemsData) => {
          const product = item.product
          const originPrice = Number((product.basePrice * item.quantity).toFixed(2))
          product.basePrice = formData.value.type === 2 ? Math.round(product.basePrice * 0.9 * 100) / 100 : product.basePrice
          const discount = Number((Number.parseFloat(item.unitPrice) / product.basePrice).toFixed(4))
          const finalUnitPrice = Number.parseFloat(item.unitPrice)
          const payPricePrecision = Number((finalUnitPrice * item.quantity).toFixed(4))
          const payPrice = Number(payPricePrecision.toFixed(2))
          productCache.value.set(product.id, product)
          const images = product.imageUrls?.split(",") || []
          return {
            rowId: getRowIdentity(),
            id: String(product.id),
            modelType: product.modelType?.name || "",
            modelTypeId: product.modelType?.name || "",
            modelOld: product.modelType?.name || "",
            materialId: product.materialId || "",
            serie: product.serie?.name || "",
            color: product.color?.value || "",
            name: product.name || "",
            quantity: item.quantity || 1,
            discount,
            basePrice: product.basePrice || 0,
            originPrice: originPrice || 0,
            finalUnitPrice,
            payPrice,
            payPricePrecision,
            colorOptions: [],
            backupProducts: [],
            colorEditable: false,
            popoverVisible: false,
            isBonus: bonusSeriesIds.value.includes(product.serie?.id),
            imageUrls: images,
            imageUrl: images.length > 0 ? images[0] : ""
          }
        })
        tableData.value.push({ ...defaultRecord, rowId: getRowIdentity() })
        tableData.value.forEach((row: any) => {
          handelReloadColors(true, row)
        })
        console.log(tableData.value)
        calculatePrice(null)
        loading.value = false
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
  window.addEventListener("keydown", handleKeyDown)
})

function getRowIdentity() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown)
})

function handleModelSelect(option: any, row: any) {
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
    const matchedModel = modelOptions.value.find((option: { label: string }) =>
      option.label.toLowerCase() === row.modelType.toLowerCase()
    )
    handleModelSelect(matchedModel || modelOptions.value[0], row)
  }
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
  <div class="quotation-main-container">
    <div class="grid-grouping" :style="{ height: bodyHeight }">
      <el-table
        ref="tableRef"
        :data="tableData"
        :span-method="arraySpanMethod"
        border
        height="100%"
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
        <el-table-column prop="action" label="操作" width="80" align="center">
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
              <el-button @click="handleDelete(row)" link>
                <el-icon :size="18" color="red"><CloseBold /></el-icon>
              </el-button>
              <el-button @click="addRowNext(row)" link>
                <el-icon :size="18" color="red"><Plus /></el-icon>
              </el-button>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="型号" width="150" align="center">
          <template #default="{ row }">
            <el-popover
              placement="bottom"
              :width="150"
              trigger="contextmenu"
              v-model:visible="row.popoverVisible"
              popper-class="model-search-popover"
            >
              <template #reference>
                <el-input
                  v-model="row.modelType"
                  placeholder="请输入型号搜索"
                  @input="(val) => handelSearchId(val, row)"
                  @focus="() => handleModelFocus(row)"
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
                  <el-icon class="is-loading"><Loading /></el-icon> 搜索中...
                </div>
                <div v-if="modelOptions.length === 0 && !searchLoading" class="model-option empty">
                  无匹配结果
                </div>
              </div>
            </el-popover>
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
        <el-table-column prop="basePrice" label="原单价" width="100" align="center">
          <template #default="{ row }"><del>{{ row.basePrice }}</del></template>
        </el-table-column>
        <el-table-column prop="originPrice" label="优惠券折扣" width="100" align="center">
          <template #default="{ row }">
            <el-input v-model="row.discount" style="width: 100%;" @change="calculatePrice(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="finalUnitPrice" label="折后单价" width="100" align="center">
          <template #default="{ row }"><span class="highlight-price">{{ row.finalUnitPrice }}</span></template>
        </el-table-column>
        <el-table-column prop="payPrice" label="折后总价" width="100" align="center">
          <template #default="{ row }"><span class="highlight-price">{{ row.payPrice }}</span></template>
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
                      <el-icon style="margin-right: 5px;"><Timer /></el-icon>
                      优惠券折扣
                    </div>
                  </template>
                  {{ finalDiscount }}
                </el-descriptions-item>
                <el-descriptions-item align="right">
                  <template #label>
                    <div class="cell-item" style="color: red; font-weight: bold;">
                      <el-icon style="margin-right: 5px;"><Money /></el-icon>
                      折后总价
                    </div>
                  </template>
                  <span style="color: red; font-weight: bold;">{{ finalPrice }}</span>
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
                  <el-button type="primary" @click="submitOrder(0)" :loading="isSubmitting" :disabled="isSubmitting">暂存草稿</el-button>
                  <el-button type="primary" @click="submitOrder(1)" :loading="isSubmitting" :disabled="isSubmitting">提交订单</el-button>
                  <el-button type="primary" @click="orderMateria()">物料详情</el-button>
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
          <el-table-column property="value" label="折扣值" width="80" align="center" />
          <el-table-column property="amount" label="折扣额" width="80" align="center" />
          <el-table-column property="step" label="折后总价" width="80" align="center" />
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
  width: 600px;
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

.left-float-button {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

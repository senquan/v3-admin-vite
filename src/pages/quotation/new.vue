<script lang="ts" setup>
import type { ProductListData } from "../product/apis/type"
import { fetchModels as fetchIds, fetchList as fetchProducts } from "../product/apis"
import PreviewForm from "./_preview.vue"
import { calculateOrderPrice, createOrder, fetchOrder, updateOrder } from "./apis"

// 定义表格行的接口
interface TableRowData {
  rowId: string
  id: string
  modelTypeId: string
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
}

const router = useRouter()
const platformId = ref(0)
const orderId = ref(0)
const defaultRecord: TableRowData = {
  rowId: "",
  id: "",
  modelTypeId: "",
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
  colorEditable: false
}
const loading = ref(false)
const tableData = ref<TableRowData[]>([
  { ...defaultRecord },
  { ...defaultRecord }
])
// 添加型号选项数据
const modelOptions = ref<any>([{ value: "", label: "" }])
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
const bodyHeight = ref("calc(100vh - 310px)")

// 添加表格引用
const tableRef = ref()
const formRef = ref()
const previewFormRef = ref()
const previewFormVisible = ref(false)
const onFocusQuantity = ref("")
const currentRow = ref<any>(null)

// 列选中功能
const selectedCells = ref<Array<{ rowIndex: number, columnIndex: number }>>([])
const hoveredCell = ref<{ rowIndex: number, columnIndex: number } | null>(null)
const lastSelectedCell = ref<{ rowIndex: number, columnIndex: number } | null>(null)

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
const bonusUsed = computed(() => {
  return calculatedPrice.value?.usedBonusPoint || 0
})
const bonusLeft = computed(() => {
  return calculatedPrice.value?.flashPrice * 0.03 - calculatedPrice.value?.usedBonusPoint || 0
})

const priceDetailVisible = ref(false)
const priceDetailData = ref<any>([])

const rules = {
  name: [{ required: true, message: "请输入订单名称", trigger: "blur" }]
}

const modelCache = ref<Map<string, any>>(new Map())
const cacheInitialized = ref(false)
const cacheExpiry = 30 * 60 * 1000 // 30分钟缓存过期
const lastCacheTime = ref(0)

// 添加行函数
function addRow() {
  const newRow = { ...defaultRecord, rowId: getRowIdentity() }
  tableData.value.splice(tableData.value.length - 1, 0, newRow)
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
  row.colorEditable = false
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
  if (event.key === "Enter" || event.code === "Enter") {
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

// function copySelectedCells() {
//   if (selectedCells.value.length === 0) return

//   // 获取选中单元格的数据
//   const data = selectedCells.value.map((cell) => {
//     const row = tableData.value[cell.rowIndex]
//     // 根据列索引获取对应的属性
//     const columnProps = ["id", "serie", "color", "name", "quantity", "basePrice", "originPrice", "finalUnitPrice", "payPrice"]
//     const prop = columnProps[cell.columnIndex]
//     return prop in row ? row[prop as keyof TableRowData] : ""
//   })

//   // 将数据复制到剪贴板
//   navigator.clipboard.writeText(data.join("\t"))
//   ElMessage.success("已复制选中单元格")
// }

// 可以添加右键菜单
// function showContextMenu(event: MouseEvent) {
//   event.preventDefault()
//   if (selectedCells.value.length > 0) {
//     // 显示上下文菜单，提供复制等操作
//     // ...
//   }
// }

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
  const columnIndex = event.target.parentElement.cellIndex
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
    fetchOrder(orderId.value).then((response: any) => {
      if (response.code === 0) {
        const order = response.data
        formData.value.id = order.id
        platformId.value = order.platformId
        formData.value.name = order.name
        tableData.value = order.items.map((item: any) => {
          const originPrice = (Number.parseFloat(item.product.basePrice) * Number.parseFloat(item.quantity)).toFixed(2)
          return {
            rowId: getRowIdentity(),
            id: item.product.id,
            modelType: item.product.modelType?.name || "",
            serie: item.product.modelType?.serie?.name || "",
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
        tableData.value.push({ ...defaultRecord, rowId: getRowIdentity() })
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
  window.addEventListener("keydown", handleKeyDown)
})

function getRowIdentity() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown)
})
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
              </div>
            </template>
            <template v-else>
              <el-select
                v-model="row.modelTypeId"
                filterable
                default-first-option
                remote
                :placeholder="row.modelType || '请选择型号'"
                :remote-method="handelSearchId"
                :loading="searchLoading"
                @change="(val) => handleIdChange(val, row)"
              >
                <el-option
                  v-for="item in modelOptions"
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
</style>

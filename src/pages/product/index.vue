<script lang="ts" setup>
import { getCascaderOptions } from "@/common/utils/helper"
// import { useUserStore } from "@/pinia/stores/user"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import ProductForm from "./_form.vue"
import ProductImport from "./_import.vue"
import ProductPrice from "./_price.vue"
import ProductTag from "./_tag.vue"
import { batchDeleteProduct, deleteProduct, fetchList, fetchSeriesOpt } from "./apis"

// const userStore = useUserStore()
// const isAdmin = userStore.roles.includes("ADMIN")

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  color: "",
  serie: "",
  images: "",
  sort: "+id",
  limit: 0,
  page: 1,
  pageSize: 20
})
const searchOptions = reactive({
  colors: [] as Array<{ value: number, label: string }>
})
const totalProducts = ref(0)
const tableData = ref<any>([])
const productFormRef = ref<any>([])
const productImportRef = ref<any>([])
const priceRef = ref<any>([])
const formVisibility = ref(false)
const priceFormVisibility = ref(false)
const tagRef = ref<any>([])
const tagFormVisibility = ref(false)
const series = ref<any>([])
const cascaderOptions = ref({
  serie: [] as number[]
})
const totalPages = computed(() => Math.ceil(totalProducts.value / listQuery.pageSize))
const selectedRows = ref<any>([])

async function fetchProducts() {
  loading.value = true
  try {
    fetchList(listQuery).then((res: any) => {
      // 处理后端返回的数据，转换为前端需要的格式
      if (res.data && res.data.products) {
        totalProducts.value = res.data.total
        tableData.value = res.data.products.map((item: any) => {
          searchOptions.colors = res.data.colors.map((item: any) => ({
            value: Number(item.id),
            label: item.value
          }))
          // 返回处理后的数据
          return {
            id: item.id,
            materialId: item.materialId,
            barCode: item.barCode,
            model: item.modelType?.name || "",
            serie: item.serie?.name || "",
            color: item.color?.value || "",
            name: item.name,
            basePrice: item.basePrice,
            projectPrice: item.projectPrice,
            factoryPrice: item.factoryPrice,
            remark: item.remark || "",
            tags: item.tags || []
          }
        })
      } else {
        tableData.value = []
      }
    })
  } catch (error) {
    console.error("获取记录失败:", error)
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleSortChange(column: any) {
  const { field, order } = column
  listQuery.sort = (order === "desc" ? "-" : "+") + field
  handleFilter()
}

// 搜索方法
function handleFilter() {
  fetchProducts()
}

function importSuccess(count: number) {
  if (count > 0) {
    listQuery.limit = count
    listQuery.sort = "-createAt"
  }
  fetchProducts()
}

function handleNew() {
  handleEdit(0)
}

function handleEdit(id: number) {
  openFrom(id)
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除商品\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除商品$/,
    inputErrorMessage: "请输入\"确认删除商品\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除商品") {
      deleteProduct(id).then(() => {
        ElMessage.success("删除成功")
        fetchProducts()
      }).catch(() => {
        ElMessage({
          type: "warning",
          message: "删除失败"
        })
      })
    }
  }).catch(() => {
    ElMessage({
      type: "info",
      message: "已取消删除"
    })
  })
}

function loadSeries() {
  if (series.value.length === 0) {
    fetchSeriesOpt().then((res: any) => {
      const seriesOptData: Array<any> = []
      if (res.data) {
        for (const item of res.data) {
          if (seriesOptData[item.parentId] === undefined) {
            seriesOptData[item.parentId] = []
          }
          seriesOptData[item.parentId].push(item)
        }
      };
      series.value = getCascaderOptions(seriesOptData, 0)
    })
  }
}

function handleImport() {
  productImportRef.value?.open()
}

function handleBatchPrice() {
  priceFormVisibility.value = true
}

function handleBatchTag() {
  tagFormVisibility.value = true
}

function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要删除的商品")
    return
  }
  ElMessageBox.prompt("请输入\"确认删除商品\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除商品$/,
    inputErrorMessage: "请输入\"确认删除商品\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除商品") {
      const ids = selectedRows.value.map((row: any) => row.id)
      batchDeleteProduct({ ids }).then(() => {
        ElMessage.success("删除成功")
        fetchProducts()
      }).catch(() => {
        ElMessage({
          type: "warning",
          message: "删除失败"
        })
      })
    }
  }).catch(() => {
    ElMessage({
      type: "info",
      message: "已取消删除"
    })
  })
}

async function handleExport() {
  // 显示加载中
  loading.value = true

  try {
    // 获取所有数据（不分页）
    const exportQuery = { ...listQuery, page: 1, pageSize: totalProducts.value }
    const res = await fetchList(exportQuery)

    if (res.data && res.data.products && res.data.products.length > 0) {
      // 准备导出数据
      const exportData = res.data.products.map((item: any) => {
        return {
          物料编号: item.materialId || "",
          条形码: item.barCode || "",
          型号: item.modelType?.name || "",
          系列: item.serie?.name || "",
          颜色: item.color?.value || "",
          名称: item.name || "",
          标签: item.tags ? item.tags.map((tag: any) => tag.name).join(",") : "",
          日常价: item.basePrice || "",
          工程价: item.projectPrice || "",
          出厂价: item.factoryPrice || "",
          备注: item.remark || ""
        }
      })

      // 创建工作簿和工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "商品列表")

      // 设置列宽
      const colWidth = [
        { wch: 15 }, // 物料编号
        { wch: 15 }, // 条形码
        { wch: 15 }, // 型号
        { wch: 15 }, // 系列
        { wch: 10 }, // 颜色
        { wch: 30 }, // 名称
        { wch: 20 }, // 标签
        { wch: 10 }, // 日常价
        { wch: 10 }, // 工程价
        { wch: 10 }, // 出厂价
        { wch: 20 } // 备注
      ]
      worksheet["!cols"] = colWidth

      // 生成Excel文件并下载
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // 生成文件名（包含当前日期）
      const now = new Date()
      const fileName = `商品列表_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.xlsx`

      FileSaver.saveAs(blob, fileName)
      ElMessage.success("导出成功")
    } else {
      ElMessage.warning("没有数据可导出")
    }
  } catch (error) {
    console.error("导出失败:", error)
    ElMessage.error("导出失败，请稍后重试")
  } finally {
    loading.value = false
  }
}

function openFrom(id: number) {
  productFormRef.value?.open({
    colors: searchOptions.colors,
    series: series.value,
    id
  })
  formVisibility.value = true
}

function handleSeriesChange(value: any) {
  if (Array.isArray(value) && value.length > 0) {
    listQuery.serie = value[value.length - 1]
  }
  handleFilter()
}

function handleSeriesClear() {
  listQuery.serie = ""
  cascaderOptions.value.serie = []
}

function handleSelectionChange(selection: any) {
  selectedRows.value = selection.records
}

onMounted(() => {
  handleFilter()
  loadSeries()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-select v-model="listQuery.color" placeholder="选择颜色" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.colors" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-cascader v-model="cascaderOptions.serie" placeholder="选择系列" class="filter-item" :options="series" :props="{ expandTrigger: 'hover' }" filterable clearable @clear="handleSeriesClear()" @change="handleSeriesChange" :debounce="500" />
      <el-select v-model="listQuery.images" placeholder="是否有产品图" class="filter-item" style="width: 150px;" :empty-values="['']" @change="handleFilter" value-on-clear="" clearable>
        <el-option label="有" value="1" />
        <el-option label="无" value="2" />
      </el-select>
      <el-button type="primary" @click="handleFilter" style="margin-left: 12px;">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增商品</el-button>
      <el-button type="primary" @click="handleImport">批量导入商品</el-button>
      <el-button type="primary" @click="handleExport">导出Excel</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
        @checkbox-all="handleSelectionChange"
        @checkbox-change="handleSelectionChange"
      >
        <vxe-column type="checkbox" width="50" />
        <vxe-column field="materialId" width="100" title="物料编号" />
        <vxe-column field="barCode" width="150" title="条形码" />
        <vxe-column field="model" width="130" title="型号" />
        <vxe-column field="serie" width="130" title="系列" />
        <vxe-column field="color" width="100" title="颜色" />
        <vxe-column field="name" min-width="200" title="名称" align="left">
          <template #default="data">
            <el-tag
              v-for="tag in data.row.tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
              :color="tag.color"
              effect="dark"
              style="margin-right: 8px; border: 0;"
            >
              {{ tag.name }}
            </el-tag>
            <span style="margin-right: 8px;">{{ data.row.name }}</span>
            <el-tag v-if="data.row.remark">{{ data.row.remark }}</el-tag>
          </template>
        </vxe-column>
        <vxe-column field="basePrice" title="日常价" width="80" />
        <vxe-column field="projectPrice" title="工程价" width="80" />
        <vxe-column field="factoryPrice" title="出厂价" width="80">
          <template #default="data">
            <span v-if="data.row.factoryPrice > 0"><el-icon><Lock /></el-icon></span>
            <span v-else>{{ data.row.factoryPrice }}</span>
          </template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row.id)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="footer-container">
      <el-button type="success" @click="handleBatchTag">批量标签</el-button>
      <el-button type="warning" @click="handleBatchPrice">批量调价</el-button>
      <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalProducts"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 30, 50]"
        @size-change="handleFilter"
        @current-change="handleFilter"
      />
    </div>

    <ProductForm
      ref="productFormRef"
      @success="fetchProducts"
      @close="formVisibility = false"
    />

    <ProductImport
      ref="productImportRef"
      @success="importSuccess"
    />

    <ProductPrice
      ref="priceRef"
      :visible="priceFormVisibility"
      :selected-ids="selectedRows.map((row: any) => row.id)"
      :all-counts="totalProducts"
      :search-params="listQuery"
      @success="fetchProducts"
      @close="priceFormVisibility = false"
    />

    <ProductTag
      ref="tagRef"
      :visible="tagFormVisibility"
      :selected-ids="selectedRows.map((row: any) => row.id)"
      :all-counts="totalProducts"
      :search-params="listQuery"
      @success="fetchProducts"
      @close="tagFormVisibility = false"
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
.fr {
  float: right;
}
.footer-container {
  padding: 10px;
  padding-left: 60px;
  background: #fff;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>

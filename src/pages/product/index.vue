<script lang="ts" setup>
import { getCascaderOptions } from "@/common/utils/helper"
// import { useUserStore } from "@/pinia/stores/user"
import ProductForm from "./_form.vue"
import ProductImport from "./_import.vue"
import { deleteProduct, fetchList, fetchSeriesOpt } from "./apis"

// const userStore = useUserStore()
// const isAdmin = userStore.roles.includes("ADMIN")

const loading = ref(false)
const listQuery = reactive({
  type: "",
  keyword: "",
  color: "",
  sort: "+id",
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
const formVisibility = ref(false)
const series = ref<any>([])

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
            serie: item.modelType?.serie?.name || "",
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

function handleNew() {
  handleEdit(0)
}

function handleEdit(id: number) {
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
      openFrom(id)
    })
  } else {
    openFrom(id)
  }
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

function handleImport() {
  productImportRef.value?.open()
}

function openFrom(id: number) {
  productFormRef.value?.open({
    colors: searchOptions.colors,
    series: series.value,
    id
  })
  formVisibility.value = true
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" empty-text="暂无数据" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" @clear="handleFilter" clearable />
      <el-select v-model="listQuery.color" placeholder="选择颜色" class="filter-item" style="width: 150px;" @change="handleFilter" clearable>
        <el-option v-for="item in searchOptions.colors" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增商品</el-button>
      <el-button type="primary" @click="handleImport">批量导入商品</el-button>
    </div>

    <div class="grid-grouping">
      <vxe-table
        :data="tableData"
        :loading
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
      >
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

    <div class="pagination-container">
      <el-pagination
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
      @success="fetchProducts"
    />
  </div>
</template>

<style coped>
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
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>

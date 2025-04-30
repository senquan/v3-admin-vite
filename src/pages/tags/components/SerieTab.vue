<script lang="ts" setup>
import { getCascaderOptions } from "@/common/utils/helper"
import { deleteSerie, fetchCategoryListOpt, fetchSerieList } from "../apis"
import CommonForm from "./_form.vue"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  category: "",
  page: 1,
  pageSize: 15
})
const tableData = ref<any>([])
const serieFormRef = ref<InstanceType<typeof CommonForm>>()
const formVisibility = ref(false)
const totalSerie = ref(0)
const totalPages = computed(() => Math.ceil(totalSerie.value / listQuery.pageSize))
const categories = ref<any>([])
const categoryOptions = ref<any>([])

function fetchList() {
  loading.value = true
  if (categories.value.length === 0) {
    fetchCategoryListOpt().then((res) => {
      const categoryOptData: Array<any> = []
      if (res.data) {
        for (const item of res.data.categories) {
          if (categoryOptData[item.parentId] === undefined) {
            categoryOptData[item.parentId] = []
          }
          categoryOptData[item.parentId].push(item)
        }
        categories.value = getCascaderOptions(categoryOptData, 0)
      }
    })
  }

  fetchSerieList(listQuery).then((res) => {
    loading.value = false
    totalSerie.value = res.data.total
    tableData.value = res.data.series
  })
}

function handleCategoryChange(value: any) {
  listQuery.category = value[value.length - 1]
  fetchList()
}

function handleCategoryClear() {
  listQuery.category = ""
  fetchList()
}

function handleFilter() {
  fetchList()
}

function handleNew() {
  handleEdit(null)
}

function handleEdit(data: any) {
  if (data) {
    data.tagOptions = data.tags.map((tag: any) => {
      return {
        id: tag.id,
        name: tag.name,
        color: tag.color
      }
    })
  }
  openFrom(data)
}

function openFrom(data: any) {
  formVisibility.value = true
  nextTick(() => {
    serieFormRef.value?.open({
      id: 0,
      type: "serie",
      editData: data ?? null,
      extraData: categories.value
    })
  })
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除系列\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除系列$/,
    inputErrorMessage: "请输入\"确认删除系列\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除系列") {
      deleteSerie(id).then(() => {
        ElMessage.success("删除成功")
        fetchList()
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

defineExpose({
  fetchList
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" />
      <el-cascader v-model="categoryOptions" placeholder="选择分类" class="filter-item" :options="categories" :props="{ expandTrigger: 'hover' }" @change="handleCategoryChange" @clear="handleCategoryClear" filterable clearable :debounce="500" />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增系列</el-button>
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="id" title="编号" width="80" />
        <vxe-column field="category.name" title="类别" width="150" />
        <vxe-column field="name" title="名称" min-width="200" align="left">
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
            <span>{{ data.row.name }}</span>
          </template>
        </vxe-column>
        <vxe-column field="sort" title="排序值" width="80" />
        <vxe-column field="year" title="首发年份" width="100" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <CommonForm ref="serieFormRef" @success="fetchList" @close="formVisibility = false" v-if="formVisibility" />

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalSerie"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 18, 36]"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>
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
.color-block {
  display: inline-block;
  width: 60px;
  height: 20px;
  border-radius: 10%;
  vertical-align: middle;
}
</style>

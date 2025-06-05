<script lang="ts" setup>
import CommonForm from "./_form.vue"
import { deleteCategory, fetchCategoryList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 20
})
const tableData = ref<any>([])
const categoryFormRef = ref<InstanceType<typeof CommonForm>>()
const formVisibility = ref(false)
const totalCategory = ref(0)
const totalPages = computed(() => Math.ceil(totalCategory.value / listQuery.pageSize))

function fetchList() {
  loading.value = true
  fetchCategoryList(listQuery).then((res) => {
    loading.value = false
    totalCategory.value = res.data.total
    tableData.value = res.data.categories
  })
}

function handleFilter() {
  fetchList()
}

function handleNew() {
  handleEdit(null)
}

function handleEdit(data: any) {
  openFrom(data)
}

function openFrom(data: any) {
  formVisibility.value = true
  nextTick(() => {
    if (data) data.parentId = data.parent_id ?? 0
    categoryFormRef.value?.open({
      id: 0,
      editData: data ?? null
    })
  })
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除分类\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除分类$/,
    inputErrorMessage: "请输入\"确认删除分类\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除分类") {
      deleteCategory(id).then(() => {
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

onMounted(() => {
  handleFilter()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增分类</el-button>
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="_id" title="序号" width="80" />
        <vxe-column field="ref" title="编号" width="100" />
        <vxe-column field="parent" title="上级分类" width="150">
          <template #default="data">
            {{ data.row.parent?.name || "根" }}
          </template>
        </vxe-column>
        <vxe-column field="level" title="层级" width="100" />
        <vxe-column field="name" title="名称" width="250" align="left" />
        <vxe-column field="description" title="描述" min-width="200" align="left" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row._id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <CommonForm ref="categoryFormRef" @success="fetchList" @close="formVisibility = false" v-if="formVisibility" />

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalCategory"
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

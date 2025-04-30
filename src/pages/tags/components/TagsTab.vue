<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { deleteTag, fetchTagsList } from "../apis"
import CommonForm from "./_form.vue"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 15
})
const tableData = ref<any>([])
const tagsFormRef = ref<InstanceType<typeof CommonForm>>()
const formVisibility = ref(false)
const totalTags = ref(0)
const totalPages = computed(() => Math.ceil(totalTags.value / listQuery.pageSize))

function fetchList() {
  loading.value = true
  fetchTagsList(listQuery).then((res) => {
    loading.value = false
    totalTags.value = res.data.total
    tableData.value = res.data.tags
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
    tagsFormRef.value?.open({
      id: 0,
      type: "tags",
      editData: data ?? null,
      extraData: null
    })
  })
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除标签\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除标签$/,
    inputErrorMessage: "请输入\"确认删除标签\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除标签") {
      deleteTag(id).then(() => {
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
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增标签</el-button>
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="id" title="编号" width="80" />
        <vxe-column field="color" title="颜色" width="100">
          <template #default="{ row }">
            <span class="color-block" :style="{ background: row.color }" />
          </template>
        </vxe-column>
        <vxe-column field="name" title="名称" min-width="200" align="left" />
        <vxe-column field="updatedAt" title="最后更新时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </vxe-column>
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <CommonForm ref="tagsFormRef" @success="fetchList" @close="formVisibility = false" v-if="formVisibility" />

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalTags"
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

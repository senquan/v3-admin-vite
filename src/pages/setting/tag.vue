<script lang="ts" setup>
import ModalForm from "./_modal.vue"
import { deleteTag, deleteTagGroup, fetchTagList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 20
})
const tableData = ref<any>([])
const tagFormRef = ref<InstanceType<typeof ModalForm>>()
const formVisibility = ref(false)
const totalTag = ref(0)
const totalPages = computed(() => Math.ceil(totalTag.value / listQuery.pageSize))

function fetchList() {
  loading.value = true
  fetchTagList(listQuery).then((res) => {
    loading.value = false
    totalTag.value = res.data.total
    tableData.value = res.data.tags
  })
}

function handleFilter() {
  fetchList()
}

function handleNew() {
  handleEdit(null)
}

function handleAdd(id: number) {
  openFrom(id, null)
}

function handleEdit(data: any) {
  openFrom(0, data)
}

function openFrom(id: number, data: any) {
  formVisibility.value = true
  nextTick(() => {
    if (data) data.parentId = data.parent_id ?? 0
    tagFormRef.value?.open({
      id: id ?? 0,
      type: "tags",
      editData: data ?? null
    })
  })
}

function handleDelete(id: number, group: boolean) {
  ElMessageBox.prompt("请输入\"确认删除标签\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除标签$/,
    inputErrorMessage: "请输入\"确认删除标签\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除标签") {
      const deleteApi = group ? deleteTagGroup : deleteTag
      deleteApi(id).then(() => {
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

defineExpose({
  fetchList
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
      <el-button type="primary" @click="handleNew">新增标签组</el-button>
    </div>
    <div class="grid-grouping">
      <vxe-table
        :tree-config="{ transform: true, rowField: 'id', parentField: 'parent_id' }"
        :data="tableData"
      >
        <vxe-column field="id" title="序号" width="80" />
        <vxe-column field="name" title="名称" width="250" align="left" tree-node />
        <vxe-column field="color" title="颜色" width="100">
          <template #default="{ row }">
            <span class="color-block" :style="{ background: row.color }" />
          </template>
        </vxe-column>
        <vxe-column field="description" title="描述" min-width="200" align="left" />
        <vxe-column field="actions" title="操作" width="320">
          <template #default="data">
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button v-if="!data.row.parent_id" type="primary" @click="handleAdd(data.row.id)">添加子标签</el-button>
            <el-button v-if="!data.row.parent_id" type="danger" @click="handleDelete(data.row.id, true)">删除标签组</el-button>
            <el-button v-if="data.row.parent_id" type="danger" @click="handleDelete(data.row.id, false)">删除子标签</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <ModalForm ref="tagFormRef" @success="fetchList" @close="formVisibility = false" v-if="formVisibility" />

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalTag"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 18, 36]"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>
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

<script lang="ts" setup>
import { deleteSpec, deleteSpecItem, fetchSpecDetail, fetchSpecGroupList } from "../apis"
import CommonForm from "./_form.vue"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 15
})
const tableData = ref<any>([])
const specFormRef = ref<InstanceType<typeof CommonForm>>()
const formVisibility = ref(false)
const totalSpec = ref(0)
const totalPages = computed(() => Math.ceil(totalSpec.value / listQuery.pageSize))
const detailDrawer = ref(false)
const specDetail = ref<any>([])
const currentSpecId = ref(0)
const specItemFormRef = ref<InstanceType<typeof CommonForm>>()
const formItemVisibility = ref(false)

function fetchList() {
  loading.value = true
  fetchSpecGroupList(listQuery).then((res) => {
    loading.value = false
    totalSpec.value = res.data.total
    tableData.value = res.data.groups
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
    specFormRef.value?.open({
      id: 0,
      type: "spec",
      editData: data ?? null,
      extraData: 0
    })
  })
}

function handleDelete(id: number) {
  ElMessageBox.prompt("请输入\"确认删除规格组\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除规格组$/,
    inputErrorMessage: "请输入\"确认删除规格组\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除规格组") {
      deleteSpec(id).then(() => {
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

function handleDetail(id: number) {
  detailDrawer.value = true
  currentSpecId.value = id
  loadDetail(id)
}

function loadDetail(id: number) {
  fetchSpecDetail(id).then((res: any) => {
    if (res.data) {
      specDetail.value = res.data
    }
  })
}

function openItemFrom(data: any) {
  formItemVisibility.value = true
  nextTick(() => {
    specItemFormRef.value?.open({
      id: 0,
      type: "specItem",
      editData: data ?? null,
      extraData: currentSpecId.value
    })
  })
}

function handleNewItem() {
  openItemFrom(null)
}

function handleDeleteItem(id: number) {
  ElMessageBox.prompt("请输入\"确认删除规格项\"以继续操作", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^确认删除规格项$/,
    inputErrorMessage: "请输入\"确认删除规格项\"",
    type: "warning"
  }).then(({ value }) => {
    if (value === "确认删除规格项") {
      deleteSpecItem(id).then(() => {
        ElMessage.success("删除成功")
        loadDetail(currentSpecId.value)
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

function handleEditItem(data: any) {
  openItemFrom(data)
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
      <el-button type="primary" @click="handleNew">新增规格组</el-button>
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="id" title="编号" width="80" />
        <vxe-column field="name" title="名称" min-width="200" align="left" />
        <vxe-column field="actions" title="操作" width="250">
          <template #default="data">
            <el-button type="success" @click="handleDetail(data.row.id)">详情</el-button>
            <el-button type="primary" @click="handleEdit(data.row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <CommonForm ref="specFormRef" @success="fetchList" @close="formVisibility = false" v-if="formVisibility" />
    <CommonForm ref="specItemFormRef" @success="loadDetail(currentSpecId)" @close="formItemVisibility = false" v-if="formItemVisibility" />

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalSpec"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 18, 36]"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-drawer v-model="detailDrawer" title="规格详情" size="35%" direction="rtl">
      <el-button type="primary" @click="handleNewItem">增加规格</el-button>
      <vxe-table :data="specDetail.specItems">
        <vxe-column title="名称" min-width="200" align="left">
          <template #default="data">
            <el-text truncated>{{ data.row.value }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="sort" title="排序" width="80" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="success" @click="handleEditItem(data.row)">修改</el-button>
            <el-button type="danger" @click="handleDeleteItem(data.row.id)">删除</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </el-drawer>
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

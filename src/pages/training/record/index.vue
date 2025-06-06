<script lang="ts" setup>
import { fetchList as fetchRecordList } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 20
})
const tableData = ref<any>([])
const totalRecord = ref(0)
const totalPages = computed(() => Math.ceil(totalRecord.value / listQuery.pageSize))

function fetchList() {
  loading.value = true
  fetchRecordList(listQuery).then((res) => {
    loading.value = false
    totalRecord.value = res.data.total
    tableData.value = res.data.records
  })
}

function handleFilter() {
  fetchList()
}

function handleDetail(row: any) {
  console.log(row)
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
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="name" title="培训层级" min-width="300" />
        <vxe-column field="total" title="培训计划数" width="150" align="center" />
        <vxe-column field="finished" title="已完成数" width="150" align="center" />
        <vxe-column field="incomplete" title="未完成数" width="150" align="center" />
        <vxe-column field="planned" title="计划参培人数" width="150" align="center" />
        <vxe-column field="actual" title="实际参培人数" width="150" align="center" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleDetail(data.row)">培训记录</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalRecord"
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

<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import DetailForm from "./_detail.vue"
import { fetchList as fetchListByBranch, fetchListGroup, generateExam } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 20
})
const tableData = ref<any>([])
const totalRecord = ref(0)
const totalPages = computed(() => Math.ceil(totalRecord.value / listQuery.pageSize))
const recordDrawer = ref(false)
const recordData = ref<any>([])
const categories = reactive([
  { label: "制度学习", value: 1 },
  { label: "会议传达", value: 2 },
  { label: "安全技术培训", value: 3 },
  { label: "三级教育", value: 4 }
])
const branchName = ref("")
const recordFormRef = ref<any>([])
const recordFormVisibility = ref(false)

function fetchList() {
  loading.value = true
  fetchListGroup(listQuery).then((res) => {
    loading.value = false
    totalRecord.value = res.data.total
    tableData.value = res.data.records
  })
}

function handleFilter() {
  fetchList()
}

function handleDetail(id: number, name: string) {
  recordDrawer.value = true
  branchName.value = name
  loadDetail(id)
}

function loadDetail(id: number) {
  fetchListByBranch({ branch: id }).then((res: any) => {
    if (res.data && res.data.records) {
      recordData.value = res.data.records
    } else {
      recordData.value = []
    }
  })
}

function handleRecordDetail(data: any) {
  console.log(data)
  if (data.columnIndex < 6) openDetail(data.row)
}

function openDetail(row: any) {
  recordFormRef.value?.open({
    data: row
  })
  recordFormVisibility.value = true
}

function handleCreateExam(id: number) {
  ElMessageBox.confirm(
    '确定要生成试卷吗？',
    '生成试卷',
    {
      confirmButtonText: '是的',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    generateExam(id).then((res) => {
      if (res.code === 0) {
        ElMessage({
          type: 'success',
          message: '生成试卷成功',
        })
      }
    })
  })
  .catch(() => {})
}

function handlePublish(id: number) {
  console.log("课件发布" + id)
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
            <el-button type="primary" @click="handleDetail(data.row.id, data.row.name)">培训记录</el-button>
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

    <el-drawer v-model="recordDrawer" :title="`${branchName}培训记录`" size="50%" direction="rtl">
      <vxe-table
        :data="recordData"
        @cell-click="handleRecordDetail"
      >
        <vxe-column title="培训计划名称" min-width="200" align="left">
          <template #default="data">
            <el-text>{{ data.row.name }}</el-text>
          </template>
        </vxe-column>
        <vxe-column title="培训时间" width="150" align="center">
          <template #default="data">
            <el-text truncated>{{ formatDateTime(data.row.actual_time) }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="trainer" title="教培人员" width="80" />
        <vxe-column title="培训分类" width="120">
          <template #default="data">
            <el-text>{{ categories.find((item) => item.value === data.row.training_category)?.label }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="actual_participants" title="实际参培人数" width="110" />
        <vxe-column field="passed" title="合格人数" width="80" />
        <vxe-column title="操作" width="220">
          <template #default="data">
            <el-button v-if="data.row.assessment_method === 3" type="primary" @click="handleCreateExam(data.row.id)">试卷生成</el-button>
            <el-button type="primary" @click="handlePublish(data.row.id)">课件发布</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </el-drawer>

    <DetailForm
      ref="recordFormRef"
      @close="recordFormVisibility = false"
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

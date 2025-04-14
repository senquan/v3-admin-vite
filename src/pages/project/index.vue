<script lang="ts" setup>
import { fetchList as fetchProjectList, fetchDetail } from "./apis"
import { fetchList as fetchAccountList } from "../account/apis"
import { parseTime } from "@/common/utils/datetime"

const loading = ref(false)
const accountLoading = ref(false)
const listQuery = reactive({
  keyword: "",
  carrier: 70
})
const detailDrawer = ref(false)
const detailRecords = ref<any>([])
const currentTagTitle = computed(() => {
  return detailRecords.value.length ? detailRecords.value[0].tagName : ""
})
const detailTotal = ref(0)
const detailQuery = reactive({
  id: 0,
  carrier: 70,
  page: 1,
  pageSize: 18
})
const detailTotalPages = computed(() => {
  return Math.ceil(detailTotal.value / detailQuery.pageSize)
})

const defaultAccountList = [
  { id: 70, name: "过渡账户" },
  { id: 115, name: "有价票券" },
  { id: 130, name: "预算" }
]

const accountList = ref([...defaultAccountList])
const tableData = ref<any>([])

const fetchData = () => {
  loading.value = true
  try {
    fetchProjectList(listQuery).then((res) => {
      if (res.data && res.data.projects) {
        tableData.value = res.data.projects
      } else {
        tableData.value = []
      }
    })
  } catch (error) {
    ElMessage.error("获取数据失败，请稍后重试")
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const handleSearchAccount = (keyword: any) => {
  if (keyword.length < 3) return
  accountLoading.value = true
  fetchAccountList({keyword}).then((res) => {
    if (res.data && res.data.accounts) {
      const accountData = res.data.accounts.map((acc) => ({
        id: acc.id,
        name: acc.name
      }))
      accountList.value.push(...accountData)
    }
  }).finally(() => {
    accountLoading.value = false
  })
}

const handleFilter = () => {
  fetchData()
}

const handleDetail = (row: any) => {
  detailDrawer.value = true
  detailQuery.id = row.id
  detailQuery.carrier = listQuery.carrier
  detailQuery.page = 1
  detailQuery.pageSize = 18
  loadDetail()
}

const loadDetail = () => {
  fetchDetail(detailQuery).then((res) => {
    if (res.data && res.data.records) {
      detailTotal.value = res.data.total
      detailRecords.value = res.data.records
    } else {
      detailRecords.value = []
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" />
      <el-select
        v-model="listQuery.carrier"
        filterable
        remote
        remote-show-suffix
        :remote-method="handleSearchAccount"
        :loading="accountLoading"
        @change="handleFilter"
        style="width: 200px;"
        class="filter-item"
      >
        <el-option
          v-for="acc in accountList"
          :key="acc.id"
          :label="acc.name"
          :value="acc.id"
        >
          {{ acc.name }}
        </el-option>
      </el-select>
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="id" title="编号" width="80" />
        <vxe-column field="tagName" title="名称" min-width="200" align="left">
          <template #default="data">
            <el-text>{{ data.row.tagName == null ? '[未标记]' : data.row.tagName }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="income" title="收入" width="100" />
        <vxe-column field="expense" title="支出" width="100" />
        <vxe-column field="diff" title="余值" width="100">
          <template #default="{ row }">
            <span v-if="row.diff > 0" class="red">{{ row.diff }}</span>
            <span v-else-if="row.diff < 0" class="green">{{ row.diff }}</span>
            <span v-else>{{ row.diff }}</span>
          </template>
        </vxe-column>
        <vxe-column field="net" title="利润" width="100" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="success" size="small" @click="handleDetail(data.row)">详情</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
    <el-drawer v-model="detailDrawer" :title="currentTagTitle" size="35%" direction="rtl">
      <vxe-table :data="detailRecords">
        <vxe-column title="时间" width="100">
          <template #default="data">
            <el-text>{{ parseTime(data.row.logTime, "{m}-{d} {h}:{i}") }}</el-text>
          </template>
        </vxe-column>
        <vxe-column title="事项" min-width="200" align="left">
          <template #default="data">
            <el-text truncated>{{ data.row.title }}{{ data.row.remark ? ' - ' + data.row.remark : '' }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="amount" title="金额" width="100" />
      </vxe-table>
      <div class="pagination-container">
        <el-pagination
          v-if="detailTotalPages > 1"
          v-model:current-page="detailQuery.page"
          v-model:page-size="detailQuery.pageSize"
          :total="detailTotal"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 18, 36]"
          @size-change="loadDetail"
          @current-change="loadDetail"
        />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  margin: 20px 5px;
}
.red {
  color: red;
  font-weight: bold;
}
.green {
  color: green;
  font-weight: bold;
}
:deep(.el-drawer__body) {
  padding: 0;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
</style>

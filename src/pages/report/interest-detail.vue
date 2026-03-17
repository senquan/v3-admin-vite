<script setup lang="ts">
import type { CompanyTree } from "../basic/apis/type"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { getCompaniesTree } from "../basic/apis"
import { getInterestDetail } from "./apis"

interface InterestDetail {
  id: number
  companyName: string // 单位名称
  interestDate: string // 计息日期
  currentBalance: number // 当前余额
  dailyRate: number // 日利率
  dailyInterest: number // 当日利息
  createdAt: string
}

const loading = ref(false)
const activeTab = ref("current")
const companyOptions = ref<CompanyTree[]>([])

const systemParamsStore = useSystemParamsStore()
const depositPeriodMap = systemParamsStore.getArrayDict(3).reduce((prev, cur) => {
  prev[cur.value] = cur.name
  return prev
}, {} as Record<number, string>)

const searchForm = reactive({
  keyword: "",
  companyId: undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableData = reactive({
  current: [] as InterestDetail[],
  f2c: [] as InterestDetail[],
  fixed: [] as InterestDetail[]
})

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      companyId: undefined,
      startDate: "",
      endDate: ""
    }
    if (searchForm.companyId)
      params.companyId = Number(searchForm.companyId)
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    if (activeTab.value === "current") {
      params.type = 1
    } else if (activeTab.value === "f2c") {
      params.type = 2
    } else if (activeTab.value === "fixed") {
      params.type = 3
    }

    const response = await getInterestDetail(params)
    if (response && response.code === 0) {
      let count = 1
      tableData[activeTab.value as keyof typeof tableData] = []
      response.data.records.forEach((item: any) => {
        item.seq = count++
        tableData[activeTab.value as keyof typeof tableData].push(item)
      })
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    keyword: "",
    dateRange: []
  })
  handleSearch()
}

// 分页变化
function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

// 格式化日期
function formatDate(date: string) {
  return date ? formatDateTime(date, "YYYY-MM-DD") : "-"
}

function handleTabChange() {
  if (activeTab.value === "current") {
    if (tableData.current.length === 0) fetchData()
  } else if (activeTab.value === "f2c") {
    if (tableData.f2c.length === 0) fetchData()
  } else if (activeTab.value === "fixed") {
    if (tableData.fixed.length === 0) fetchData()
  }
}

// 获取单位列表
async function getCompanies() {
  try {
    if (companyOptions.value.length === 0) {
      const response = await getCompaniesTree()
      companyOptions.value = response.data.records
    }
  } catch (error) {
    console.error("获取上级单位失败:", error)
  }
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
})
</script>

<template>
  <div class="financial-detail-query">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="活期存（贷）款利息" name="current">
          <!-- 搜索条件 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="单位名称" prop="companyId">
              <el-tree-select
                v-model="searchForm.companyId"
                :data="companyOptions"
                placeholder="请选择单位"
                :render-after-expand="false"
                :check-strictly="true"
                clearable
                style="width: 180px;"
                @change="fetchData"
              />
            </el-form-item>
            <el-form-item label="计息日期">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table
            :data="tableData[activeTab as keyof typeof tableData]"
            border
            stripe
            v-loading="loading"
            header-cell-class-name="header-cell-fix"
          >
            <el-table-column prop="company.companyName" label="单位名称" min-width="300" />
            <el-table-column prop="interestDate" label="计息日期" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.interestDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="currentBalance" label="每日活期存款余额" width="150" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.currentBalance) }}
              </template>
            </el-table-column>
            <el-table-column prop="dailyRate" label="日利率(%)" width="100" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.dailyRate, 6) }}
              </template>
            </el-table-column>
            <el-table-column prop="dailyInterest" label="当日利息" width="120" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.dailyInterest) }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="定期转活期存款利息" name="f2c">
          <!-- 搜索条件 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="单位名称" prop="companyId">
              <el-tree-select
                v-model="searchForm.companyId"
                :data="companyOptions"
                placeholder="请选择单位"
                :render-after-expand="false"
                :check-strictly="true"
                clearable
                style="width: 180px;"
                @change="fetchData"
              />
            </el-form-item>
            <el-form-item label="计息日期">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table
            :data="tableData[activeTab as keyof typeof tableData]"
            border
            stripe
            v-loading="loading"
            header-cell-class-name="header-cell-fix"
          >
            <el-table-column prop="depositCode" label="存款编号" width="150" align="center" />
            <el-table-column prop="company.companyName" label="单位名称" min-width="300" />
            <el-table-column label="计息日期" width="120" align="center">
              <el-table-column prop="interestStartDate" label="起始日期" width="120" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.interestStartDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="interestReleaseDate" label="释放日期" width="120" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.interestReleaseDate) }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column prop="releaseAmount" label="释放金额" width="120" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.releaseAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="dailyRate" label="日利率" width="100" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.dailyRate) }}
              </template>
            </el-table-column>
            <el-table-column prop="depositPeriod" label="存期" width="100" align="center">
              <template #default="{ row }">
                {{ depositPeriodMap[row.depositPeriod] || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="interestAmount" label="利息" width="120" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.interestAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="定期存（贷）款利息" name="fixed">
          <!-- 搜索条件 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="单位名称" prop="companyId">
              <el-tree-select
                v-model="searchForm.companyId"
                :data="companyOptions"
                placeholder="请选择单位"
                :render-after-expand="false"
                :check-strictly="true"
                clearable
                style="width: 180px;"
                @change="fetchData"
              />
            </el-form-item>
            <el-form-item label="计息日期">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table
            :data="tableData[activeTab as keyof typeof tableData]"
            border
            stripe
            v-loading="loading"
            header-cell-class-name="header-cell-fix"
          >
            <el-table-column prop="depositCode" label="存款编号" width="150" align="center" />
            <el-table-column prop="company.companyName" label="单位名称" min-width="300" />
            <el-table-column prop="interestDate" label="计息时间" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.interestDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="currentBalance" label="定期存（贷）款金额" width="180" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.currentBalance) }}
              </template>
            </el-table-column>
            <el-table-column prop="currentRate" label="利率" width="100" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.currentRate) }}
              </template>
            </el-table-column>
            <el-table-column prop="depositPeriod" label="存期" width="100" align="center">
              <template #default="{ row }">
                {{ depositPeriodMap[row.depositPeriod] || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="interestAmount" label="利息" width="120" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.interestAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="isEstimate" label="是否预估" width="100" align="center">
              <template #default="{ row }">
                {{ row.isEstimate === 1 ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<style scoped>
.financial-detail-query {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px 20px 0 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
}

.text-danger {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-input-group__append) {
  background-color: var(--el-color-primary);
  color: white;
  border-color: var(--el-color-primary);
}
</style>

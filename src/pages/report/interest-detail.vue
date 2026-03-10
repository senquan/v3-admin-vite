<script setup lang="ts">
import type { FormInstance } from "element-plus"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
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
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增明细记录")
const formRef = ref<FormInstance>()
const activeTab = ref("current")

const searchForm = reactive({
  keyword: "",
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = reactive({
  current: [] as InterestDetail[],
  f2c: [] as InterestDetail[],
  fixed: [] as InterestDetail[]
})
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  reportCode: "",
  companyCode: "",
  companyName: "",
  accountCode: "",
  accountName: "",
  debitAmount: undefined as number | undefined,
  creditAmount: undefined as number | undefined,
  balance: undefined as number | undefined,
  reportPeriod: "",
  reportDate: "",
  accountType: 1,
  level: 1,
  parentCode: "",
  remark: ""
})

// 生成报表编号
function generateReportCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  form.reportCode = `FD${year}${month}${day}${random}`
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
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

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  try {
    submitLoading.value = true

    // 模拟提交API调用
    await new Promise(resolve => setTimeout(resolve, 800))

    ElMessage.success(form.id ? "更新成功" : "创建成功")
    showCreateDialog.value = false
    fetchData()
  } catch (error) {
    console.error("提交失败:", error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    reportCode: "",
    companyCode: "",
    companyName: "",
    accountCode: "",
    accountName: "",
    debitAmount: undefined,
    creditAmount: undefined,
    balance: undefined,
    reportPeriod: "",
    reportDate: "",
    accountType: 1,
    level: 1,
    parentCode: "",
    remark: ""
  })
}

// 选择单位
function onCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.companyCode = company.companyCode
    form.companyName = company.companyName
  }
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

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="financial-detail-query">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="活期存（贷）款利息" name="current">
          <!-- 搜索条件 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="单位名称">
              <el-input v-model="searchForm.keyword" placeholder="请输入单位名称" />
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
            <el-table-column prop="dailyRate" label="日利率" width="100" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.dailyRate) }}
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
            <el-form-item label="单位名称">
              <el-input v-model="searchForm.keyword" placeholder="请输入单位名称" />
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
            <el-table-column prop="depositPeriod" label="存期" width="120" align="center" />
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
            <el-form-item label="单位名称">
              <el-input v-model="searchForm.keyword" placeholder="请输入单位名称" />
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
            <el-table-column prop="depositPeriod" label="存期" width="120" align="center" />
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="dialogTitle"
      width="800px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表编号" prop="reportCode">
              <el-input v-model="form.reportCode" placeholder="请输入报表编号">
                <template #append>
                  <el-button @click="generateReportCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位名称" prop="companyName">
              <el-select
                v-model="form.companyName"
                placeholder="请选择单位"
                filterable
                @change="onCompanyChange"
              >
                <el-option
                  v-for="item in companyOptions"
                  :key="item.id"
                  :label="item.companyName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="科目编码" prop="accountCode">
              <el-input v-model="form.accountCode" placeholder="请输入科目编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科目名称" prop="accountName">
              <el-input v-model="form.accountName" placeholder="请输入科目名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="科目类型" prop="accountType">
              <el-select v-model="form.accountType" placeholder="请选择科目类型">
                <el-option label="资产" :value="1" />
                <el-option label="负债" :value="2" />
                <el-option label="权益" :value="3" />
                <el-option label="收入" :value="4" />
                <el-option label="费用" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="层级" prop="level">
              <el-input-number
                v-model="form.level"
                placeholder="请输入层级"
                :min="1"
                :max="10"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="借方金额" prop="debitAmount">
              <el-input-number
                v-model="form.debitAmount"
                placeholder="请输入借方金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="贷方金额" prop="creditAmount">
              <el-input-number
                v-model="form.creditAmount"
                placeholder="请输入贷方金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="余额" prop="balance">
              <el-input-number
                v-model="form.balance"
                placeholder="请输入余额"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上级科目" prop="parentCode">
              <el-input v-model="form.parentCode" placeholder="请输入上级科目编码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报告期间" prop="reportPeriod">
              <el-input v-model="form.reportPeriod" placeholder="请输入报告期间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报告日期" prop="reportDate">
              <el-date-picker
                v-model="form.reportDate"
                type="date"
                placeholder="请选择报告日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
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

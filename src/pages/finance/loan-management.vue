<script setup lang="ts">
import { getLoanDepositSummary } from "./apis/index"

interface LoanDepositSummary {
  id: number
  companyCode: string
  companyName: string
  reportDate: string
  loanBalance: number
  loanInterest: number
  loanSubtotal: number
  currentDepositInitial: number
  currentDepositReceived: number
  currentDepositTransferUp: number
  currentDepositTransferDown: number
  currentDepositToFixed: number
  currentDepositSubtotal: number
  fixedDeposit3Months: number
  fixedDeposit6Months: number
  fixedDeposit12Months: number
  fixedDepositSubtotal: number
  depositTotal: number
  interestCurrent: number
  interestFixed: number
  interestSubtotal: number
  total: number
  status: number
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const searchForm = reactive({
  companyName: "",
  companyCode: "",
  startDate: "",
  endDate: ""
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<LoanDepositSummary[]>([])

function formatAmount(amount: number | undefined | null) {
  if (amount === undefined || amount === null || amount === 0) return "-"
  return amount.toFixed(2)
}

function getStatusLabel(status: number) {
  const labels = { 1: "正常", 2: "异常" }
  return labels[status as keyof typeof labels] || "未知"
}

function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

function calculateCurrentDepositSubtotal(row: LoanDepositSummary) {
  return (row.currentDepositInitial || 0)
    + (row.currentDepositReceived || 0)
    + (row.currentDepositTransferUp || 0)
    - (row.currentDepositTransferDown || 0)
    - (row.currentDepositToFixed || 0)
}

function calculateFixedDepositSubtotal(row: LoanDepositSummary) {
  return (row.fixedDeposit3Months || 0)
    + (row.fixedDeposit6Months || 0)
    + (row.fixedDeposit12Months || 0)
}

function calculateDepositTotal(row: LoanDepositSummary) {
  return calculateCurrentDepositSubtotal(row) + calculateFixedDepositSubtotal(row)
}

function calculateInterestSubtotal(row: LoanDepositSummary) {
  return (row.interestCurrent || 0) + (row.interestFixed || 0)
}

function calculateTotal(row: LoanDepositSummary) {
  return calculateDepositTotal(row) + calculateInterestSubtotal(row) - (row.loanSubtotal || 0)
}

function _getSummaryData() {
  const summary = {
    loanBalance: 0,
    loanInterest: 0,
    loanSubtotal: 0,
    currentDepositInitial: 0,
    currentDepositReceived: 0,
    currentDepositTransferUp: 0,
    currentDepositTransferDown: 0,
    currentDepositToFixed: 0,
    currentDepositSubtotal: 0,
    fixedDeposit3Months: 0,
    fixedDeposit6Months: 0,
    fixedDeposit12Months: 0,
    fixedDepositSubtotal: 0,
    depositTotal: 0,
    interestCurrent: 0,
    interestFixed: 0,
    interestSubtotal: 0,
    total: 0
  }

  tableData.value.forEach((row) => {
    summary.loanBalance += row.loanBalance || 0
    summary.loanInterest += row.loanInterest || 0
    summary.loanSubtotal += row.loanSubtotal || 0
    summary.currentDepositInitial += row.currentDepositInitial || 0
    summary.currentDepositReceived += row.currentDepositReceived || 0
    summary.currentDepositTransferUp += row.currentDepositTransferUp || 0
    summary.currentDepositTransferDown += row.currentDepositTransferDown || 0
    summary.currentDepositToFixed += row.currentDepositToFixed || 0
    summary.fixedDeposit3Months += row.fixedDeposit3Months || 0
    summary.fixedDeposit6Months += row.fixedDeposit6Months || 0
    summary.fixedDeposit12Months += row.fixedDeposit12Months || 0
    summary.interestCurrent += row.interestCurrent || 0
    summary.interestFixed += row.interestFixed || 0
  })

  summary.currentDepositSubtotal = summary.currentDepositInitial
    + summary.currentDepositReceived
    + summary.currentDepositTransferUp
    - summary.currentDepositTransferDown
    - summary.currentDepositToFixed

  summary.fixedDepositSubtotal = summary.fixedDeposit3Months
    + summary.fixedDeposit6Months
    + summary.fixedDeposit12Months

  summary.depositTotal = summary.currentDepositSubtotal + summary.fixedDepositSubtotal
  summary.interestSubtotal = summary.interestCurrent + summary.interestFixed
  summary.total = summary.depositTotal + summary.interestSubtotal - summary.loanSubtotal

  return summary
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      companyCode: searchForm.companyCode || "",
      startDate: searchForm.startDate || "",
      endDate: searchForm.endDate || "",
      page: pagination.page,
      size: pagination.size
    }

    // 只在有查询条件时添加companyName参数
    if (searchForm.companyName) {
      params.companyName = searchForm.companyName
    }

    const response = await getLoanDepositSummary(params)
    // 转换API返回的数据结构以匹配表格显示
    const convertedData: LoanDepositSummary = {
      id: response.id,
      companyCode: response.companyCode,
      companyName: response.companyName,
      reportDate: response.depositDate,
      loanBalance: response.depositAmount || 0,
      loanInterest: response.depositInterest || 0,
      loanSubtotal: response.totalAmount || 0,
      currentDepositInitial: 0,
      currentDepositReceived: 0,
      currentDepositTransferUp: 0,
      currentDepositTransferDown: 0,
      currentDepositToFixed: 0,
      currentDepositSubtotal: 0,
      fixedDeposit3Months: 0,
      fixedDeposit6Months: 0,
      fixedDeposit12Months: 0,
      fixedDepositSubtotal: 0,
      depositTotal: 0,
      interestCurrent: 0,
      interestFixed: 0,
      interestSubtotal: 0,
      total: 0,
      status: 1,
      createdBy: "system",
      createdAt: new Date().toISOString()
    }
    tableData.value = [convertedData]
    pagination.total = 1
  } catch (error: any) {
    ElMessage.error(error.message || "获取数据失败")
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    companyName: "",
    companyCode: "",
    startDate: "",
    endDate: ""
  })
  handleSearch()
}

function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

function handleExport() {
  ElMessage.info("导出功能开发中")
}

function handleSaveReport() {
  ElMessage.info("报表保存功能开发中")
}

function handleDrillDown(row: LoanDepositSummary, field: string) {
  console.log("穿透查询:", row.companyName, field)
  ElMessage.info(`查看 ${row.companyName} 的 ${field} 明细`)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="loan-deposit-summary">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="单位编号">
          <el-input v-model="searchForm.companyCode" placeholder="请输入单位编号" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.startDate"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
          <span style="margin: 0 8px">至</span>
          <el-date-picker
            v-model="searchForm.endDate"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button type="warning" @click="handleSaveReport">
            <el-icon><DocumentChecked /></el-icon>
            保存报表
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="summary-header"
        :span-method="({ columnIndex }) => {
          if (columnIndex === 0 || columnIndex === 1) {
            return { rowspan: 1, colspan: 1 }
          }
          return { rowspan: 1, colspan: 1 }
        }"
      >
        <el-table-column prop="companyCode" label="单位编号" width="100" align="center" fixed />
        <el-table-column prop="companyName" label="单位名称" min-width="150" fixed />

        <el-table-column label="内部贷款" align="center">
          <el-table-column prop="loanBalance" label="余额(元)" width="120" align="right">
            <template #default="{ row }">
              <span
                class="clickable-amount"
                @click="handleDrillDown(row, '贷款余额')"
              >{{ formatAmount(row.loanBalance) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="loanInterest" label="利息(元)" width="120" align="right">
            <template #default="{ row }">
              <span
                class="clickable-amount"
                @click="handleDrillDown(row, '贷款利息')"
              >{{ formatAmount(row.loanInterest) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计(元)" width="130" align="right">
            <template #default="{ row }">
              {{ formatAmount(row.loanSubtotal) }}
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="内部存款" align="center">
          <el-table-column label="活期存款" align="center">
            <el-table-column prop="currentDepositInitial" label="期初余额(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '期初余额')"
                >{{ formatAmount(row.currentDepositInitial) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="currentDepositReceived" label="到款(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '到款')"
                >{{ formatAmount(row.currentDepositReceived) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="currentDepositTransferUp" label="上划(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '上划')"
                >{{ formatAmount(row.currentDepositTransferUp) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="currentDepositTransferDown" label="下拨(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '下拨')"
                >{{ formatAmount(row.currentDepositTransferDown) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="currentDepositToFixed" label="转定期(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '转定期')"
                >{{ formatAmount(row.currentDepositToFixed) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="小计(元)" width="130" align="right">
              <template #default="{ row }">
                {{ formatAmount(calculateCurrentDepositSubtotal(row)) }}
              </template>
            </el-table-column>
          </el-table-column>

          <el-table-column label="定期存款" align="center">
            <el-table-column prop="fixedDeposit3Months" label="3个月(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '定期3个月')"
                >{{ formatAmount(row.fixedDeposit3Months) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fixedDeposit6Months" label="6个月(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '定期6个月')"
                >{{ formatAmount(row.fixedDeposit6Months) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fixedDeposit12Months" label="12个月(元)" width="120" align="right">
              <template #default="{ row }">
                <span
                  class="clickable-amount"
                  @click="handleDrillDown(row, '定期12个月')"
                >{{ formatAmount(row.fixedDeposit12Months) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="小计(元)" width="130" align="right">
              <template #default="{ row }">
                {{ formatAmount(calculateFixedDepositSubtotal(row)) }}
              </template>
            </el-table-column>
          </el-table-column>

          <el-table-column label="存款合计(元)" width="140" align="right">
            <template #default="{ row }">
              {{ formatAmount(calculateDepositTotal(row)) }}
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="利息" align="center">
          <el-table-column prop="interestCurrent" label="活期利息(元)" width="120" align="right">
            <template #default="{ row }">
              <span
                class="clickable-amount"
                @click="handleDrillDown(row, '活期利息')"
              >{{ formatAmount(row.interestCurrent) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="interestFixed" label="定期利息(元)" width="120" align="right">
            <template #default="{ row }">
              <span
                class="clickable-amount"
                @click="handleDrillDown(row, '定期利息')"
              >{{ formatAmount(row.interestFixed) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计(元)" width="130" align="right">
            <template #default="{ row }">
              {{ formatAmount(calculateInterestSubtotal(row)) }}
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="总计(元)" width="140" align="right">
          <template #default="{ row }">
            {{ formatAmount(calculateTotal(row)) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

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
.loan-deposit-summary {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.summary-header) {
  text-align: center;
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
}

.clickable-amount {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
}

.clickable-amount:hover {
  color: #66b1ff;
}

.pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>

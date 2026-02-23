<script setup lang="ts">
import { formattedMoney } from "@@/utils"
import { useRouter } from "vue-router"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { getAdvanceExpenses } from "../finance/apis"
import { getClearingSummary } from "./apis"

const router = useRouter()
const systemParamsStore = useSystemParamsStore()
const expenseTypeMap = systemParamsStore.getArrayDict(2)

interface InternalDeposit {
  id: number
  companyCode: string
  companyName: string
  internalDepositBalance: number // 内部存款余额
  incomeTaxSettlement: number // 所得税清算金额
  dueBillAdvance: number // 代垫到期票据款
  expenseAdvance: number // 代垫费用
  salaryAdvance: number // 代垫职工薪酬
  annualProfitPayment: number // 本年上缴利润
  remainingSettlementAmount: number // 剩余代清算金额
  status: number // 状态：1-正常，2-异常
  createdBy: string
  createdAt: string
  remark: string
}

const loading = ref(false)
const drillLoading = ref(false)
const currentDrillType = ref(0)
const showDrillDialog = ref(false)
const drillData = reactive<any>({})

const dialogTitle = {
  1: "内部存款",
  2: "所得税清算",
  3: "代垫到期票据款",
  4: "代垫费用",
  5: "代垫职工薪酬",
  6: "本年上缴利润"
}

const searchForm = reactive({
  keyword: ""
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const drillPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<InternalDeposit[]>([])

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    const amountFields = ["internalDepositBalance", "incomeTaxSettlement", "dueBillAdvance", "expenseAdvance", "salaryAdvance", "dueProfit1", "dueProfit2", "profitPaid"]

    const response = await getClearingSummary(params)
    if (response.code === 0) {
      let count = 1
      tableData.value = []
      response.data.records.forEach((item: any) => {
        amountFields.forEach((field: string) => {
          item[field] = Number(item[field])
        })
        item.seq = count++
        item.remainingProfit = (item.dueProfit1 + item.dueProfit2) - item.profitPaid
        item.remainingSettlementAmount = item.internalDepositBalance - (item.incomeTaxSettlement + item.dueBillAdvance + item.expenseAdvance + item.salaryAdvance + item.remainingProfit)
        tableData.value.push(item)
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
    keyword: ""
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

function handleSave() {
  ElMessage.success("保存快照成功")
}

function handleDrill(row: any, type: number) {
  currentDrillType.value = type
  if (type === 1) {
    router.push({
      name: "Internal Loan Deposit",
      query: {
        companyId: row.companyId
      }
    })
  } else if (type === 2) {
    showDrillDialog.value = true
    loadDrillData(type)
  }
}

async function loadDrillData(type: number) {
  drillLoading.value = true
  try {
    const params: any = {
      page: drillPagination.page,
      size: drillPagination.size,
      type: getExpensesType(type)
    }

    let response
    if (type === 2) response = await getAdvanceExpenses(params)
    if (response && response.code === 0) {
      let count = 1
      drillData[type] = []
      response.data.records.forEach((item: any) => {
        item.seq = count++
        drillData[type].push(item)
      })
      drillPagination.total = response.data.total || 0
    }
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    drillLoading.value = false
  }
}

function handleSizeChangeDrill(val: number) {
  drillPagination.size = val
  loadDrillData(currentDrillType.value)
}

function handleCurrentChangeDrill(val: number) {
  drillPagination.page = val
  loadDrillData(currentDrillType.value)
}

function getExpensesType(type: number) {
  switch (type) {
    case 2:
      return 1
    default:
      return 0
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="internal-deposit-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入单位名称和单位编号模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleSave">
            <SvgIcon name="save" style="margin-right: 5px;" />
            保存快照
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 汇总统计卡片 -->
      <el-row :gutter="20" class="summary-cards">
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formattedMoney(tableData.reduce((sum, item) => sum + item.internalDepositBalance, 0)) }}</div>
              <div class="summary-label">内部存款余额</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formattedMoney(tableData.reduce((sum, item) => sum + item.incomeTaxSettlement, 0)) }}</div>
              <div class="summary-label">所得税清算</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formattedMoney(tableData.reduce((sum, item) => sum + item.dueBillAdvance, 0)) }}</div>
              <div class="summary-label">代垫到期票据</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formattedMoney(tableData.reduce((sum, item) => sum + item.expenseAdvance, 0)) }}</div>
              <div class="summary-label">代垫费用</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formattedMoney(tableData.reduce((sum, item) => sum + item.salaryAdvance, 0)) }}</div>
              <div class="summary-label">代垫薪酬</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formattedMoney(tableData.reduce((sum, item) => sum + item.remainingSettlementAmount, 0)) }}</div>
              <div class="summary-label">剩余清算额</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" min-width="180" />
        <el-table-column prop="internalDepositBalance" label="内部存款余额" width="140" align="right">
          <template #default="{ row }">
            <span class="drillable" @click="handleDrill(row, 1)">{{ formattedMoney(row.internalDepositBalance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="incomeTaxSettlement" label="所得税清算" width="140" align="right">
          <template #default="{ row }">
            <span class="drillable" @click="handleDrill(row, 2)">{{ formattedMoney(row.incomeTaxSettlement) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dueBillAdvance" label="代垫到期票据款" width="160" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.dueBillAdvance) }}
          </template>
        </el-table-column>
        <el-table-column prop="expenseAdvance" label="代垫费用" width="120" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.expenseAdvance) }}
          </template>
        </el-table-column>
        <el-table-column prop="salaryAdvance" label="代垫职工薪酬" width="150" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.salaryAdvance) }}
          </template>
        </el-table-column>
        <el-table-column prop="annualProfitPayment" label="本年上缴利润" width="140" align="right">
          <el-table-column prop="dueProfit1" label="第一次应缴" width="160" align="right">
            <template #default="{ row }">
              {{ formattedMoney(row.dueProfit1) }}
            </template>
          </el-table-column>
          <el-table-column prop="dueProfit2" label="第二次应缴" width="160" align="right">
            <template #default="{ row }">
              {{ formattedMoney(row.dueProfit2) }}
            </template>
          </el-table-column>
          <el-table-column prop="profitPaid" label="已缴" width="160" align="right">
            <template #default="{ row }">
              {{ formattedMoney(row.profitPaid) }}
            </template>
          </el-table-column>
          <el-table-column prop="remainingProfit" label="小计（剩余应缴）" width="160" align="right">
            <template #default="{ row }">
              {{ formattedMoney(row.remainingProfit) }}
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column prop="remainingSettlementAmount" label="剩余代清算金额" width="170" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.remainingSettlementAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="billAmount" label="代开票据金额" width="170" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.billAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="other" label="其他" width="170" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.other) }}
          </template>
        </el-table-column>
        <el-table-column prop="contactBalance" label="往来余额" width="170" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.remainingSettlementAmount - row.billAmount - row.other) }}
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog
      v-model="showDrillDialog"
      :title="`${dialogTitle[currentDrillType as keyof typeof dialogTitle]} 明细详情`"
      width="80%"
      height="80%"
    >
      <el-table
        v-if="currentDrillType === 2"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" width="250" />
        <el-table-column prop="expenseType" label="类型" width="160" align="center">
          <template #default="{ row }">
            {{ expenseTypeMap.find(item => item.value === String(row.expenseType))?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="160" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="businessYear" label="年份" width="120" align="center" />
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="drillPagination.page"
        v-model:page-size="drillPagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="drillPagination.total"
        @size-change="handleSizeChangeDrill"
        @current-change="handleCurrentChangeDrill"
        class="pagination"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.internal-deposit-management {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-cards {
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.summary-item {
  padding: 10px;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
}

.drillable {
  cursor: pointer;
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

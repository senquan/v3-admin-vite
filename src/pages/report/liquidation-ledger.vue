<script setup lang="ts">
import { formattedMoney } from "@@/utils"
import { useRouter } from "vue-router"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { getAdvanceExpenses, getProfitPayments } from "../finance/apis"
import { getClearingSummary, snapshotClearingSummary, updateClearingSummary } from "./apis"

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
const currentCompanyId = ref(0)
const showDrillDialog = ref(false)
const showEditDialog = ref(false)
const drillData = reactive<any>({})

const editTitle = ref("")
const dialogTitle = {
  1: "内部存款",
  2: "所得税清算",
  3: "代垫到期票据款",
  4: "代垫费用",
  5: "代垫职工薪酬",
  6: "本年上缴利润"
}

const advanceExpenseTypes = [2, 3, 4, 5]
const advanceExpenseDetailColumns = ref<any[]>([])

const searchForm = reactive({
  keyword: ""
})

const editForm = reactive({
  id: 0,
  billAmount: 0,
  other: 0
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const drillPagination = reactive({
  page: 1,
  size: 15,
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

function resetEdit() {
  Object.assign(editForm, {
    id: 0,
    billAmount: 0,
    other: 0
  })
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

async function handleSave() {
  await ElMessageBox.confirm(`确定要保存快照吗？`, "提示", {
    type: "warning"
  }).then(async () => {
    const response = await snapshotClearingSummary({})
    if (response.code === 0) {
      ElMessage.success("保存快照成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "保存快照失败")
    }
  })
}

function handleDrill(row: any, type: number) {
  currentDrillType.value = type
  currentCompanyId.value = row.companyId
  if (type === 1) {
    // 跳转内部存款详情页
    router.push({
      name: "Internal Loan Deposit",
      query: {
        companyId: row.companyId
      }
    })
  } else {
    showDrillDialog.value = true
    loadDrillData(type)
  }
}

function handleEdit(row: any) {
  Object.assign(editForm, {
    id: row.id,
    billAmount: row.billAmount,
    other: row.other
  })
  editTitle.value = row.company.companyName
  showEditDialog.value = true
}

async function loadDrillData(type: number) {
  drillLoading.value = true
  try {
    const params: any = {
      page: drillPagination.page,
      size: drillPagination.size,
      companyId: currentCompanyId.value,
      status: 2
    }

    let response
    if (advanceExpenseTypes.includes(type)) {
      params.type = getExpensesType(type)
      response = await getAdvanceExpenses(params)
    } else {
      response = await getProfitPayments(params)
    }
    if (response && response.code === 0) {
      let count = 1
      drillData[type] = []
      advanceExpenseDetailColumns.value = []
      response.data.records.forEach((item: any) => {
        item.seq = count++
        drillData[type].push(item)
        if (item.expenseType === 3) {
          for (const key in item.details) {
            const name = item.details[key].expenseType?.name
            if (name) {
              if (!advanceExpenseDetailColumns.value.includes(name)) {
                advanceExpenseDetailColumns.value.push(name)
              }
            }
          }
        }
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

async function handleSubmit() {
  try {
    const updateData: any = {}
    updateData.billAmount = editForm.billAmount || 0
    updateData.other = editForm.other || 0

    const response = await updateClearingSummary(updateData, editForm.id)

    if (response.code === 0) {
      ElMessage.success("更新成功")
      showEditDialog.value = false
      handleSearch()
    } else {
      ElMessage.error(response.message || "更新失败")
    }
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败")
  }
}

function closeEdit() {
  showEditDialog.value = false
  resetEdit()
}

// 根据穿透类型获取代垫费用类型
function getExpensesType(type: number) {
  switch (type) {
    case 2:
      return 1
    case 3:
      return 2
    case 4:
      return 3
    case 5:
      return 4
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
            <span class="drillable" @click="handleDrill(row, 3)">{{ formattedMoney(row.dueBillAdvance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="expenseAdvance" label="代垫费用" width="120" align="right">
          <template #default="{ row }">
            <span class="drillable" @click="handleDrill(row, 4)">{{ formattedMoney(row.expenseAdvance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="salaryAdvance" label="代垫职工薪酬" width="150" align="right">
          <template #default="{ row }">
            <span class="drillable" @click="handleDrill(row, 5)">{{ formattedMoney(row.salaryAdvance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="annualProfitPayment" label="本年上缴利润" width="140" align="right">
          <el-table-column prop="dueProfit1" label="第一次应缴" width="160" align="right">
            <template #default="{ row }">
              <span class="drillable" @click="handleDrill(row, 6)">{{ formattedMoney(row.dueProfit1) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="dueProfit2" label="第二次应缴" width="160" align="right">
            <template #default="{ row }">
              <span class="drillable" @click="handleDrill(row, 6)">{{ formattedMoney(row.dueProfit2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="profitPaid" label="已缴" width="160" align="right">
            <template #default="{ row }">
              <span class="drillable" @click="handleDrill(row, 6)">{{ formattedMoney(row.profitPaid) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remainingProfit" label="小计（剩余应缴）" width="160" align="right">
            <template #default="{ row }">
              <span class="drillable" @click="handleDrill(row, 6)">{{ formattedMoney(row.remainingProfit) }}</span>
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
            <span class="drillable" @click="handleEdit(row)">{{ formattedMoney(row.billAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="other" label="其他" width="170" align="right">
          <template #default="{ row }">
            <span class="drillable" @click="handleEdit(row)">{{ formattedMoney(row.other) }}</span>
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
        v-if="advanceExpenseTypes.includes(currentDrillType)"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" width="220" />
        <el-table-column prop="expenseType" label="类型" width="180" align="center">
          <template #default="{ row }">
            {{ expenseTypeMap.find(item => item.value === String(row.expenseType))?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="150" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="businessYear" label="年份" width="80" align="center" />
        <el-table-column v-for="(column, index) in advanceExpenseDetailColumns" :key="index" :label="column" width="140" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.details.find((item: any) => item.expenseType?.name === column)?.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>

      <el-table
        v-if="currentDrillType === 6"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" width="220" />
        <el-table-column prop="dueProfit1" label="第一次应缴" width="180" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.dueProfit1) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueProfit2" label="第二次应缴" width="180" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.dueProfit2) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingProfit" label="合计（剩余应缴）" width="180" align="right">
          <template #default="{ row }">
            {{ formattedMoney(Number(row.dueProfit1) + Number(row.dueProfit2) - Number(row.actualAmount)) }}
          </template>
        </el-table-column>
        <el-table-column prop="businessYear" label="年份" width="80" align="center" />
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

    <el-dialog
      v-model="showEditDialog"
      :title="`编辑其他费用项 - ${editTitle}`"
      width="40%"
      @close="closeEdit"
    >
      <el-form
        :model="editForm"
        ref="editFormRef"
        label-width="120px"
        class="search-form"
      >
        <el-form-item label="代开票据金额" prop="billAmount">
          <el-input-number v-model="editForm.billAmount" :step="1" :precision="2" style="width: 300px; margin-bottom: 10px;" />
        </el-form-item>
        <el-form-item label="其他" prop="other">
          <el-input-number v-model="editForm.other" :step="1" :precision="2" style="width: 300px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEdit">关闭</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
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

:deep(.el-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
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

<script setup lang="ts">
import { calculateSum, formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { getFixedDeposits, getFundTransfers, getPaymentClearings } from "../finance/apis"
import { getDepositLoanSummary } from "./apis"

const router = useRouter()

interface LoanDeposit {
  id: number
  companyCode: string
  companyName: string
  loanBalance: number
  loanInterest: number // 贷款利息
  depositIncoming: number
  depositTransferUp: number
  depositFromFixed: number
  depositTransferDown: number
  depositToFixed: number
  depositFixed: number
  depositCurrentInterest: number
  depositFixedInterest: number
}

const loading = ref(false)
const drillLoading = ref(false)
const currentDrillType = ref(0)
const currentCompanyId = ref(0)
const showDrillDialog = ref(false)
const drillData = reactive<any>({})

const systemParamsStore = useSystemParamsStore()
const depositPeriodMap = systemParamsStore.getArrayDict(3).reduce((acc, cur) => {
  acc[cur.value] = cur.name;
  return acc;
}, {} as Record<string, number>);
const depositTypeMap = systemParamsStore.getArrayDict(1).reduce((acc, cur) => {
  acc[cur.value] = cur.name;
  return acc;
}, {} as Record<string, number>);

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
  size: 15,
  total: 0
})

const dialogTitle = {
  1: "内部贷款余额",
  2: "活期存款到款",
  3: "活期存款上划",
  4: "活期存款定期转入",
  5: "活期存款下拨",
  6: "活期存款转入定期",
  7: "定期存款",
}

const tableData = ref<LoanDeposit[]>([])
const fixedDepositTypes = ref<string[]>([])

function formatAmount(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return "-"
  return formattedMoney(amount)
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    params.companyId = router.currentRoute.value.query.companyId
    const amountFields = ["loanBalance", "loanInterest", "depositIncoming", "depositTransferUp", "depositFromFixed", "depositTransferDown", "depositToFixed", "depositCurrentInterest", "depositFixedInterest"]

    const response = await getDepositLoanSummary(params)
    if (response.code === 0) {
      let count = 1
      tableData.value = []
      response.data.records.forEach((item: any) => {
        amountFields.forEach((field: string) => {
          item[field] = Number(item[field])
        })
        item.seq = count++
        item.loanTotal = item.loanBalance + item.loanInterest
        console.log(item)
        item.depositCurrentTotal = item.depositIncoming + item.depositTransferUp + item.depositFromFixed - item.depositTransferDown - item.depositToFixed
        for (const key in item.depositFixed) {
          if (Object.prototype.hasOwnProperty.call(item.depositFixed, key)) {
            if (!fixedDepositTypes.value.includes(key)) {
              fixedDepositTypes.value.push(key)
            }
          }
        }
        item.depositFixedTotal = calculateSum([item.depositFixed])
        item.depositBalanceTotal = item.depositCurrentTotal + item.depositFixedTotal
        item.depositInterest = item.depositCurrentInterest + item.depositFixedInterest
        item.depositTotal = item.depositBalanceTotal + item.depositInterest
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

function getTransferStatusLabel(status: number) {
  const labels = { 1: "待确认", 2: "已生效", 3: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
}

// 格式化日期
function formatDate(date: string) {
  return date ? formatDateTime(date, "YYYY-MM-DD") : "-"
}

function getStatusLabel(status: number) {
  const labels = { 1: "待确认", 2: "已生效", 3: "已清算", 4: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
}

function getStatusType(status: number) {
  const types = { 1: "warning", 2: "success", 3: "primary", 4: "info" }
  return types[status as keyof typeof types] || "info"
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    companyId: "",
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

function handleDrill(row: any, type: number, fixedType?: string) {
  currentDrillType.value = type
  currentCompanyId.value = row.companyId
  showDrillDialog.value = true
  loadDrillData(type, fixedType)
}

async function loadDrillData(type: number, fixedType?: string) {
  drillLoading.value = true
  try {
    const params: any = {
      page: drillPagination.page,
      size: drillPagination.size,
      companyId: currentCompanyId.value
    }

    let response
    if (type === 1) {
      params.type = 2
      params.isLoan = 1
      response = await getFundTransfers(params)
    } else if (type === 2) {
      params.status = 2
      params.received = 1
      response = await getPaymentClearings(params)
    } else if (type === 3) {
      params.type = 1
      response = await getFundTransfers(params)
    } else if (type === 4) {
      params.type = 1
      params.status = 2
      params.isReleased = 1
      response = await getFixedDeposits(params)
    } else if (type === 5) {
      params.type = 2
      response = await getFundTransfers(params)
    } else if (type === 6) {
      params.type = 2
      params.status = 2
      response = await getFixedDeposits(params)
    } else if (type === 7) {
      params.status = 2
      params.depositPeriod = fixedType
      response = await getFixedDeposits(params)
    }
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
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="text-center"
      >
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" min-width="180" />
        <el-table-column prop="internalDepositBalance" label="内部贷款" class-name="header-internal-loan">
          <el-table-column prop="loanBalance" label="余额" width="140" align="right">
            <template #default="{ row }">
              <span class="drillable" @click="handleDrill(row, 1)">{{ formattedMoney(row.loanBalance) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="loanInterest" label="利息" width="140" align="right">
            <template #default="{ row }">
              {{ formattedMoney(row.loanInterest) }}
            </template>
          </el-table-column>
          <el-table-column prop="loanTotal" label="合计" width="140" align="right">
            <template #default="{ row }">
              {{ formattedMoney(row.loanTotal) }}
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="内部存款" class-name="header-internal-deposit">
          <el-table-column label="余额" class-name="header-balance">
            <el-table-column label="活期存款" class-name="header-current-deposit">
              <el-table-column prop="depositIncoming" label="到款" width="140" align="right">
                <template #default="{ row }">
                  <span class="drillable" @click="handleDrill(row, 2)">{{ formattedMoney(row.depositIncoming) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="depositTransferUp" label="上划" width="140" align="right">
                <template #default="{ row }">
                  <span class="drillable" @click="handleDrill(row, 3)">{{ formattedMoney(row.depositTransferUp) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="depositFromFixed" label="定期转入" width="140" align="right">
                <template #default="{ row }">
                  <span class="drillable" @click="handleDrill(row, 4)">{{ formattedMoney(row.depositFromFixed) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="depositTransferDown" label="下拨" width="140" align="right">
                <template #default="{ row }">
                  <span class="drillable" @click="handleDrill(row, 5)">{{ formattedMoney(row.depositTransferDown) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="depositToFixed" label="转入定期" width="140" align="right">
                <template #default="{ row }">
                  <span class="drillable" @click="handleDrill(row, 6)">{{ formattedMoney(row.depositToFixed) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="internalDepositBalance" label="小计" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositCurrentTotal) }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="定期存款" class-name="header-fixed-deposit">
              <el-table-column v-for="(type, index) in fixedDepositTypes" :key="index" :label="depositPeriodMap[type] || type" width="140" align="right">
                <template #default="{ row }">
                  <span class="drillable" @click="handleDrill(row, 7, type)">{{ formattedMoney(row.depositFixed[type]) || "-" }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="depositFixedTotal" label="小计" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositFixedTotal) }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column prop="depositBalanceTotal" label="小计" width="140" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.depositBalanceTotal) }}
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column label="利息">
            <el-table-column prop="depositCurrentInterest" label="活期利息" width="140" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.depositCurrentInterest) }}
              </template>
            </el-table-column>
            <el-table-column prop="depositFixedInterest" label="定期利息" width="140" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.depositFixedInterest) }}
              </template>
            </el-table-column>
            <el-table-column prop="depositInterest" label="小计" width="140" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.depositInterest) }}
              </template>
            </el-table-column>
          </el-table-column>
        </el-table-column>
        <el-table-column prop="depositTotal" label="合计" width="140" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.depositTotal) }}
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
        v-if="currentDrillType === 1"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="transferDate" label="日期" width="120" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" width="220" />
        <el-table-column prop="transferAmount" label="（下拨/代付）金额" width="160" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.transferAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="isLoan" label="是否贷款" width="100" align="center">
          <template #default="{ row }">
            {{ row.isLoan === 1 ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="贷款期限" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column prop="interestRate" label="利率" width="100" />
        <el-table-column prop="interest" label="利息" width="100" />
        <el-table-column prop="transferStatus" label="转账状态" width="100" align="center">
          <template #default="{ row }">
            {{ getTransferStatusLabel(row.transferStatus) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="currentDrillType === 2"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="receiveType" label="到款类型" width="100" align="center">
          <template #default="{ row }">
            {{ row.receiveType === 1 ? "银行到款" : "票据到款" }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveDate" label="到款日期" width="110" align="center">
          <template #default="{ row }">
            {{ formatDate(row.receiveDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="sapCode" label="SAP代码" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="company.companyName" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户名称" width="220" show-overflow-tooltip />
        <el-table-column prop="projectName" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="accountAmount" label="到款金额(元)" width="150" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.accountAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveBank" label="到款银行" width="120" align="center" />
        <el-table-column prop="billNo" label="票据号码" width="120" show-overflow-tooltip />
        <el-table-column prop="dueDate" label="到期日" width="120" align="center" />
        <el-table-column prop="receiptDate" label="托收日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.receiptDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="received" label="是否已到账" width="80" align="center">
          <template #default="{ row }">
            {{ row.received === 1 ? "已到账" : "未到账" }}
          </template>
        </el-table-column>
        <el-table-column prop="discountDate" label="贴现日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.discountDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="贴现到款金额" width="120" align="center" />
        <el-table-column prop="discountFee" label="贴现手续费" width="120" align="center" />
        <el-table-column prop="accountSet" label="账套" width="100" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="currentDrillType === 3"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="transferDate" label="日期" width="120" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" width="220" />
        <el-table-column prop="transferAmount" label="金额" width="160" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.transferAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column prop="transferStatus" label="状态" width="100" align="center">
          <template #default="{ row }">
            {{ getTransferStatusLabel(row.transferStatus) }}
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="currentDrillType === 4"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="depositCode" label="存款编号" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="depositType" label="存款类型" width="100" align="center">
          <template #default="{ row }">
            {{ depositTypeMap[row.depositType] }}
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="起息日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="company.companyName" label="单位名称" min-width="180" />
        <el-table-column prop="amount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="depositPeriod" label="定存期限" width="100" align="center">
          <template #default="{ row }">
            {{ depositPeriodMap[row.depositPeriod] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="到期日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="isEarlyRelease" label="提前释放" width="100" align="center" />
        <el-table-column prop="releaseDate" label="释放日期" width="100" align="center" />
        <el-table-column prop="daysCount" label="已计息天数" width="100" align="center" />
        <el-table-column prop="releaseAmount" label="释放金额" width="120" align="center" />
        <el-table-column prop="remainingAmount" label="剩余金额" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="currentDrillType === 5"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="transferDate" label="日期" width="120" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" width="220" />
        <el-table-column prop="transferAmount" label="（下拨/代付）金额" width="150" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.transferAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="isLoan" label="是否贷款" width="100" align="center">
          <template #default="{ row }">
            {{ row.isLoan === 1 ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="贷款期限" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column prop="transferStatus" label="状态" width="100" align="center">
          <template #default="{ row }">
            {{ getTransferStatusLabel(row.transferStatus) }}
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-if="currentDrillType === 6 || currentDrillType === 7"
        border
        stripe
        v-loading="drillLoading"
        :data="drillData[currentDrillType as keyof typeof drillData]"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="depositCode" label="存款编号" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="depositType" label="存款类型" width="100" align="center">
          <template #default="{ row }">
            {{ depositTypeMap[row.depositType] }}
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="起息日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="company.companyName" label="单位名称" min-width="180" />
        <el-table-column prop="remainingAmount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.remainingAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="depositPeriod" label="定存期限" width="100" align="center">
          <template #default="{ row }">
            {{ depositPeriodMap[row.depositPeriod] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="到期日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
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

.text-center {
  text-align: center;
}

:deep(.el-table .header-internal-loan) {
  background-color: #cfd5dd !important;
}

:deep(.el-table .header-internal-deposit) {
  background-color: #cfd5dd !important;
}

:deep(.el-table .header-balance) {
  background-color: #dce0e6 !important;
}

:deep(.el-table .header-current-deposit) {
  background-color: #e8ebf0 !important;
}

:deep(.el-table .header-fixed-deposit) {
  background-color: #e8ebf0 !important;
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

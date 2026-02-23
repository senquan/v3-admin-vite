<script setup lang="ts">
import { calculateSum, formattedMoney } from "@@/utils"
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

const searchForm = reactive({
  keyword: ""
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<LoanDeposit[]>([])
const fixedDepositTypes = ref<string[]>([])

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
              {{ formattedMoney(row.loanBalance) }}
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
                  {{ formattedMoney(row.depositIncoming) }}
                </template>
              </el-table-column>
              <el-table-column prop="depositTransferUp" label="上划" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositTransferUp) }}
                </template>
              </el-table-column>
              <el-table-column prop="depositFromFixed" label="定期转入" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositFromFixed) }}
                </template>
              </el-table-column>
              <el-table-column prop="depositTransferDown" label="下拨" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositTransferDown) }}
                </template>
              </el-table-column>
              <el-table-column prop="depositToFixed" label="转入定期" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositToFixed) }}
                </template>
              </el-table-column>
              <el-table-column prop="internalDepositBalance" label="小计" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositCurrentTotal) }}
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="定期存款" class-name="header-fixed-deposit">
              <el-table-column v-for="(type, index) in fixedDepositTypes" :key="index" :label="type" width="140" align="right">
                <template #default="{ row }">
                  {{ formattedMoney(row.depositFixed[type]) }}
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

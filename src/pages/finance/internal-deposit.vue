<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface InternalDeposit {
  id: number
  companyCode: string
  companyName: string
  internalDepositBalance: number // 内部存款余额
  incomeTaxClearance: number // 所得税清算金额
  advanceDueBillAmount: number // 代垫到期票据款
  advanceExpenses: number // 代垫费用
  advanceEmployeeCompensation: number // 代垫职工薪酬
  annualProfitPayment: number // 本年上缴利润
  remainingClearanceAmount: number // 剩余代清算金额
  status: number // 状态：1-正常，2-异常
  createdBy: string
  createdAt: string
  remark: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增代垫费用")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  companyCode: "",
  status: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// eslint-disable-next-line no-restricted-syntax
const tableData = ref<InternalDeposit[]>([])
// eslint-disable-next-line no-restricted-syntax
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  companyCode: "",
  companyName: "",
  internalDepositBalance: undefined as number | undefined,
  incomeTaxClearance: undefined as number | undefined,
  advanceDueBillAmount: undefined as number | undefined,
  advanceExpenses: undefined as number | undefined,
  advanceEmployeeCompensation: undefined as number | undefined,
  annualProfitPayment: undefined as number | undefined,
  remainingClearanceAmount: undefined as number | undefined,
  remark: ""
})

const rules = reactive<FormRules>({
  companyCode: [{ required: true, message: "请输入单位编号", trigger: "blur" }],
  companyName: [{ required: true, message: "请输入单位名称", trigger: "blur" }],
  internalDepositBalance: [{ required: true, message: "请输入内部存款余额", trigger: "blur" }],
  incomeTaxClearance: [{ required: true, message: "请输入所得税清算金额", trigger: "blur" }]
})

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "正常", 2: "异常" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取状态标签类型
function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 格式化金额
function formatAmount(amount: number) {
  return amount?.toFixed(2) || "0.00"
}

// 计算剩余代清算金额
function calculateRemainingClearanceAmount() {
  if (
    form.internalDepositBalance !== undefined
    && form.incomeTaxClearance !== undefined
    && form.advanceDueBillAmount !== undefined
    && form.advanceExpenses !== undefined
    && form.advanceEmployeeCompensation !== undefined
    && form.annualProfitPayment !== undefined
  ) {
    return (
      form.internalDepositBalance
      - form.incomeTaxClearance
      - form.advanceDueBillAmount
      - form.advanceExpenses
      - form.advanceEmployeeCompensation
      - form.annualProfitPayment
    )
  }
  return 0
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              {
                id: 1,
                companyCode: "SH001",
                companyName: "上海工程局一分公司",
                internalDepositBalance: 5000000.00,
                incomeTaxClearance: 500000.00,
                advanceDueBillAmount: 200000.00,
                advanceExpenses: 150000.00,
                advanceEmployeeCompensation: 300000.00,
                annualProfitPayment: 800000.00,
                remainingClearanceAmount: 3050000.00,
                status: 1,
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z",
                remark: "正常运营"
              },
              {
                id: 2,
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                internalDepositBalance: 3000000.00,
                incomeTaxClearance: 300000.00,
                advanceDueBillAmount: 100000.00,
                advanceExpenses: 80000.00,
                advanceEmployeeCompensation: 150000.00,
                annualProfitPayment: 500000.00,
                remainingClearanceAmount: 1870000.00,
                status: 1,
                createdBy: "admin",
                createdAt: "2024-01-02T00:00:00Z",
                remark: "正常运营"
              }
            ],
            total: 2
          }
        })
      }, 500)
    })

    const result: any = response
    tableData.value = result.data.items
    pagination.total = result.data.total
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

// 获取单位列表
async function getCompanies() {
  try {
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              { id: 1, companyName: "上海工程局一分公司", companyCode: "SH001" },
              { id: 2, companyName: "上海工程局二分公司", companyCode: "SH002" },
              { id: 3, companyName: "上海工程局三分公司", companyCode: "SH003" }
            ]
          }
        })
      }, 300)
    })

    const result: any = response
    companyOptions.value = result.data.items
  } catch (error) {
    console.error("获取单位列表失败:", error)
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
    companyName: "",
    companyCode: "",
    status: undefined
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

// 编辑
function handleEdit(row: InternalDeposit) {
  dialogTitle.value = "编辑代垫费用"
  Object.assign(form, {
    id: row.id,
    companyCode: row.companyCode,
    companyName: row.companyName,
    internalDepositBalance: row.internalDepositBalance,
    incomeTaxClearance: row.incomeTaxClearance,
    advanceDueBillAmount: row.advanceDueBillAmount,
    advanceExpenses: row.advanceExpenses,
    advanceEmployeeCompensation: row.advanceEmployeeCompensation,
    annualProfitPayment: row.annualProfitPayment,
    remainingClearanceAmount: row.remainingClearanceAmount,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: InternalDeposit) {
  try {
    await ElMessageBox.confirm(`确定要删除 ${row.companyName} 的代垫费用记录吗？`, "提示", {
      type: "warning"
    })

    // 模拟删除API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success("删除成功")
    fetchData()
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
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
    companyCode: "",
    companyName: "",
    internalDepositBalance: undefined,
    incomeTaxClearance: undefined,
    advanceDueBillAmount: undefined,
    advanceExpenses: undefined,
    advanceEmployeeCompensation: undefined,
    annualProfitPayment: undefined,
    remainingClearanceAmount: undefined,
    remark: ""
  })
}

// 选择单位时自动填充编号
function onCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.companyCode = company.companyCode
    form.companyName = company.companyName
  }
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
})
</script>

<template>
  <div class="internal-deposit-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="单位编号">
          <el-input v-model="searchForm.companyCode" placeholder="请输入单位编号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="异常" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增记录
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 汇总统计卡片 -->
      <el-row :gutter="20" class="summary-cards">
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formatAmount(tableData.reduce((sum, item) => sum + item.internalDepositBalance, 0)) }}</div>
              <div class="summary-label">内部存款余额</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formatAmount(tableData.reduce((sum, item) => sum + item.incomeTaxClearance, 0)) }}</div>
              <div class="summary-label">所得税清算</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formatAmount(tableData.reduce((sum, item) => sum + item.advanceDueBillAmount, 0)) }}</div>
              <div class="summary-label">代垫到期票据</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formatAmount(tableData.reduce((sum, item) => sum + item.advanceExpenses, 0)) }}</div>
              <div class="summary-label">代垫费用</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formatAmount(tableData.reduce((sum, item) => sum + item.advanceEmployeeCompensation, 0)) }}</div>
              <div class="summary-label">代垫薪酬</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="summary-card">
            <div class="summary-item">
              <div class="summary-value">¥{{ formatAmount(tableData.reduce((sum, item) => sum + item.remainingClearanceAmount, 0)) }}</div>
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
        header-cell-class-name="text-center"
      >
        <el-table-column prop="companyCode" label="单位编号" width="120" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="180" />
        <el-table-column prop="internalDepositBalance" label="内部存款余额(元)" width="140" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.internalDepositBalance) }}
          </template>
        </el-table-column>
        <el-table-column prop="incomeTaxClearance" label="所得税清算(元)" width="140" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.incomeTaxClearance) }}
          </template>
        </el-table-column>
        <el-table-column prop="advanceDueBillAmount" label="代垫到期票据款(元)" width="160" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.advanceDueBillAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="advanceExpenses" label="代垫费用(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.advanceExpenses) }}
          </template>
        </el-table-column>
        <el-table-column prop="advanceEmployeeCompensation" label="代垫职工薪酬(元)" width="150" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.advanceEmployeeCompensation) }}
          </template>
        </el-table-column>
        <el-table-column prop="annualProfitPayment" label="本年上缴利润(元)" width="140" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.annualProfitPayment) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingClearanceAmount" label="剩余代清算金额(元)" width="170" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.remainingClearanceAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column prop="createdBy" label="创建人" width="100" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="dialogTitle"
      width="800px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="140px"
      >
        <el-row :gutter="20">
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
          <el-col :span="12">
            <el-form-item label="单位编号" prop="companyCode">
              <el-input v-model="form.companyCode" placeholder="请输入单位编号" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="内部存款余额(元)" prop="internalDepositBalance">
              <el-input-number
                v-model="form.internalDepositBalance"
                placeholder="请输入内部存款余额"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所得税清算(元)" prop="incomeTaxClearance">
              <el-input-number
                v-model="form.incomeTaxClearance"
                placeholder="请输入所得税清算金额"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="代垫到期票据款(元)" prop="advanceDueBillAmount">
              <el-input-number
                v-model="form.advanceDueBillAmount"
                placeholder="请输入代垫到期票据款"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代垫费用(元)" prop="advanceExpenses">
              <el-input-number
                v-model="form.advanceExpenses"
                placeholder="请输入代垫费用"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="代垫职工薪酬(元)" prop="advanceEmployeeCompensation">
              <el-input-number
                v-model="form.advanceEmployeeCompensation"
                placeholder="请输入代垫职工薪酬"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="本年上缴利润(元)" prop="annualProfitPayment">
              <el-input-number
                v-model="form.annualProfitPayment"
                placeholder="请输入本年上缴利润"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="剩余代清算金额(元)">
          <el-input :value="formatAmount(calculateRemainingClearanceAmount())" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>

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

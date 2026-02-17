<script setup lang="ts">
import type { FormInstance } from "element-plus"

interface FinancialDetail {
  id: number
  reportCode: string // 报表编号
  companyCode: string // 单位编号
  companyName: string // 单位名称
  accountCode: string // 会计科目编码
  accountName: string // 会计科目名称
  debitAmount: number // 借方金额
  creditAmount: number // 贷方金额
  balance: number // 余额
  reportPeriod: string // 报告期间
  reportDate: string // 报告日期
  accountType: number // 科目类型：1-资产，2-负债，3-权益，4-收入，5-费用
  level: number // 层级
  parentCode: string // 上级科目编码
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增明细记录")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  accountName: "",
  accountType: undefined as number | undefined,
  reportPeriod: "",
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<FinancialDetail[]>([])
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

// 获取科目类型标签
function getAccountTypeLabel(type: number) {
  const labels = { 1: "资产", 2: "负债", 3: "权益", 4: "收入", 5: "费用" }
  return labels[type as keyof typeof labels] || "未知"
}

// 获取科目类型标签类型
function getAccountTypeType(type: number) {
  const types = { 1: "primary", 2: "danger", 3: "warning", 4: "success", 5: "info" }
  return types[type as keyof typeof types] || "info"
}

// 格式化金额
function formatAmount(amount: number) {
  return amount?.toFixed(2) || "0.00"
}

// 格式化日期
function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : "-"
}

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
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              {
                id: 1,
                reportCode: "FD202401010001",
                companyCode: "SH001",
                companyName: "上海工程局",
                accountCode: "1001",
                accountName: "库存现金",
                debitAmount: 500000,
                creditAmount: 200000,
                balance: 300000,
                reportPeriod: "2024年第一季度",
                reportDate: "2024-03-31",
                accountType: 1,
                level: 1,
                parentCode: "",
                remark: "现金科目明细",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
              },
              {
                id: 2,
                reportCode: "FD202401010002",
                companyCode: "SH001",
                companyName: "上海工程局",
                accountCode: "1002",
                accountName: "银行存款",
                debitAmount: 20000000,
                creditAmount: 15000000,
                balance: 5000000,
                reportPeriod: "2024年第一季度",
                reportDate: "2024-03-31",
                accountType: 1,
                level: 1,
                parentCode: "",
                remark: "银行存款明细",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
              },
              {
                id: 3,
                reportCode: "FD202401010003",
                companyCode: "SH001",
                companyName: "上海工程局",
                accountCode: "2001",
                accountName: "短期借款",
                debitAmount: 1000000,
                creditAmount: 3000000,
                balance: 2000000,
                reportPeriod: "2024年第一季度",
                reportDate: "2024-03-31",
                accountType: 2,
                level: 1,
                parentCode: "",
                remark: "短期借款明细",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
              }
            ],
            total: 3
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
              { id: 1, companyName: "上海工程局", companyCode: "SH001" },
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
    accountName: "",
    accountType: undefined,
    reportPeriod: "",
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

// 编辑
function handleEdit(row: FinancialDetail) {
  dialogTitle.value = "编辑明细记录"
  Object.assign(form, {
    id: row.id,
    reportCode: row.reportCode,
    companyCode: row.companyCode,
    companyName: row.companyName,
    accountCode: row.accountCode,
    accountName: row.accountName,
    debitAmount: row.debitAmount,
    creditAmount: row.creditAmount,
    balance: row.balance,
    reportPeriod: row.reportPeriod,
    reportDate: row.reportDate,
    accountType: row.accountType,
    level: row.level,
    parentCode: row.parentCode,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: FinancialDetail) {
  try {
    await ElMessageBox.confirm(`确定要删除明细记录 ${row.accountName} 吗？`, "提示", {
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

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
})
</script>

<template>
  <div class="financial-detail-query">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="科目名称">
          <el-input v-model="searchForm.accountName" placeholder="请输入科目名称" />
        </el-form-item>
        <el-form-item label="科目类型">
          <el-select v-model="searchForm.accountType" placeholder="请选择类型" clearable>
            <el-option label="资产" :value="1" />
            <el-option label="负债" :value="2" />
            <el-option label="权益" :value="3" />
            <el-option label="收入" :value="4" />
            <el-option label="费用" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告期间">
          <el-input v-model="searchForm.reportPeriod" placeholder="请输入报告期间" />
        </el-form-item>
        <el-form-item label="报告日期">
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
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增明细
          </el-button>
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
        <el-table-column prop="reportCode" label="报表编号" width="140" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="accountCode" label="科目编码" width="100" align="center" />
        <el-table-column prop="accountName" label="科目名称" min-width="150" />
        <el-table-column prop="accountType" label="科目类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getAccountTypeType(row.accountType) as any">
              {{ getAccountTypeLabel(row.accountType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="debitAmount" label="借方金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.debitAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="creditAmount" label="贷方金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.creditAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额(元)" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.balance < 0, 'text-success': row.balance >= 0 }">
              {{ formatAmount(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reportPeriod" label="报告期间" width="120" align="center" />
        <el-table-column prop="reportDate" label="报告日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.reportDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="层级" width="60" align="center" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)" size="small">
              编辑
            </el-button>
            <el-button type="danger" @click="handleDelete(row)" size="small">
              删除
            </el-button>
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
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

.text-center {
  text-align: center;
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

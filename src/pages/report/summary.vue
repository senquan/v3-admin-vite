<script setup lang="ts">
import type { FormInstance } from "element-plus"

interface FinancialSummary {
  id: number
  reportPeriod: string // 报告期间
  companyCode: string // 单位编号
  companyName: string // 单位名称
  totalIncome: number // 总收入
  totalExpense: number // 总支出
  netProfit: number // 净利润
  totalAssets: number // 总资产
  totalLiabilities: number // 总负债
  netAssets: number // 净资产
  cashFlow: number // 现金流量
  reportDate: string // 报告日期
  status: number // 状态：1-草稿，2-已审核，3-已发布
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增财务汇总")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  reportPeriod: "",
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<FinancialSummary[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  reportPeriod: "",
  companyCode: "",
  companyName: "",
  totalIncome: undefined as number | undefined,
  totalExpense: undefined as number | undefined,
  netProfit: undefined as number | undefined,
  totalAssets: undefined as number | undefined,
  totalLiabilities: undefined as number | undefined,
  netAssets: undefined as number | undefined,
  cashFlow: undefined as number | undefined,
  reportDate: "",
  status: 1,
  remark: ""
})

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "草稿", 2: "已审核", 3: "已发布" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取状态标签类型
function getStatusType(status: number) {
  const types = { 1: "info", 2: "warning", 3: "success" }
  return types[status as keyof typeof types] || "info"
}

// 格式化金额
function formatAmount(amount: number) {
  return amount?.toFixed(2) || "0.00"
}

// 格式化日期
function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : "-"
}

// 计算净利润
function calculateNetProfit() {
  if (form.totalIncome !== undefined && form.totalExpense !== undefined) {
    return form.totalIncome - form.totalExpense
  }
  return 0
}

// 计算净资产
function calculateNetAssets() {
  if (form.totalAssets !== undefined && form.totalLiabilities !== undefined) {
    return form.totalAssets - form.totalLiabilities
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
                reportPeriod: "2024年第一季度",
                companyCode: "SH001",
                companyName: "上海工程局",
                totalIncome: 50000000,
                totalExpense: 35000000,
                netProfit: 15000000,
                totalAssets: 200000000,
                totalLiabilities: 80000000,
                netAssets: 120000000,
                cashFlow: 10000000,
                reportDate: "2024-04-01",
                status: 3,
                remark: "第一季度财务汇总报告",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
              },
              {
                id: 2,
                reportPeriod: "2024年第二季度",
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                totalIncome: 45000000,
                totalExpense: 32000000,
                netProfit: 13000000,
                totalAssets: 180000000,
                totalLiabilities: 75000000,
                netAssets: 105000000,
                cashFlow: 8000000,
                reportDate: "2024-07-01",
                status: 2,
                remark: "第二季度财务汇总报告",
                createdBy: "admin",
                createdAt: "2024-07-01T00:00:00Z"
              },
              {
                id: 3,
                reportPeriod: "2024年第三季度",
                companyCode: "SH003",
                companyName: "上海工程局三分公司",
                totalIncome: 48000000,
                totalExpense: 34000000,
                netProfit: 14000000,
                totalAssets: 190000000,
                totalLiabilities: 78000000,
                netAssets: 112000000,
                cashFlow: 9000000,
                reportDate: "2024-10-01",
                status: 1,
                remark: "第三季度财务汇总报告（草稿）",
                createdBy: "admin",
                createdAt: "2024-10-01T00:00:00Z"
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
    reportPeriod: "",
    status: undefined,
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
function handleEdit(row: FinancialSummary) {
  dialogTitle.value = "编辑财务汇总"
  Object.assign(form, {
    id: row.id,
    reportPeriod: row.reportPeriod,
    companyCode: row.companyCode,
    companyName: row.companyName,
    totalIncome: row.totalIncome,
    totalExpense: row.totalExpense,
    netProfit: row.netProfit,
    totalAssets: row.totalAssets,
    totalLiabilities: row.totalLiabilities,
    netAssets: row.netAssets,
    cashFlow: row.cashFlow,
    reportDate: row.reportDate,
    status: row.status,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: FinancialSummary) {
  try {
    await ElMessageBox.confirm(`确定要删除财务汇总报告 ${row.reportPeriod} 吗？`, "提示", {
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
    reportPeriod: "",
    companyCode: "",
    companyName: "",
    totalIncome: undefined,
    totalExpense: undefined,
    netProfit: undefined,
    totalAssets: undefined,
    totalLiabilities: undefined,
    netAssets: undefined,
    cashFlow: undefined,
    reportDate: "",
    status: 1,
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
  <div class="financial-summary-report">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="报告期间">
          <el-input v-model="searchForm.reportPeriod" placeholder="请输入报告期间" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" :value="1" />
            <el-option label="已审核" :value="2" />
            <el-option label="已发布" :value="3" />
          </el-select>
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
            新增汇总
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
        <el-table-column prop="reportPeriod" label="报告期间" width="140" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="totalIncome" label="总收入(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.totalIncome) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalExpense" label="总支出(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.totalExpense) }}
          </template>
        </el-table-column>
        <el-table-column prop="netProfit" label="净利润(元)" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.netProfit < 0, 'text-success': row.netProfit >= 0 }">
              {{ formatAmount(row.netProfit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAssets" label="总资产(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.totalAssets) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalLiabilities" label="总负债(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.totalLiabilities) }}
          </template>
        </el-table-column>
        <el-table-column prop="netAssets" label="净资产(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.netAssets) }}
          </template>
        </el-table-column>
        <el-table-column prop="cashFlow" label="现金流量(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.cashFlow) }}
          </template>
        </el-table-column>
        <el-table-column prop="reportDate" label="报告日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.reportDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
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
      width="900px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报告期间" prop="reportPeriod">
              <el-input v-model="form.reportPeriod" placeholder="请输入报告期间" />
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
            <el-form-item label="总收入" prop="totalIncome">
              <el-input-number
                v-model="form.totalIncome"
                placeholder="请输入总收入"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总支出" prop="totalExpense">
              <el-input-number
                v-model="form.totalExpense"
                placeholder="请输入总支出"
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
            <el-form-item label="净利润">
              <el-input :value="formatAmount(calculateNetProfit())" disabled>
                <template #prepend>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现金流量" prop="cashFlow">
              <el-input-number
                v-model="form.cashFlow"
                placeholder="请输入现金流量"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总资产" prop="totalAssets">
              <el-input-number
                v-model="form.totalAssets"
                placeholder="请输入总资产"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总负债" prop="totalLiabilities">
              <el-input-number
                v-model="form.totalLiabilities"
                placeholder="请输入总负债"
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
            <el-form-item label="净资产">
              <el-input :value="formatAmount(calculateNetAssets())" disabled>
                <template #prepend>¥</template>
              </el-input>
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

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="草稿" :value="1" />
                <el-option label="已审核" :value="2" />
                <el-option label="已发布" :value="3" />
              </el-select>
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
.financial-summary-report {
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

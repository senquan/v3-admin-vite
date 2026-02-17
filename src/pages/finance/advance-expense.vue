<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface AdvanceExpense {
  id: number
  advanceCode: string // 垫资编号
  companyCode: string // 单位编号
  companyName: string // 单位名称
  projectCode: string // 项目编号
  projectName: string // 项目名称
  advanceAmount: number // 垫资金额
  advanceDate: string // 垫资日期
  repaymentDate: string // 还款日期
  actualRepaymentDate: string // 实际还款日期
  repaymentAmount: number // 还款金额
  advanceStatus: number // 垫资状态：1-垫资中，2-部分还款，3-已还清，4-逾期
  interestRate: number // 利率(%)
  interestAmount: number // 利息金额
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增垫资")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  projectCode: "",
  advanceStatus: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<AdvanceExpense[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])
const projectOptions = ref<{ id: number, projectName: string, projectCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  advanceCode: "",
  companyCode: "",
  companyName: "",
  projectCode: "",
  projectName: "",
  advanceAmount: undefined as number | undefined,
  advanceDate: "",
  repaymentDate: "",
  actualRepaymentDate: "",
  repaymentAmount: undefined as number | undefined,
  advanceStatus: 1,
  interestRate: undefined as number | undefined,
  interestAmount: undefined as number | undefined,
  remark: ""
})

const rules = reactive<FormRules>({
  companyName: [{ required: true, message: "请选择单位", trigger: "change" }],
  projectName: [{ required: true, message: "请选择项目", trigger: "change" }],
  advanceAmount: [{ required: true, message: "请输入垫资金额", trigger: "blur" }],
  advanceDate: [{ required: true, message: "请选择垫资日期", trigger: "change" }],
  repaymentDate: [{ required: true, message: "请选择还款日期", trigger: "change" }],
  interestRate: [{ required: true, message: "请输入利率", trigger: "blur" }]
})

// 获取垫资状态标签
function getAdvanceStatusLabel(status: number) {
  const labels = { 1: "垫资中", 2: "部分还款", 3: "已还清", 4: "逾期" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取垫资状态标签类型
function getAdvanceStatusType(status: number) {
  const types = { 1: "warning", 2: "primary", 3: "success", 4: "danger" }
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

// 计算利息金额
function calculateInterest() {
  if (form.advanceAmount && form.interestRate && form.advanceDate && form.repaymentDate) {
    const startDate = new Date(form.advanceDate)
    const endDate = new Date(form.repaymentDate)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const interest = (form.advanceAmount * form.interestRate * days) / 36500
    return Number.parseFloat(interest.toFixed(2))
  }
  return 0
}

// 生成垫资编号
function generateAdvanceCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  form.advanceCode = `AE${year}${month}${day}${random}`
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
                advanceCode: "AE202401010001",
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                projectCode: "P2024001",
                projectName: "高铁建设项目A标段",
                advanceAmount: 2000000,
                advanceDate: "2024-01-01",
                repaymentDate: "2024-07-01",
                actualRepaymentDate: "",
                repaymentAmount: 0,
                advanceStatus: 1,
                interestRate: 4.5,
                interestAmount: 45000,
                remark: "项目启动垫资",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 2,
                advanceCode: "AE202401020001",
                companyCode: "SH003",
                companyName: "上海工程局三分公司",
                projectCode: "P2024002",
                projectName: "地铁建设项目B标段",
                advanceAmount: 1500000,
                advanceDate: "2024-01-02",
                repaymentDate: "2024-06-02",
                actualRepaymentDate: "2024-05-15",
                repaymentAmount: 1500000,
                advanceStatus: 3,
                interestRate: 4.2,
                interestAmount: 25200,
                remark: "已按时还款",
                createdBy: "admin",
                createdAt: "2024-01-02T00:00:00Z"
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

// 获取项目列表
async function getProjects() {
  try {
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              { id: 1, projectName: "高铁建设项目A标段", projectCode: "P2024001" },
              { id: 2, projectName: "地铁建设项目B标段", projectCode: "P2024002" },
              { id: 3, projectName: "桥梁建设项目C标段", projectCode: "P2024003" }
            ]
          }
        })
      }, 300)
    })

    const result: any = response
    projectOptions.value = result.data.items
  } catch (error) {
    console.error("获取项目列表失败:", error)
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
    projectCode: "",
    advanceStatus: undefined,
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
function handleEdit(row: AdvanceExpense) {
  dialogTitle.value = "编辑垫资"
  Object.assign(form, {
    id: row.id,
    advanceCode: row.advanceCode,
    companyCode: row.companyCode,
    companyName: row.companyName,
    projectCode: row.projectCode,
    projectName: row.projectName,
    advanceAmount: row.advanceAmount,
    advanceDate: row.advanceDate,
    repaymentDate: row.repaymentDate,
    actualRepaymentDate: row.actualRepaymentDate,
    repaymentAmount: row.repaymentAmount,
    advanceStatus: row.advanceStatus,
    interestRate: row.interestRate,
    interestAmount: row.interestAmount,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: AdvanceExpense) {
  try {
    await ElMessageBox.confirm(`确定要删除垫资记录 ${row.advanceCode} 吗？`, "提示", {
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

// 还款操作
function handleRepayment(row: AdvanceExpense) {
  dialogTitle.value = "垫资还款"
  Object.assign(form, {
    id: row.id,
    advanceCode: row.advanceCode,
    companyCode: row.companyCode,
    companyName: row.companyName,
    projectCode: row.projectCode,
    projectName: row.projectName,
    advanceAmount: row.advanceAmount,
    advanceDate: row.advanceDate,
    repaymentDate: row.repaymentDate,
    actualRepaymentDate: new Date().toISOString().split("T")[0],
    repaymentAmount: row.advanceAmount,
    advanceStatus: row.advanceAmount === row.repaymentAmount ? 3 : 2,
    interestRate: row.interestRate,
    interestAmount: row.interestAmount,
    remark: row.remark
  })
  showCreateDialog.value = true
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
    advanceCode: "",
    companyCode: "",
    companyName: "",
    projectCode: "",
    projectName: "",
    advanceAmount: undefined,
    advanceDate: "",
    repaymentDate: "",
    actualRepaymentDate: "",
    repaymentAmount: undefined,
    advanceStatus: 1,
    interestRate: undefined,
    interestAmount: undefined,
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

// 选择项目
function onProjectChange(projectId: number) {
  const project = projectOptions.value.find(item => item.id === projectId)
  if (project) {
    form.projectCode = project.projectCode
    form.projectName = project.projectName
  }
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
  getProjects()
})
</script>

<template>
  <div class="advance-expense-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="项目编号">
          <el-input v-model="searchForm.projectCode" placeholder="请输入项目编号" />
        </el-form-item>
        <el-form-item label="垫资状态">
          <el-select v-model="searchForm.advanceStatus" placeholder="请选择状态" clearable>
            <el-option label="垫资中" :value="1" />
            <el-option label="部分还款" :value="2" />
            <el-option label="已还清" :value="3" />
            <el-option label="逾期" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="垫资日期">
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
            新增垫资
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
        <el-table-column prop="advanceCode" label="垫资编号" width="140" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="projectName" label="项目名称" min-width="180" />
        <el-table-column prop="advanceAmount" label="垫资金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.advanceAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="advanceDate" label="垫资日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.advanceDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="repaymentDate" label="应还日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.repaymentDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="repaymentAmount" label="已还金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.repaymentAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualRepaymentDate" label="实际还款日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.actualRepaymentDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="interestRate" label="利率(%)" width="100" align="center">
          <template #default="{ row }">
            {{ row.interestRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="interestAmount" label="利息金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.interestAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="advanceStatus" label="垫资状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAdvanceStatusType(row.advanceStatus) as any">
              {{ getAdvanceStatusLabel(row.advanceStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.advanceStatus !== 3"
              type="success"
              @click="handleRepayment(row)"
              size="small"
            >
              还款
            </el-button>
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

    <!-- 新增/编辑/还款对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="垫资编号" prop="advanceCode">
              <el-input v-model="form.advanceCode" placeholder="请输入垫资编号">
                <template #append>
                  <el-button @click="generateAdvanceCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="垫资状态" prop="advanceStatus">
              <el-select v-model="form.advanceStatus" placeholder="请选择垫资状态" disabled>
                <el-option label="垫资中" :value="1" />
                <el-option label="部分还款" :value="2" />
                <el-option label="已还清" :value="3" />
                <el-option label="逾期" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

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
            <el-form-item label="项目名称" prop="projectName">
              <el-select
                v-model="form.projectName"
                placeholder="请选择项目"
                filterable
                @change="onProjectChange"
              >
                <el-option
                  v-for="item in projectOptions"
                  :key="item.id"
                  :label="item.projectName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="垫资金额" prop="advanceAmount">
              <el-input-number
                v-model="form.advanceAmount"
                placeholder="请输入垫资金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="利率(%)" prop="interestRate">
              <el-input-number
                v-model="form.interestRate"
                placeholder="请输入利率"
                :min="0"
                :max="100"
                :step="0.1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="垫资日期" prop="advanceDate">
              <el-date-picker
                v-model="form.advanceDate"
                type="date"
                placeholder="请选择垫资日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="还款日期" prop="repaymentDate">
              <el-date-picker
                v-model="form.repaymentDate"
                type="date"
                placeholder="请选择还款日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 利息金额显示 -->
        <el-form-item label="利息金额">
          <el-input :value="formatAmount(calculateInterest())" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>

        <!-- 还款相关字段 -->
        <div v-if="dialogTitle.includes('还款') || form.advanceStatus > 1">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="还款金额" prop="repaymentAmount">
                <el-input-number
                  v-model="form.repaymentAmount"
                  placeholder="请输入还款金额"
                  :min="0"
                  :step="10000"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="实际还款日期" prop="actualRepaymentDate">
                <el-date-picker
                  v-model="form.actualRepaymentDate"
                  type="date"
                  placeholder="请选择实际还款日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

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
.advance-expense-management {
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

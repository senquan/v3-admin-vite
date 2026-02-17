<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface ProfitPayment {
  id: number
  paymentCode: string // 上缴编号
  companyCode: string // 单位编号
  companyName: string // 单位名称
  projectCode: string // 项目编号
  projectName: string // 项目名称
  paymentAmount: number // 上缴金额
  paymentDate: string // 上缴日期
  paymentMethod: number // 上缴方式：1-现金，2-银行转账，3-支票
  paymentStatus: number // 上缴状态：1-待上缴，2-已上缴，3-延期
  taxRate: number // 税率(%)
  taxAmount: number // 税额
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增利润上缴")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  projectCode: "",
  paymentStatus: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<ProfitPayment[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])
const projectOptions = ref<{ id: number, projectName: string, projectCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  paymentCode: "",
  companyCode: "",
  companyName: "",
  projectCode: "",
  projectName: "",
  paymentAmount: undefined as number | undefined,
  paymentDate: "",
  paymentMethod: 2, // 默认银行转账
  paymentStatus: 1,
  taxRate: undefined as number | undefined,
  taxAmount: undefined as number | undefined,
  remark: ""
})

const rules = reactive<FormRules>({
  companyName: [{ required: true, message: "请选择单位", trigger: "change" }],
  projectName: [{ required: true, message: "请选择项目", trigger: "change" }],
  paymentAmount: [{ required: true, message: "请输入上缴金额", trigger: "blur" }],
  paymentDate: [{ required: true, message: "请选择上缴日期", trigger: "change" }],
  taxRate: [{ required: true, message: "请输入税率", trigger: "blur" }]
})

// 获取上缴状态标签
function getPaymentStatusLabel(status: number) {
  const labels = { 1: "待上缴", 2: "已上缴", 3: "延期" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取上缴状态标签类型
function getPaymentStatusType(status: number) {
  const types = { 1: "warning", 2: "success", 3: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 获取上缴方式标签
function getPaymentMethodLabel(method: number) {
  const labels = { 1: "现金", 2: "银行转账", 3: "支票" }
  return labels[method as keyof typeof labels] || "未知"
}

// 获取上缴方式类型
function getPaymentMethodType(method: number) {
  const types = { 1: "primary", 2: "success", 3: "info" }
  return types[method as keyof typeof types] || "info"
}

// 格式化金额
function formatAmount(amount: number) {
  return amount?.toFixed(2) || "0.00"
}

// 格式化日期
function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : "-"
}

// 计算税额
function calculateTax() {
  if (form.paymentAmount && form.taxRate) {
    const tax = (form.paymentAmount * form.taxRate) / 100
    return Number.parseFloat(tax.toFixed(2))
  }
  return 0
}

// 生成上缴编号
function generatePaymentCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  form.paymentCode = `PP${year}${month}${day}${random}`
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
                paymentCode: "PP202401010001",
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                projectCode: "P2024001",
                projectName: "高铁建设项目A标段",
                paymentAmount: 500000,
                paymentDate: "2024-01-15",
                paymentMethod: 2,
                paymentStatus: 2,
                taxRate: 5.0,
                taxAmount: 25000,
                remark: "第一季度利润上缴",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 2,
                paymentCode: "PP202401020001",
                companyCode: "SH003",
                companyName: "上海工程局三分公司",
                projectCode: "P2024002",
                projectName: "地铁建设项目B标段",
                paymentAmount: 350000,
                paymentDate: "2024-01-20",
                paymentMethod: 2,
                paymentStatus: 1,
                taxRate: 5.0,
                taxAmount: 17500,
                remark: "待上缴",
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
    paymentStatus: undefined,
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
function handleEdit(row: ProfitPayment) {
  dialogTitle.value = "编辑利润上缴"
  Object.assign(form, {
    id: row.id,
    paymentCode: row.paymentCode,
    companyCode: row.companyCode,
    companyName: row.companyName,
    projectCode: row.projectCode,
    projectName: row.projectName,
    paymentAmount: row.paymentAmount,
    paymentDate: row.paymentDate,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    taxRate: row.taxRate,
    taxAmount: row.taxAmount,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: ProfitPayment) {
  try {
    await ElMessageBox.confirm(`确定要删除利润上缴记录 ${row.paymentCode} 吗？`, "提示", {
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
    paymentCode: "",
    companyCode: "",
    companyName: "",
    projectCode: "",
    projectName: "",
    paymentAmount: undefined,
    paymentDate: "",
    paymentMethod: 2,
    paymentStatus: 1,
    taxRate: undefined,
    taxAmount: undefined,
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
  <div class="profit-payment-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="项目编号">
          <el-input v-model="searchForm.projectCode" placeholder="请输入项目编号" />
        </el-form-item>
        <el-form-item label="上缴状态">
          <el-select v-model="searchForm.paymentStatus" placeholder="请选择状态" clearable>
            <el-option label="待上缴" :value="1" />
            <el-option label="已上缴" :value="2" />
            <el-option label="延期" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="上缴日期">
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
            新增上缴
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
        <el-table-column prop="paymentCode" label="上缴编号" width="140" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="projectName" label="项目名称" min-width="180" />
        <el-table-column prop="paymentAmount" label="上缴金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.paymentAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentDate" label="上缴日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.paymentDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="上缴方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPaymentMethodType(row.paymentMethod) as any">
              {{ getPaymentMethodLabel(row.paymentMethod) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentStatus" label="上缴状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPaymentStatusType(row.paymentStatus) as any">
              {{ getPaymentStatusLabel(row.paymentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="taxRate" label="税率(%)" width="100" align="center">
          <template #default="{ row }">
            {{ row.taxRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="taxAmount" label="税额(元)" width="100" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.taxAmount) }}
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
            <el-form-item label="上缴编号" prop="paymentCode">
              <el-input v-model="form.paymentCode" placeholder="请输入上缴编号">
                <template #append>
                  <el-button @click="generatePaymentCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上缴状态" prop="paymentStatus">
              <el-select v-model="form.paymentStatus" placeholder="请选择上缴状态" :disabled="!!form.id">
                <el-option label="待上缴" :value="1" />
                <el-option label="已上缴" :value="2" />
                <el-option label="延期" :value="3" />
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
            <el-form-item label="上缴金额" prop="paymentAmount">
              <el-input-number
                v-model="form.paymentAmount"
                placeholder="请输入上缴金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率(%)" prop="taxRate">
              <el-input-number
                v-model="form.taxRate"
                placeholder="请输入税率"
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
            <el-form-item label="上缴日期" prop="paymentDate">
              <el-date-picker
                v-model="form.paymentDate"
                type="date"
                placeholder="请选择上缴日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上缴方式" prop="paymentMethod">
              <el-select v-model="form.paymentMethod" placeholder="请选择上缴方式">
                <el-option label="现金" :value="1" />
                <el-option label="银行转账" :value="2" />
                <el-option label="支票" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 税额显示 -->
        <el-form-item label="税额">
          <el-input :value="formatAmount(calculateTax())" disabled>
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
.profit-payment-management {
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

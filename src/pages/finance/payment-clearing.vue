<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface PaymentClearing {
  id: number
  companyCode: string
  companyName: string
  billNumber: string // 票据编号
  billType: string // 票据类型：银行承兑汇票、商业承兑汇票
  billAmount: number // 票据金额
  billDate: string // 出票日期
  maturityDate: string // 到期日期
  discountRate: number // 贴现率
  discountAmount: number // 贴现金额
  discountDate: string // 贴现日期
  clearingStatus: number // 清算状态：1-未贴现，2-已贴现，3-已到期，4-已清算
  clearingDate: string // 清算日期
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增票据")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  companyCode: "",
  billType: "",
  clearingStatus: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<PaymentClearing[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  companyCode: "",
  companyName: "",
  billNumber: "",
  billType: "",
  billAmount: undefined as number | undefined,
  billDate: "",
  maturityDate: "",
  discountRate: undefined as number | undefined,
  discountAmount: undefined as number | undefined,
  discountDate: "",
  clearingStatus: 1,
  clearingDate: "",
  remark: ""
})

const rules = reactive<FormRules>({
  companyCode: [{ required: true, message: "请输入单位编号", trigger: "blur" }],
  companyName: [{ required: true, message: "请输入单位名称", trigger: "blur" }],
  billNumber: [{ required: true, message: "请输入票据编号", trigger: "blur" }],
  billType: [{ required: true, message: "请选择票据类型", trigger: "change" }],
  billAmount: [{ required: true, message: "请输入票据金额", trigger: "blur" }],
  billDate: [{ required: true, message: "请选择出票日期", trigger: "change" }],
  maturityDate: [{ required: true, message: "请选择到期日期", trigger: "change" }]
})

// 获取清算状态标签
function getClearingStatusLabel(status: number) {
  const labels = { 1: "未贴现", 2: "已贴现", 3: "已到期", 4: "已清算" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取清算状态标签类型
function getClearingStatusType(status: number) {
  const types = { 1: "info", 2: "warning", 3: "danger", 4: "success" }
  return types[status as keyof typeof types] || "info"
}

// 获取票据类型标签
function getBillTypeLabel(type: string) {
  const labels = { bank: "银行承兑汇票", commercial: "商业承兑汇票" }
  return labels[type as keyof typeof labels] || type
}

// 格式化金额
function formatAmount(amount: number) {
  return amount?.toFixed(2) || "0.00"
}

// 格式化日期
function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : "-"
}

// 计算贴现金额
function calculateDiscountAmount() {
  if (form.billAmount && form.discountRate) {
    // 简单贴现计算：票据金额 × (1 - 贴现率)
    return form.billAmount * (1 - form.discountRate / 100)
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
                billNumber: "BC2024001",
                billType: "bank",
                billAmount: 1000000,
                billDate: "2024-01-01",
                maturityDate: "2024-07-01",
                discountRate: 3.5,
                discountAmount: 982500,
                discountDate: "2024-01-15",
                clearingStatus: 2,
                clearingDate: "",
                remark: "正常贴现",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 2,
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                billNumber: "CC2024001",
                billType: "commercial",
                billAmount: 500000,
                billDate: "2024-02-01",
                maturityDate: "2024-08-01",
                discountRate: 0,
                discountAmount: 0,
                discountDate: "",
                clearingStatus: 1,
                clearingDate: "",
                remark: "未贴现",
                createdBy: "admin",
                createdAt: "2024-02-01T00:00:00Z"
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
    billType: "",
    clearingStatus: undefined,
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
function handleEdit(row: PaymentClearing) {
  dialogTitle.value = "编辑票据"
  Object.assign(form, {
    id: row.id,
    companyCode: row.companyCode,
    companyName: row.companyName,
    billNumber: row.billNumber,
    billType: row.billType,
    billAmount: row.billAmount,
    billDate: row.billDate,
    maturityDate: row.maturityDate,
    discountRate: row.discountRate,
    discountAmount: row.discountAmount,
    discountDate: row.discountDate,
    clearingStatus: row.clearingStatus,
    clearingDate: row.clearingDate,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: PaymentClearing) {
  try {
    await ElMessageBox.confirm(`确定要删除票据 ${row.billNumber} 吗？`, "提示", {
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

// 贴现操作
function handleDiscount(row: PaymentClearing) {
  dialogTitle.value = "票据贴现"
  Object.assign(form, {
    id: row.id,
    companyCode: row.companyCode,
    companyName: row.companyName,
    billNumber: row.billNumber,
    billType: row.billType,
    billAmount: row.billAmount,
    billDate: row.billDate,
    maturityDate: row.maturityDate,
    discountRate: undefined,
    discountAmount: undefined,
    discountDate: "",
    clearingStatus: 2,
    clearingDate: "",
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 清算操作
function handleClearing(row: PaymentClearing) {
  dialogTitle.value = "票据清算"
  Object.assign(form, {
    id: row.id,
    companyCode: row.companyCode,
    companyName: row.companyName,
    billNumber: row.billNumber,
    billType: row.billType,
    billAmount: row.billAmount,
    billDate: row.billDate,
    maturityDate: row.maturityDate,
    discountRate: row.discountRate,
    discountAmount: row.discountAmount,
    discountDate: row.discountDate,
    clearingStatus: 4,
    clearingDate: new Date().toISOString().split("T")[0],
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
    companyCode: "",
    companyName: "",
    billNumber: "",
    billType: "",
    billAmount: undefined,
    billDate: "",
    maturityDate: "",
    discountRate: undefined,
    discountAmount: undefined,
    discountDate: "",
    clearingStatus: 1,
    clearingDate: "",
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
  <div class="payment-clearing-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="单位编号">
          <el-input v-model="searchForm.companyCode" placeholder="请输入单位编号" />
        </el-form-item>
        <el-form-item label="票据类型">
          <el-select v-model="searchForm.billType" placeholder="请选择票据类型" clearable>
            <el-option label="银行承兑汇票" value="bank" />
            <el-option label="商业承兑汇票" value="commercial" />
          </el-select>
        </el-form-item>
        <el-form-item label="清算状态">
          <el-select v-model="searchForm.clearingStatus" placeholder="请选择状态" clearable>
            <el-option label="未贴现" :value="1" />
            <el-option label="已贴现" :value="2" />
            <el-option label="已到期" :value="3" />
            <el-option label="已清算" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
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
            新增票据
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
        <el-table-column prop="companyCode" label="单位编号" width="100" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="billNumber" label="票据编号" width="120" align="center" />
        <el-table-column prop="billType" label="票据类型" width="120" align="center">
          <template #default="{ row }">
            {{ getBillTypeLabel(row.billType) }}
          </template>
        </el-table-column>
        <el-table-column prop="billAmount" label="票据金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.billAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="billDate" label="出票日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.billDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="maturityDate" label="到期日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.maturityDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="discountRate" label="贴现率(%)" width="100" align="center">
          <template #default="{ row }">
            {{ row.discountRate ? `${row.discountRate}%` : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="贴现金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ row.discountAmount ? formatAmount(row.discountAmount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="discountDate" label="贴现日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.discountDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="clearingStatus" label="清算状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getClearingStatusType(row.clearingStatus) as any">
              {{ getClearingStatusLabel(row.clearingStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="clearingDate" label="清算日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.clearingDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.clearingStatus === 1"
              type="warning"
              @click="handleDiscount(row)"
              size="small"
            >
              贴现
            </el-button>
            <el-button
              v-if="row.clearingStatus === 2 || row.clearingStatus === 3"
              type="success"
              @click="handleClearing(row)"
              size="small"
            >
              清算
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

    <!-- 新增/编辑/贴现/清算对话框 -->
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
            <el-form-item label="票据编号" prop="billNumber">
              <el-input v-model="form.billNumber" placeholder="请输入票据编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="票据类型" prop="billType">
              <el-select v-model="form.billType" placeholder="请选择票据类型">
                <el-option label="银行承兑汇票" value="bank" />
                <el-option label="商业承兑汇票" value="commercial" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="票据金额" prop="billAmount">
              <el-input-number
                v-model="form.billAmount"
                placeholder="请输入票据金额"
                :min="0"
                :step="1000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出票日期" prop="billDate">
              <el-date-picker
                v-model="form.billDate"
                type="date"
                placeholder="请选择出票日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="到期日期" prop="maturityDate">
              <el-date-picker
                v-model="form.maturityDate"
                type="date"
                placeholder="请选择到期日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="清算状态" prop="clearingStatus">
              <el-select v-model="form.clearingStatus" placeholder="请选择清算状态" disabled>
                <el-option label="未贴现" :value="1" />
                <el-option label="已贴现" :value="2" />
                <el-option label="已到期" :value="3" />
                <el-option label="已清算" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 贴现相关字段 -->
        <div v-if="dialogTitle.includes('贴现') || form.clearingStatus >= 2">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="贴现率(%)" prop="discountRate">
                <el-input-number
                  v-model="form.discountRate"
                  placeholder="请输入贴现率"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="贴现日期" prop="discountDate">
                <el-date-picker
                  v-model="form.discountDate"
                  type="date"
                  placeholder="请选择贴现日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="贴现金额">
            <el-input :value="formatAmount(calculateDiscountAmount())" disabled>
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 清算相关字段 -->
        <div v-if="dialogTitle.includes('清算') || form.clearingStatus === 4">
          <el-form-item label="清算日期" prop="clearingDate">
            <el-date-picker
              v-model="form.clearingDate"
              type="date"
              placeholder="请选择清算日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
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
.payment-clearing-management {
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
</style>

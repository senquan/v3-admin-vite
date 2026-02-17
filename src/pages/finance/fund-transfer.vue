<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface FundTransfer {
  id: number
  transferCode: string // 转账编号
  fromCompanyCode: string // 拨出单位编号
  fromCompanyName: string // 拨出单位名称
  toCompanyCode: string // 拨入单位编号
  toCompanyName: string // 拨入单位名称
  transferAmount: number // 转账金额
  transferType: number // 转账类型：1-上划，2-下拨
  transferDate: string // 转账日期
  transferStatus: number // 转账状态：1-待处理，2-处理中，3-已完成，4-已取消
  transferDirection: string // 转账方向：上划/下拨
  bankAccount: string // 银行账户
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增转账")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  fromCompanyName: "",
  toCompanyName: "",
  transferType: undefined as number | undefined,
  transferStatus: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<FundTransfer[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  transferCode: "",
  fromCompanyCode: "",
  fromCompanyName: "",
  toCompanyCode: "",
  toCompanyName: "",
  transferAmount: undefined as number | undefined,
  transferType: undefined as number | undefined,
  transferDate: "",
  transferStatus: 1,
  bankAccount: "",
  remark: ""
})

const rules = reactive<FormRules>({
  fromCompanyName: [{ required: true, message: "请选择拨出单位", trigger: "change" }],
  toCompanyName: [{ required: true, message: "请选择拨入单位", trigger: "change" }],
  transferAmount: [{ required: true, message: "请输入转账金额", trigger: "blur" }],
  transferType: [{ required: true, message: "请选择转账类型", trigger: "change" }],
  transferDate: [{ required: true, message: "请选择转账日期", trigger: "change" }]
})

// 获取转账类型标签
function getTransferTypeLabel(type: number) {
  const labels = { 1: "上划", 2: "下拨" }
  return labels[type as keyof typeof labels] || "未知"
}

// 获取转账状态标签
function getTransferStatusLabel(status: number) {
  const labels = { 1: "待处理", 2: "处理中", 3: "已完成", 4: "已取消" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取转账状态标签类型
function getTransferStatusType(status: number) {
  const types = { 1: "info", 2: "warning", 3: "success", 4: "danger" }
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

// 生成转账编号
function generateTransferCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  form.transferCode = `FT${year}${month}${day}${random}`
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
                transferCode: "FT202401010001",
                fromCompanyCode: "SH002",
                fromCompanyName: "上海工程局二分公司",
                toCompanyCode: "SH001",
                toCompanyName: "上海工程局",
                transferAmount: 1000000,
                transferType: 1,
                transferDate: "2024-01-01",
                transferStatus: 3,
                transferDirection: "上划",
                bankAccount: "1234567890123456",
                remark: "月度资金上划",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 2,
                transferCode: "FT202401020001",
                fromCompanyCode: "SH001",
                fromCompanyName: "上海工程局",
                toCompanyCode: "SH003",
                toCompanyName: "上海工程局三分公司",
                transferAmount: 500000,
                transferType: 2,
                transferDate: "2024-01-02",
                transferStatus: 2,
                transferDirection: "下拨",
                bankAccount: "9876543210987654",
                remark: "项目资金下拨",
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

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    fromCompanyName: "",
    toCompanyName: "",
    transferType: undefined,
    transferStatus: undefined,
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
function handleEdit(row: FundTransfer) {
  dialogTitle.value = "编辑转账"
  Object.assign(form, {
    id: row.id,
    transferCode: row.transferCode,
    fromCompanyCode: row.fromCompanyCode,
    fromCompanyName: row.fromCompanyName,
    toCompanyCode: row.toCompanyCode,
    toCompanyName: row.toCompanyName,
    transferAmount: row.transferAmount,
    transferType: row.transferType,
    transferDate: row.transferDate,
    transferStatus: row.transferStatus,
    bankAccount: row.bankAccount,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: FundTransfer) {
  try {
    await ElMessageBox.confirm(`确定要删除转账记录 ${row.transferCode} 吗？`, "提示", {
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
    transferCode: "",
    fromCompanyCode: "",
    fromCompanyName: "",
    toCompanyCode: "",
    toCompanyName: "",
    transferAmount: undefined,
    transferType: undefined,
    transferDate: "",
    transferStatus: 1,
    bankAccount: "",
    remark: ""
  })
}

// 选择拨出单位
function onFromCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.fromCompanyCode = company.companyCode
    form.fromCompanyName = company.companyName
  }
}

// 选择拨入单位
function onToCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.toCompanyCode = company.companyCode
    form.toCompanyName = company.companyName
  }
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
})
</script>

<template>
  <div class="fund-transfer-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="拨出单位">
          <el-input v-model="searchForm.fromCompanyName" placeholder="请输入拨出单位" />
        </el-form-item>
        <el-form-item label="拨入单位">
          <el-input v-model="searchForm.toCompanyName" placeholder="请输入拨入单位" />
        </el-form-item>
        <el-form-item label="转账类型">
          <el-select v-model="searchForm.transferType" placeholder="请选择类型" clearable>
            <el-option label="上划" :value="1" />
            <el-option label="下拨" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="转账状态">
          <el-select v-model="searchForm.transferStatus" placeholder="请选择状态" clearable>
            <el-option label="待处理" :value="1" />
            <el-option label="处理中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="转账日期">
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
            新增转账
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
        <el-table-column prop="transferCode" label="转账编号" width="140" align="center" />
        <el-table-column prop="fromCompanyName" label="拨出单位" min-width="150" />
        <el-table-column prop="toCompanyName" label="拨入单位" min-width="150" />
        <el-table-column prop="transferAmount" label="转账金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.transferAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="transferType" label="转账类型" width="100" align="center">
          <template #default="{ row }">
            {{ getTransferTypeLabel(row.transferType) }}
          </template>
        </el-table-column>
        <el-table-column prop="transferDate" label="转账日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.transferDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="transferStatus" label="转账状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTransferStatusType(row.transferStatus) as any">
              {{ getTransferStatusLabel(row.transferStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bankAccount" label="银行账户" width="160" align="center" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="createdBy" label="创建人" width="100" align="center" />
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
      width="600px"
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
            <el-form-item label="转账编号" prop="transferCode">
              <el-input v-model="form.transferCode" placeholder="请输入转账编号">
                <template #append>
                  <el-button @click="generateTransferCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转账类型" prop="transferType">
              <el-select v-model="form.transferType" placeholder="请选择转账类型">
                <el-option label="上划" :value="1" />
                <el-option label="下拨" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="拨出单位" prop="fromCompanyName">
              <el-select
                v-model="form.fromCompanyName"
                placeholder="请选择拨出单位"
                filterable
                @change="onFromCompanyChange"
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
            <el-form-item label="拨入单位" prop="toCompanyName">
              <el-select
                v-model="form.toCompanyName"
                placeholder="请选择拨入单位"
                filterable
                @change="onToCompanyChange"
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
            <el-form-item label="转账金额" prop="transferAmount">
              <el-input-number
                v-model="form.transferAmount"
                placeholder="请输入转账金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转账日期" prop="transferDate">
              <el-date-picker
                v-model="form.transferDate"
                type="date"
                placeholder="请选择转账日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="银行账户" prop="bankAccount">
          <el-input v-model="form.bankAccount" placeholder="请输入银行账户" />
        </el-form-item>

        <el-form-item label="转账状态" prop="transferStatus">
          <el-select v-model="form.transferStatus" placeholder="请选择转账状态" disabled>
            <el-option label="待处理" :value="1" />
            <el-option label="处理中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
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
.fund-transfer-management {
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

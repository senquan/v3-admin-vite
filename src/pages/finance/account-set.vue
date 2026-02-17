<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface AccountSet {
  id: number
  accountSetName: string // 账套名称
  accountSetCode: string // 账套编号
  companyCode: string // 单位编号
  companyName: string // 单位名称
  fiscalYear: number // 会计年度
  currency: string // 本位币
  startDate: string // 启用日期
  endDate: string // 截止日期
  status: number // 状态：1-启用，2-停用
  accountingMethod: number // 记账方法：1-借贷记账法，2-增减记账法，3-收付记账法
  taxRate: number // 税率(%)
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增企业账套")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  accountSetName: "",
  companyName: "",
  status: undefined as number | undefined,
  fiscalYear: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<AccountSet[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  accountSetName: "",
  accountSetCode: "",
  companyCode: "",
  companyName: "",
  fiscalYear: new Date().getFullYear(),
  currency: "CNY",
  startDate: "",
  endDate: "",
  status: 1,
  accountingMethod: 1,
  taxRate: undefined as number | undefined,
  remark: ""
})

const rules = reactive<FormRules>({
  accountSetName: [{ required: true, message: "请输入账套名称", trigger: "blur" }],
  companyName: [{ required: true, message: "请选择单位", trigger: "change" }],
  fiscalYear: [{ required: true, message: "请选择会计年度", trigger: "change" }],
  startDate: [{ required: true, message: "请选择启用日期", trigger: "change" }],
  taxRate: [{ required: true, message: "请输入税率", trigger: "blur" }]
})

// 获取账套状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "启用", 2: "停用" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取账套状态标签类型
function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 获取记账方法标签
function getAccountingMethodLabel(method: number) {
  const labels = { 1: "借贷记账法", 2: "增减记账法", 3: "收付记账法" }
  return labels[method as keyof typeof labels] || "未知"
}

// 生成账套编号
function generateAccountSetCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  form.accountSetCode = `AS${year}${month}${day}${random}`
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
                accountSetName: "2024年主账套",
                accountSetCode: "AS202401010001",
                companyCode: "SH001",
                companyName: "上海工程局",
                fiscalYear: 2024,
                currency: "CNY",
                startDate: "2024-01-01",
                endDate: "2024-12-31",
                status: 1,
                accountingMethod: 1,
                taxRate: 13.0,
                remark: "2024年度主账套",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 2,
                accountSetName: "2023年旧账套",
                accountSetCode: "AS202312310001",
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                fiscalYear: 2023,
                currency: "CNY",
                startDate: "2023-01-01",
                endDate: "2023-12-31",
                status: 2,
                accountingMethod: 1,
                taxRate: 13.0,
                remark: "2023年度账套（已结转）",
                createdBy: "admin",
                createdAt: "2023-12-31T00:00:00Z"
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
    accountSetName: "",
    companyName: "",
    status: undefined,
    fiscalYear: undefined
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
function handleEdit(row: AccountSet) {
  dialogTitle.value = "编辑企业账套"
  Object.assign(form, {
    id: row.id,
    accountSetName: row.accountSetName,
    accountSetCode: row.accountSetCode,
    companyCode: row.companyCode,
    companyName: row.companyName,
    fiscalYear: row.fiscalYear,
    currency: row.currency,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    accountingMethod: row.accountingMethod,
    taxRate: row.taxRate,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: AccountSet) {
  try {
    await ElMessageBox.confirm(`确定要删除账套 ${row.accountSetName} 吗？`, "提示", {
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

// 启用/停用账套
async function toggleStatus(row: AccountSet) {
  try {
    const newStatus = row.status === 1 ? 2 : 1
    const statusText = row.status === 1 ? "停用" : "启用"

    await ElMessageBox.confirm(`确定要${statusText}账套 ${row.accountSetName} 吗？`, "提示", {
      type: "warning"
    })

    // 模拟状态切换API调用
    await new Promise(resolve => setTimeout(resolve, 500))

    // 更新本地数据
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value[index].status = newStatus
    }

    ElMessage.success(`${statusText}成功`)
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("操作失败")
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
    accountSetName: "",
    accountSetCode: "",
    companyCode: "",
    companyName: "",
    fiscalYear: new Date().getFullYear(),
    currency: "CNY",
    startDate: "",
    endDate: "",
    status: 1,
    accountingMethod: 1,
    taxRate: undefined,
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
  <div class="account-set-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="账套名称">
          <el-input v-model="searchForm.accountSetName" placeholder="请输入账套名称" />
        </el-form-item>
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="会计年度">
          <el-input v-model="searchForm.fiscalYear" placeholder="请输入会计年度" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增账套
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
        <el-table-column prop="accountSetCode" label="账套编号" width="160" align="center" />
        <el-table-column prop="accountSetName" label="账套名称" min-width="150" />
        <el-table-column prop="companyName" label="所属单位" min-width="150" />
        <el-table-column prop="fiscalYear" label="会计年度" width="100" align="center" />
        <el-table-column prop="currency" label="本位币" width="80" align="center" />
        <el-table-column prop="startDate" label="启用日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.startDate ? new Date(row.startDate).toLocaleDateString() : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="截止日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.endDate ? new Date(row.endDate).toLocaleDateString() : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="accountingMethod" label="记账方法" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">
              {{ getAccountingMethodLabel(row.accountingMethod) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="taxRate" label="税率(%)" width="100" align="center">
          <template #default="{ row }">
            {{ row.taxRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)" size="small">
              编辑
            </el-button>
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
              size="small"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
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
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账套名称" prop="accountSetName">
              <el-input v-model="form.accountSetName" placeholder="请输入账套名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账套编号" prop="accountSetCode">
              <el-input v-model="form.accountSetCode" placeholder="请输入账套编号">
                <template #append>
                  <el-button @click="generateAccountSetCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属单位" prop="companyName">
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
            <el-form-item label="会计年度" prop="fiscalYear">
              <el-input-number
                v-model="form.fiscalYear"
                placeholder="请输入会计年度"
                :min="2000"
                :max="2100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="本位币" prop="currency">
              <el-select v-model="form.currency" placeholder="请选择本位币">
                <el-option label="人民币(CNY)" value="CNY" />
                <el-option label="美元(USD)" value="USD" />
                <el-option label="欧元(EUR)" value="EUR" />
                <el-option label="港币(HKD)" value="HKD" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记账方法" prop="accountingMethod">
              <el-select v-model="form.accountingMethod" placeholder="请选择记账方法">
                <el-option label="借贷记账法" :value="1" />
                <el-option label="增减记账法" :value="2" />
                <el-option label="收付记账法" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="启用日期" prop="startDate">
              <el-date-picker
                v-model="form.startDate"
                type="date"
                placeholder="请选择启用日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期" prop="endDate">
              <el-date-picker
                v-model="form.endDate"
                type="date"
                placeholder="请选择截止日期"
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
                <el-option label="启用" :value="1" />
                <el-option label="停用" :value="2" />
              </el-select>
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
.account-set-management {
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

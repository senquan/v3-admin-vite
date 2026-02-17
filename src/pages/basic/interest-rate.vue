<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface InterestRate {
  id: number
  rateType: number // 利率类型：1-存款利率，2-贷款利率，3-基准利率，4-贴现利率
  rateCategory: string // 利率类别
  rateName: string // 利率名称
  rateValue: number // 利率值(%)
  effectiveDate: string // 生效日期
  expiryDate: string // 失效日期
  status: number // 状态：1-生效，2-失效
  currency: string // 币种
  term: number // 期限(月)
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增利率配置")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  rateName: "",
  rateType: undefined as number | undefined,
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<InterestRate[]>([])

const form = reactive({
  id: undefined as number | undefined,
  rateType: 1,
  rateCategory: "",
  rateName: "",
  rateValue: undefined as number | undefined,
  effectiveDate: "",
  expiryDate: "",
  status: 1,
  currency: "CNY",
  term: 0,
  remark: ""
})

const rules = reactive<FormRules>({
  rateType: [{ required: true, message: "请选择利率类型", trigger: "change" }],
  rateName: [{ required: true, message: "请输入利率名称", trigger: "blur" }],
  rateValue: [{ required: true, message: "请输入利率值", trigger: "blur" }],
  effectiveDate: [{ required: true, message: "请选择生效日期", trigger: "change" }],
  currency: [{ required: true, message: "请选择币种", trigger: "change" }]
})

// 获取利率类型标签
function getRateTypeLabel(type: number) {
  const labels = { 1: "存款利率", 2: "贷款利率", 3: "基准利率", 4: "贴现利率" }
  return labels[type as keyof typeof labels] || "未知"
}

// 获取利率类型标签类型
function getRateTypeType(type: number) {
  const types = { 1: "primary", 2: "danger", 3: "warning", 4: "info" }
  return types[type as keyof typeof types] || "info"
}

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "生效", 2: "失效" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取状态标签类型
function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 格式化利率值
function formatRate(rate: number) {
  return rate?.toFixed(4) || "0.0000"
}

// 格式化日期
function formatDate(date: string) {
  return date ? new Date(date).toLocaleDateString() : "-"
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
                rateType: 1,
                rateCategory: "定期存款",
                rateName: "一年期定期存款利率",
                rateValue: 1.50,
                effectiveDate: "2024-01-01",
                expiryDate: "2024-12-31",
                status: 1,
                currency: "CNY",
                term: 12,
                remark: "央行基准利率调整",
                createdBy: "admin",
                createdAt: "2023-12-31T00:00:00Z"
              },
              {
                id: 2,
                rateType: 2,
                rateCategory: "企业贷款",
                rateName: "一年期企业贷款利率",
                rateValue: 4.35,
                effectiveDate: "2024-01-01",
                expiryDate: "2024-12-31",
                status: 1,
                currency: "CNY",
                term: 12,
                remark: "LPR基础上浮10个基点",
                createdBy: "admin",
                createdAt: "2023-12-31T00:00:00Z"
              },
              {
                id: 3,
                rateType: 3,
                rateCategory: "基准利率",
                rateName: "央行基准利率",
                rateValue: 3.85,
                effectiveDate: "2024-01-01",
                expiryDate: "2024-12-31",
                status: 1,
                currency: "CNY",
                term: 0,
                remark: "央行最新基准利率",
                createdBy: "admin",
                createdAt: "2023-12-31T00:00:00Z"
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

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    rateName: "",
    rateType: undefined,
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
function handleEdit(row: InterestRate) {
  dialogTitle.value = "编辑利率配置"
  Object.assign(form, {
    id: row.id,
    rateType: row.rateType,
    rateCategory: row.rateCategory,
    rateName: row.rateName,
    rateValue: row.rateValue,
    effectiveDate: row.effectiveDate,
    expiryDate: row.expiryDate,
    status: row.status,
    currency: row.currency,
    term: row.term,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: InterestRate) {
  try {
    await ElMessageBox.confirm(`确定要删除利率配置 ${row.rateName} 吗？`, "提示", {
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
    rateType: 1,
    rateCategory: "",
    rateName: "",
    rateValue: undefined,
    effectiveDate: "",
    expiryDate: "",
    status: 1,
    currency: "CNY",
    term: 0,
    remark: ""
  })
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="interest-rate-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="利率名称">
          <el-input v-model="searchForm.rateName" placeholder="请输入利率名称" />
        </el-form-item>
        <el-form-item label="利率类型">
          <el-select v-model="searchForm.rateType" placeholder="请选择类型" clearable>
            <el-option label="存款利率" :value="1" />
            <el-option label="贷款利率" :value="2" />
            <el-option label="基准利率" :value="3" />
            <el-option label="贴现利率" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="生效" :value="1" />
            <el-option label="失效" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效日期">
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
            新增利率
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
        <el-table-column prop="rateName" label="利率名称" min-width="180" />
        <el-table-column prop="rateType" label="利率类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRateTypeType(row.rateType) as any">
              {{ getRateTypeLabel(row.rateType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rateCategory" label="利率类别" width="120" align="center" />
        <el-table-column prop="rateValue" label="利率值(%)" width="100" align="right">
          <template #default="{ row }">
            {{ formatRate(row.rateValue) }}%
          </template>
        </el-table-column>
        <el-table-column prop="term" label="期限(月)" width="90" align="center">
          <template #default="{ row }">
            {{ row.term > 0 ? row.term : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="currency" label="币种" width="80" align="center" />
        <el-table-column prop="effectiveDate" label="生效日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.effectiveDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="expiryDate" label="失效日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.expiryDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
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
            <el-form-item label="利率类型" prop="rateType">
              <el-select v-model="form.rateType" placeholder="请选择利率类型">
                <el-option label="存款利率" :value="1" />
                <el-option label="贷款利率" :value="2" />
                <el-option label="基准利率" :value="3" />
                <el-option label="贴现利率" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="利率类别" prop="rateCategory">
              <el-input v-model="form.rateCategory" placeholder="请输入利率类别" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="利率名称" prop="rateName">
              <el-input v-model="form.rateName" placeholder="请输入利率名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种" prop="currency">
              <el-select v-model="form.currency" placeholder="请选择币种">
                <el-option label="人民币(CNY)" value="CNY" />
                <el-option label="美元(USD)" value="USD" />
                <el-option label="欧元(EUR)" value="EUR" />
                <el-option label="港币(HKD)" value="HKD" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="利率值(%)" prop="rateValue">
              <el-input-number
                v-model="form.rateValue"
                placeholder="请输入利率值"
                :min="0"
                :max="100"
                :precision="4"
                :step="0.01"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期限(月)" prop="term">
              <el-input-number
                v-model="form.term"
                placeholder="请输入期限"
                :min="0"
                :max="360"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effectiveDate">
              <el-date-picker
                v-model="form.effectiveDate"
                type="date"
                placeholder="请选择生效日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期" prop="expiryDate">
              <el-date-picker
                v-model="form.expiryDate"
                type="date"
                placeholder="请选择失效日期"
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
                <el-option label="生效" :value="1" />
                <el-option label="失效" :value="2" />
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
.interest-rate-management {
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

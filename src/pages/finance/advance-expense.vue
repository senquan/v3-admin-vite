<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { formattedMoney, range } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { getAdvanceExpenses, getExpenseTypes } from "./apis"
import AdvanceImport from "./forms/_advance-import.vue"

interface AdvanceExpense {
  id: number
  advanceCode: string // 垫资编号
  expenseType: string // 类型
  companyCode: string // 单位编号
  companyName: string // 单位名称
  businessYear: string // 年度
  amount: number // 垫资金额
  status: number // 状态：1-待确认，2-已确认，3-已删除
  remark: string
  details: any[]
  creator: any
  createdAt: string
  updator: any
  updatedAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const showDetailDrawer = ref(false)
const dialogTitle = ref("新增垫资")
const formRef = ref<FormInstance>()
const advanceImportRef = ref<any>(null)
const currentRow = ref<AdvanceExpense | null>(null)

const searchForm = reactive({
  keyword: "",
  status: 0,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<AdvanceExpense[]>([])
const newItemTableData = ref<any[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])
const expenseTypeMap = new Map<number, string>()
const expenseTypeOptions = ref<{ id: number, label: string }[]>([])

const isAmountDisabled = computed(() => {
  return expenseTypeMap.get(form.expenseType || 0) === "代垫费用"
})

const form = reactive({
  id: undefined as number | undefined,
  businessYear: new Date().getFullYear(),
  companyId: undefined as number | undefined,
  companyName: "",
  expenseType: undefined as number | undefined,
  amount: undefined as number | undefined,
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
  businessYear: [{ required: true, message: "请选择年度", trigger: "change" }],
  companyName: [{ required: true, message: "请选择单位", trigger: "change" }],
  expenseType: [{ required: true, message: "请选择类型", trigger: "change" }],
  amount: [{ required: true, message: "请输入金额", trigger: "blur" }],
  repaymentDate: [{ required: true, message: "请选择还款日期", trigger: "change" }],
  interestRate: [{ required: true, message: "请输入利率", trigger: "blur" }]
})

// 获取垫资状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "待确认", 2: "已确认", 3: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取垫资状态标签类型
function getStatusType(status: number) {
  const types = { 1: "warning", 2: "success", 3: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status

    const response = await getAdvanceExpenses(params)

    if (response.code === 0) {
      let count = 1
      const data = response.data.records.map((item: any) => ({
        ...item,
        seq: count++
      })) || []
      pagination.total = response.data.total || 0
      tableData.value = data
    } else {
      tableData.value = []
    }
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
async function fetchExpenseTypes() {
  try {
    const response = await getExpenseTypes()
    response.data.records.forEach((item: any) => {
      expenseTypeMap.set(item.id, item.name)
    })
    expenseTypeOptions.value = Array.from(expenseTypeMap.entries()).map(([id, label]) => ({ id, label }))
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
    keyword: "",
    status: 0,
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
function handleDetail(row: AdvanceExpense) {
  currentRow.value = row
  showDetailDrawer.value = true
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
    amount: undefined,
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
    form.companyName = company.companyName
  }
}

async function handleImport() {
  advanceImportRef.value?.open()
}

function importSuccess() {
  handleSearch()
}

async function handleConfirm() {
  // const selected = activeTab.value === "up"
  //   ? upTableRef.value?.getSelectionRows().filter((row: any) => row.transferStatus === 1)
  //   : downTableRef.value?.getSelectionRows().filter((row: any) => row.transferStatus === 1)
  // if (selected.length === 0) {
  //   ElMessage.warning("请选择待确认的记录")
  //   return
  // }

  // try {
  //   const response = await transferConfirm({
  //     ids: selected.map((r: any) => r.id),
  //     type: activeTab.value === "up" ? 1 : 2
  //   })

  //   if (response.code === 0) {
  //     ElMessage.success(response.message || "确认成功")
  //     fetchData()
  //   } else {
  //     ElMessage.error(response.message || "确认失败")
  //   }
  // } catch (error: any) {
  //   ElMessage.error(error.message || "确认失败")
  // }
}

function deleteRow(index: number) {
  newItemTableData.value.splice(index, 1)
}

function onAddItem() {
  newItemTableData.value.push({
    name: "",
    amount: 0
  })
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
  fetchExpenseTypes()
})
</script>

<template>
  <div class="advance-expense-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入单位名称模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" :value="0" />
            <el-option label="待确认" :value="1" />
            <el-option label="已生效" :value="2" />
            <el-option label="已删除" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增垫资
          </el-button>
          <el-button type="primary" @click="handleImport">
            <SvgIcon name="import" />
            导入
          </el-button>
          <el-button type="warning" @click="handleConfirm">批量确认</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="advanceCode" label="垫资编号" width="140" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="expenseType" label="类型" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ expenseTypeMap.get(row.expenseType) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column prop="businessYear" label="年度" width="100" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button type="danger" @click="handleDelete(row)">
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

    <!-- 新增对话框 -->
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
            <el-form-item label="年度" prop="businessYear">
              <el-select v-model="form.businessYear" placeholder="请选择年度">
                <el-option v-for="value in range(new Date().getFullYear(), 10)" :key="value" :value="value" />
              </el-select>
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
            <el-form-item label="类型" prop="expenseType">
              <el-select
                v-model="form.expenseType"
                placeholder="请选择类型"
              >
                <el-option
                  v-for="item in expenseTypeOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number
                v-model="form.amount"
                placeholder="请输入垫资金额"
                :min="0"
                :step="10000"
                controls-position="right"
                :readonly="isAmountDisabled"
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

        <el-table :data="newItemTableData" style="width: 100%" max-height="300">
          <el-table-column fixed prop="name" label="费用名称" width="300" />
          <el-table-column prop="amount" label="金额" min-width="200" />
          <el-table-column fixed="right" label="操作" width="120">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click.prevent="deleteRow(scope.$index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button class="mt-4" style="width: 100%" @click="onAddItem">
          添加费用
        </el-button>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="showDetailDrawer"
      :title="`代垫费用明细 - ${currentRow?.advanceCode}`"
      size="35%"
    >
      <div v-if="currentRow">
        <el-descriptions
          title="基本信息"
          :column="2"
          border
        >
          <el-descriptions-item label-width="120px">
            <template #label>
              <div class="cell-item">
                年度
              </div>
            </template>
            {{ currentRow?.businessYear }}
          </el-descriptions-item>
          <el-descriptions-item label-width="120px">
            <template #label>
              <div class="cell-item">
                单位名称
              </div>
            </template>
            {{ currentRow?.companyName }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                类型
              </div>
            </template>
            {{ currentRow?.expenseType }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                金额
              </div>
            </template>
            {{ currentRow?.amount }}
          </el-descriptions-item>
          <el-descriptions-item :span="2">
            <template #label>
              <div class="cell-item">
                备注
              </div>
            </template>
            {{ currentRow?.remark }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                创建人
              </div>
            </template>
            {{ currentRow?.creator?.name }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                创建日期
              </div>
            </template>
            {{ formatDateTime(currentRow?.createdAt, "YYYY-MM-DD") }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                修改人
              </div>
            </template>
            {{ currentRow?.updator?.name }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                修改日期
              </div>
            </template>
            {{ formatDateTime(currentRow?.updatedAt, "YYYY-MM-DD") }}
          </el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <el-descriptions
          v-if="currentRow?.details && currentRow?.details.length > 0"
          title="代垫费用明细"
          :column="1"
          border
        >
          <el-descriptions-item v-for="(detail, index) in currentRow?.details" :key="index" label-width="200px" align="right">
            <template #label>
              <div class="cell-item">
                {{ detail.expenseType?.name }}
              </div>
            </template>
            {{ formattedMoney(detail.amount) }}
          </el-descriptions-item>
          <el-descriptions-item align="right">
            <template #label>
              <div class="cell-item">
                合计
              </div>
            </template>
            {{ formattedMoney(currentRow?.amount) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <AdvanceImport
      ref="advanceImportRef"
      @success="importSuccess"
    />
  </div>
</template>

<style scoped>
.advance-expense-management {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px 20px 0 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.el-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
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

.cell-item {
  display: flex;
  align-items: center;
}
</style>

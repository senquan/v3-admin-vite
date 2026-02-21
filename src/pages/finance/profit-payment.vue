<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { formattedMoney, range } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { getCompanies, getProfitPayments, profitConfirm } from "./apis"
import ProfitImport from "./forms/_profit-import.vue"

interface ProfitPayment {
  id: number
  businessYear: number
  company: any
  dueProfit1: number
  dueProfit2: number
  actualAmount: number
  remainingProfit: number
  creator: any
  createdAt: string
  updater: any
  updatedAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogStatus = ref("create")
const formRef = ref<FormInstance>()
const profitImportRef = ref<any>(null)
const currentRow = ref<ProfitPayment | null>(null)

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

const tableRef = ref<any>(null)
const tableData = ref<ProfitPayment[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  businessYear: undefined as number | undefined,
  companyId: undefined as number | undefined,
  dueProfit1: undefined as number | undefined,
  dueProfit2: undefined as number | undefined
})

const rules = reactive<FormRules>({
  businessYear: [{ required: true, message: "请选择年度", trigger: "change" }],
  companyId: [{ required: true, message: "请选择单位", trigger: "change" }],
  dueProfit1: [{ required: true, message: "请输入金额", trigger: "blur" }],
  dueProfit2: [{ required: true, message: "请输入金额", trigger: "blur" }]
})

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "待确认", 2: "已确认", 3: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
}

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

    const response = await getProfitPayments(params)

    if (response.code === 0) {
      let count = 1
      const data = response.data.records.map((item: any) => ({
        ...item,
        remainingProfit: Number(item.dueProfit1) + Number(item.dueProfit2) - Number(item.actualAmount),
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
async function fetchCompanies() {
  try {
    const response = await getCompanies()
    if (response.code === 0) {
      companyOptions.value = response.data.records
    } else {
      companyOptions.value = []
    }
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

function handleCreate() {
  dialogStatus.value = "create"
  resetForm()
  showCreateDialog.value = true
}

// 编辑
function handleEdit(row: ProfitPayment) {
  dialogStatus.value = "edit"
  currentRow.value = row
  Object.assign(form, {
    id: row.id,
    businessYear: row.businessYear,
    companyId: row.company?.id || "",
    dueProfit1: Number(row.dueProfit1),
    dueProfit2: Number(row.dueProfit2)
  })
  showCreateDialog.value = true
}

function handleTurnOver(row: ProfitPayment) {
  console.log("上缴:", row)
}

function handleDetail(row: ProfitPayment) {
  console.log("详情:", row)
}

async function handleConfirm() {
  const selected = tableRef.value?.getSelectionRows().filter((row: any) => row.status === 1)
  if (selected.length === 0) {
    ElMessage.warning("请选择待确认的记录")
    return
  }

  try {
    const response = await profitConfirm({
      ids: selected.map((r: any) => r.id)
    })

    if (response.code === 0) {
      ElMessage.success(response.message || "确认成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "确认失败")
    }
  } catch (error: any) {
    ElMessage.error(error.message || "确认失败")
  }
}

// 删除
async function handleDelete(row: ProfitPayment) {
  try {
    await ElMessageBox.confirm(`确定要删除利润上缴记录 ${row.businessYear} ${row.company?.companyName} 吗？`, "提示", {
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
    businessYear: undefined,
    companyId: undefined,
    dueProfit1: undefined,
    dueProfit2: undefined
  })
}

async function handleImport() {
  profitImportRef.value?.open()
}

function importSuccess() {
  handleSearch()
}

// 初始化
onMounted(() => {
  fetchData()
  fetchCompanies()
})
</script>

<template>
  <div class="profit-payment-management">
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
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增上缴
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
        ref="tableRef"
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column width="50" type="selection" align="center" />
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" min-width="150" />
        <el-table-column prop="dueProfit1" label="第一次应缴利润" width="160" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.dueProfit1) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueProfit2" label="第二次应缴" width="160" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.dueProfit2) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingProfit" label="合计（剩余应缴）" width="160" align="center">
          <template #default="{ row }">
            {{ formattedMoney(row.remainingProfit) }}
          </template>
        </el-table-column>
        <el-table-column prop="businessYear" label="年度" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 2 && row.remainingProfit > 0" type="success" @click="handleTurnOver(row)">
              上缴
            </el-button>
            <el-button type="primary" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button type="primary" @click="handleEdit(row)">
              编辑
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="`利润上缴计划${dialogStatus === 'create' ? '新增' : '编辑'}`"
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
                v-model="form.companyId"
                placeholder="请选择单位"
                filterable
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
            <el-form-item label="第一次应缴利润" prop="dueProfit1" label-width="130px">
              <el-input-number
                v-model="form.dueProfit1"
                placeholder="请输入金额"
                :min="0"
                :precision="2"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="第二次应缴利润" prop="dueProfit2" label-width="130px">
              <el-input-number
                v-model="form.dueProfit2"
                placeholder="请输入金额"
                :min="0"
                :precision="2"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="dialogStatus === 'edit'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="应缴（合计）">
                {{ formattedMoney(Number(currentRow?.dueProfit1) + Number(currentRow?.dueProfit2)) }}
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="已缴">
                {{ formattedMoney(currentRow?.actualAmount || 0) }}
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="剩余应缴">
                {{ formattedMoney(currentRow?.remainingProfit || 0) }}
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="创建人">
                {{ currentRow?.creator?.name || '-' }}
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建日期">
                {{ formatDateTime(currentRow?.createdAt) }}
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="修改人">
                {{ currentRow?.updater?.name || '-' }}
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="修改日期">
                {{ formatDateTime(currentRow?.updatedAt) }}
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <ProfitImport
      ref="profitImportRef"
      @success="importSuccess"
    />
  </div>
</template>

<style scoped>
.profit-payment-management {
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
</style>

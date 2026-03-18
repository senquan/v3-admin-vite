<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { CompanyTree } from "../basic/apis/type"
import { formattedMoney, range } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { getCompaniesTree } from "../basic/apis"
import {
  createProfitPayment,
  createTurnOver,
  deleteProfitPaymentBatch,
  getProfitPaymentLogs,
  getProfitPayments,
  profitConfirm,
  updateProfitPayment
} from "./apis"
import ModalForm from "./forms/_batch_detail.vue"
import ProfitImport from "./forms/_profit-import.vue"

interface ProfitPayment {
  id: number
  businessYear: number
  company: any
  dueProfit1: number
  dueProfit2: number
  actualAmount: number
  remainingProfit: number
  status: number
  creator: any
  createdAt: string
  updater: any
  updatedAt: string
}

interface ProfitPaymentLog {
  id: number
  amount: number
  creator: any
  createdAt: string
}

const loading = ref(false)
const logLoading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogStatus = ref("create")
const isTurnOver = ref(false)
const formRef = ref<FormInstance>()
const profitImportRef = ref<any>(null)
const batchFormRef = ref<InstanceType<typeof ModalForm>>()
const batchFormVisibility = ref(false)
const currentRow = ref<ProfitPayment | null>(null)
const yearOptions = range(new Date().getFullYear(), 10)
const multipleSelection = ref<ProfitPayment[]>([])

const searchForm = reactive({
  keyword: "",
  status: 0,
  dateRange: [] as string[],
  amountFrom: undefined,
  amountTo: undefined,
  year: undefined,
  sort: ""
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableRef = ref<any>(null)
const tableData = ref<ProfitPayment[]>([])
const tableLogData = ref<ProfitPaymentLog[]>([])
const companyOptions = ref<CompanyTree[]>([])

const form = reactive({
  id: undefined as number | undefined,
  businessYear: undefined as number | undefined,
  companyId: undefined as number | undefined,
  dueProfit1: undefined as number | undefined,
  dueProfit2: undefined as number | undefined,
  currentTurnOverAmount: undefined as number | undefined
})

const rules = reactive<FormRules>({
  businessYear: [{ required: true, message: "请选择年度", trigger: "change" }],
  companyId: [{ required: true, message: "请选择单位", trigger: "change" }],
  dueProfit1: [{ required: true, message: "请输入金额", trigger: "blur" }],
  dueProfit2: [{ required: true, message: "请输入金额", trigger: "blur" }]
})

watch(showCreateDialog, (newVal) => {
  if (!newVal) {
    resetForm()
    isTurnOver.value = false
  }
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
      size: pagination.size,
      amountFrom: searchForm.amountFrom || 0,
      amountTo: searchForm.amountTo || 0,
      sort: searchForm.sort
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.year) params.year = searchForm.year

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

// 获取利润支付日志
async function fetchProfitPaymentLog(id: number) {
  logLoading.value = true
  try {
    const response = await getProfitPaymentLogs({ id })
    if (response.code === 0) {
      let count = 1
      const data = response.data.records.map((item: any) => ({
        ...item,
        seq: count++
      })) || []
      tableLogData.value = data
    } else {
      tableLogData.value = []
    }
  } catch (error) {
    ElMessage.error(`获取上缴记录失败: ${error}`)
  } finally {
    logLoading.value = false
  }
}

// 获取单位列表
async function getCompanies() {
  try {
    if (companyOptions.value.length === 0) {
      const response = await getCompaniesTree()
      companyOptions.value = response.data.records
    }
  } catch (error) {
    console.error("获取上级单位失败:", error)
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleSortChange(column: any) {
  const { prop, order } = column
  searchForm.sort = (order === "descending" ? "-" : "+") + prop
  fetchData()
}

function handleSelectionChange(selection: ProfitPayment[]) {
  multipleSelection.value = selection
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    keyword: "",
    status: 0,
    dateRange: [],
    amountFrom: undefined,
    amountTo: undefined,
    year: undefined,
    sort: ""
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
  currentRow.value = null
  getCompanies().then(() => {
    showCreateDialog.value = true
  })
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
  getCompanies().then(() => {
    showCreateDialog.value = true
  })
  fetchProfitPaymentLog(row.id)
}

function handleTurnOver(row: ProfitPayment) {
  isTurnOver.value = true
  handleEdit(row)
}

function handleDetail(row: ProfitPayment) {
  handleEdit(row)
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

function handleBatchDelete() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning("请选择要删除的项目")
    return
  }

  return ElMessageBox.confirm(
    `确定要删除已选中的 ${multipleSelection.value.length} 个项目名吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    return deleteProfitPaymentBatch({
      ids: multipleSelection.value.map(item => Number(item.id))
    }).then((response) => {
      if (response.code === 0) {
        ElMessage.success("删除成功")
        fetchData()
      } else {
        ElMessage.error(response.message || "删除失败")
      }
    }).catch((error) => {
      ElMessage.error("删除失败")
      console.error(error)
    })
  }).catch((error) => {
    if (error !== "cancel") {
      console.error(error)
    }
  })
}

// 删除
async function handleDelete(row: ProfitPayment) {
  try {
    await ElMessageBox.confirm(`确定要删除利润上缴记录 ${row.businessYear} ${row.company?.companyName} 吗？`, "提示", {
      type: "warning"
    })

    fetchProfitPaymentLog(row.id).then(async () => {
      if (tableLogData.value.length > 0) {
        await ElMessageBox.confirm(`${row.businessYear} 年度 ${row.company?.companyName}存在上缴记录，请再次确认是否进行删除？`, "提示", {
          type: "warning"
        }).then(async () => {
          doDelete(row.id)
        })
      } else {
        doDelete(row.id)
      }
    })
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

async function doDelete(id: number) {
  try {
    const response = await deleteProfitPaymentBatch(id)
    if (response.code === 0) {
      ElMessage.success("删除成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "删除失败")
    }
  } catch (error: any) {
    ElMessage.error(error.message || "删除失败")
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const data = { ...form }
    const response = dialogStatus.value === "create"
      ? await createProfitPayment(data)
      : isTurnOver.value
        ? await createTurnOver({ id: form.id, amount: form.currentTurnOverAmount })
        : await updateProfitPayment(data)

    if (response.code === 0) {
      ElMessage.success(form.id ? "更新成功" : "创建成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "提交失败")
    }
  } catch (error: any) {
    console.error("提交失败:", error)
    ElMessage.error(error.message || "提交失败")
  } finally {
    submitLoading.value = false
    showCreateDialog.value = false
  }
}

function handleBatchDetail(batchNo: string) {
  batchFormVisibility.value = true
  nextTick(() => {
    batchFormRef.value?.open({ batchNo: batchNo as string })
  })
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
    dueProfit2: undefined,
    currentTurnOverAmount: undefined
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
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 90px;">
            <el-option label="全部" :value="0" />
            <el-option label="待确认" :value="1" />
            <el-option label="已生效" :value="2" />
            <el-option label="已删除" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额范围">
          <el-input v-model="searchForm.amountFrom" clearable style="width: 70px;" />
          &nbsp;&nbsp;到&nbsp;&nbsp;
          <el-input v-model="searchForm.amountTo" clearable style="width: 70px;" />
        </el-form-item>
        <el-form-item label="年度">
          <el-select
            v-model="searchForm.year"
            placeholder="请选择年度"
            clearable
            @change="fetchData"
            style="width: 100px;"
          >
            <el-option v-for="value in yearOptions" :key="value" :value="value" />
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
            导入上缴
          </el-button>
          <el-button type="warning" v-if="multipleSelection.length > 0" @click="handleConfirm">批量确认</el-button>
          <el-button type="danger" v-if="multipleSelection.length > 0" @click="handleBatchDelete">批量删除</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        ref="tableRef"
        :data="tableData"
        border
        stripe
        v-loading="loading"
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column width="50" type="selection" align="center" />
        <el-table-column prop="seq" label="序号" width="60" align="center" />
        <el-table-column prop="company.companyName" label="单位名称" min-width="150" />
        <el-table-column prop="dueProfit1" label="第一次应缴利润" width="160" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formattedMoney(row.dueProfit1) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueProfit2" label="第二次应缴" width="160" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formattedMoney(row.dueProfit2) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingProfit" label="合计（剩余应缴）" width="170" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formattedMoney(row.remainingProfit) }}
          </template>
        </el-table-column>
        <el-table-column prop="businessYear" label="年度" width="100" align="center" sortable="custom" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="clickable" @click="handleBatchDetail(row.batchNo)">{{ row.batchNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="310" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleDetail(row)">
              详情
            </el-button>
            <el-button v-if="row.status === 2 && row.remainingProfit > 0" type="success" @click="handleTurnOver(row)">
              上缴
            </el-button>
            <el-button v-if="row.status === 1" type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-if="row.status === 1" type="danger" @click="handleDelete(row)">
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
            <el-form-item label="年度" prop="businessYear">
              <el-select
                v-model="form.businessYear"
                placeholder="请选择年度"
                :disabled="isTurnOver || currentRow?.status === 2"
              >
                <el-option v-for="value in yearOptions" :key="value" :value="value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位名称" prop="companyId">
              <el-tree-select
                v-model="form.companyId"
                :data="companyOptions"
                placeholder="请选择单位"
                :render-after-expand="false"
                :check-strictly="true"
                clearable
                :disabled="isTurnOver || currentRow?.status === 2"
              />
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
                :disabled="isTurnOver || currentRow?.status === 2"
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
                :disabled="isTurnOver || currentRow?.status === 2"
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

          <div v-if="isTurnOver">
            <el-divider content-position="right">本次上缴信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="本次上缴金额" prop="currentTurnOverAmount" label-width="130px">
                  <el-input-number
                    v-model="form.currentTurnOverAmount"
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
          </div>

          <el-divider content-position="right">上缴记录</el-divider>

          <el-table
            v-if="tableLogData.length > 0"
            :data="tableLogData"
            border
            max-height="300px"
            v-loading="logLoading"
            header-cell-class-name="header-cell-fix"
          >
            <el-table-column prop="seq" label="序号" width="60" align="center" />
            <el-table-column prop="amount" label="上缴金额" min-width="120" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="creator.name" label="填报人" width="160" align="center" />
            <el-table-column prop="createdAt" label="填报时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">关闭</el-button>
        <el-button v-if="currentRow?.status === 1 || isTurnOver || dialogStatus === 'create'" type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <ProfitImport
      ref="profitImportRef"
      @success="importSuccess"
    />

    <ModalForm ref="batchFormRef" @close="batchFormVisibility = false" v-if="batchFormVisibility" />
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

.clickable {
  cursor: pointer;
  color: var(--el-color-primary);
}
</style>

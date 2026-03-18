<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { CompanyTree } from "../basic/apis/type"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { getCompaniesTree } from "../basic/apis"
import { createFixedDeposit, deleteFixedDepositBatch, depositConfirm, getFixedDeposits, releaseFixedDeposit } from "./apis"
import ModalForm from "./forms/_batch_detail.vue"
import DepositImport from "./forms/_deposit-import.vue"

interface FixedDeposit {
  id: number
  depositCode: string
  depositType: number
  companyId: number
  company: { companyName: string }
  depositAmount: number
  depositPeriod: number
  interestRate: number
  startDate: string
  endDate: string
  amount: number
  remainingAmount: number
  earlyRelease: number
  releaseDate: string
  interestDays: number
  releaseAmount: number
  status: number
  creator: any
  createdAt: string
  updater: { name: string }
  updatedAt: string
  remark: string
  lastInterestDate?: string
}

const loading = ref(false)
const selectedRow = ref<FixedDeposit | null>(null)
const multipleSelection = ref<FixedDeposit[]>([])
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增存款")
const formRef = ref<FormInstance>()
const depositImportRef = ref<any>([])
const batchFormRef = ref<InstanceType<typeof ModalForm>>()
const batchFormVisibility = ref(false)
const isCreate = ref(false)
const companyOptions = ref<CompanyTree[]>([])
const statusOptions = { 1: "待确认", 2: "已生效", 3: "已删除" }

const systemParamsStore = useSystemParamsStore()
const depositPeriodMap = systemParamsStore.getArrayDict(3).filter((item: any) => item.name !== "活期").reduce((prev, cur) => {
  prev[cur.value] = cur.name
  return prev
}, {} as Record<number, string>)
const depositTypeMap = systemParamsStore.getArrayDict(1).reduce((prev, cur) => {
  prev[cur.value] = cur.name
  return prev
}, {} as Record<number, string>)

const searchForm = reactive({
  keyword: "",
  status: 0,
  dateRange: [] as string[],
  amountFrom: undefined,
  amountTo: undefined,
  sort: ""
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableRef = ref<any>(null)
const tableData = ref<FixedDeposit[]>([])

const form = reactive({
  id: undefined as number | undefined,
  depositCode: "" as string,
  depositType: undefined as number | undefined,
  companyId: undefined as number | undefined,
  amount: 0,
  depositPeriod: undefined as number | undefined,
  startDate: "" as string,
  remark: "" as string,
  earlyRelease: 0,
  releaseDate: "" as string,
  interestDays: 0,
  releaseAmount: 0
})

const rules = computed<FormRules>(() => {
  const isEarlyRelease = form.earlyRelease === 1
  const isCreateDeposit = isCreate.value
  return {
    depositCode: [
      { required: isCreateDeposit, message: "请输入存款编号", trigger: "blur" }
    ],
    depositType: [
      { required: isCreateDeposit, message: "请选择存款类型", trigger: "change" }
    ],
    companyId: [
      { required: isCreateDeposit, message: "请选择公司", trigger: "change" }
    ],
    amount: [
      { required: isCreateDeposit, message: "请输入金额", trigger: "blur" }
    ],
    depositPeriod: [
      { required: isCreateDeposit, message: "请选择定存期限", trigger: "change" }
    ],
    startDate: [
      { required: isCreateDeposit, message: "请选择开始日期", trigger: "change" }
    ],
    releaseDate: [
      { required: isEarlyRelease, message: "请选择释放日期", trigger: "change" }
    ],
    interestDays: [
      { required: isEarlyRelease, message: "请输入已计息天数", trigger: "blur" }
    ],
    releaseAmount: [
      { required: isEarlyRelease, message: "请输入释放金额", trigger: "blur" },
      {
        validator: (rule: any, value: any, callback: any) => {
          if (isEarlyRelease && (!value || value <= 0)) {
            callback(new Error("释放金额必须大于0"))
          } else {
            callback()
          }
        },
        trigger: "blur"
      }
    ]
  }
})

const remainingAmount = ref(0)

function getStatusLabel(status: number) {
  return statusOptions[status as keyof typeof statusOptions] || "未知"
}

function getStatusType(status: number) {
  const types = { 1: "warning", 2: "success", 3: "danger" }
  return types[status as keyof typeof types] || "info"
}

function formatDate(date: string) {
  return date ? formatDateTime(date, "YYYY-MM-DD") : "-"
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      status: Number(searchForm.status),
      startDate: "",
      endDate: "",
      amountFrom: searchForm.amountFrom || 0,
      amountTo: searchForm.amountTo || 0,
      sort: searchForm.sort
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    const response = await getFixedDeposits(params)

    const result: any = response
    let count = 1
    tableData.value = result.data.records.map((item: any) => {
      return {
        ...item,
        seq: count++
      }
    })
    pagination.total = result.data.total
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    companyName: "",
    status: 0,
    dateRange: [],
    amountFrom: undefined,
    amountTo: undefined,
    sort: ""
  })
  handleSearch()
}

function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

function handleSortChange(column: any) {
  const { prop, order } = column
  searchForm.sort = (order === "descending" ? "-" : "+") + prop
  fetchData()
}

function handleSelectionChange(selection: FixedDeposit[]) {
  multipleSelection.value = selection
}

function handleCreate() {
  dialogTitle.value = "新增存款"
  resetForm()
  isCreate.value = true
  showCreateDialog.value = true
}

function handleRelease(row: FixedDeposit) {
  dialogTitle.value = "提前释放存款"
  selectedRow.value = row
  remainingAmount.value = row.remainingAmount
  Object.assign(form, {
    id: row.id,
    depositCode: row.depositCode,
    depositType: row.depositType,
    companyId: row.companyId,
    amount: row.amount,
    depositPeriod: row.depositPeriod,
    startDate: row.startDate || "",
    remark: row.remark || "",
    earlyRelease: row.earlyRelease,
    releaseDate: row.releaseDate || "",
    interestDays: row.interestDays || 0,
    releaseAmount: row.releaseAmount || 0
  })
  showCreateDialog.value = true
}

function handleBatchDelete() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning("请选择要删除的项目")
    return
  }

  const fileredSelection = multipleSelection.value.filter(item => item.status === 1)
  if (fileredSelection.length === 0) {
    ElMessage.warning("可删除的项目不存在")
    return
  }
  return ElMessageBox.confirm(
    `确定要删除已选中的 ${fileredSelection.length} 个项目名吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    return deleteFixedDepositBatch({
      ids: fileredSelection.map(item => Number(item.id))
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

async function handleDelete(row: FixedDeposit) {
  try {
    await ElMessageBox.confirm(`确定要删除存款记录 ${row.depositCode} 吗？`, "提示", {
      type: "warning"
    })
    const response = await deleteFixedDepositBatch({ ids: [row.id] })

    if (response.code === 0) {
      ElMessage.success("删除成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "删除失败")
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    if (form.earlyRelease === 1 && form.releaseDate === "") {
      ElMessage.error("请选择释放日期")
      return
    }
    if (form.earlyRelease === 1 && remainingAmount.value < 0) {
      ElMessage.error("释放金额不能大于剩余金额")
      return
    }

    submitLoading.value = true
    if (isCreate.value) {
      // 新增模式
      const response = await createFixedDeposit(form)
      if (response.code === 0) {
        ElMessage.success(response.message || "创建成功")
        showCreateDialog.value = false
        fetchData()
      } else {
        ElMessage.error(response.message || "创建失败")
      }
    } else if (form.earlyRelease === 1) {
      // 提前释放模式
      const response = await releaseFixedDeposit(form)
      if (response.code === 0) {
        ElMessage.success(response.message || "释放成功")
        showCreateDialog.value = false
        fetchData()
      } else {
        ElMessage.error(response.message || "释放失败")
      }
    } else {
      showCreateDialog.value = false
    }
  } catch (error) {
    console.error("提交失败:", error)
  } finally {
    submitLoading.value = false
  }
}

function handleImport() {
  depositImportRef.value?.open()
}

function importSuccess() {
  handleSearch()
}

function handleBatchDetail(batchNo: string) {
  batchFormVisibility.value = true
  nextTick(() => {
    batchFormRef.value?.open({ batchNo: batchNo as string })
  })
}

function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    depositCode: "",
    depositType: undefined,
    companyId: undefined,
    amount: 0,
    depositPeriod: undefined,
    startDate: "",
    remark: "",
    earlyRelease: 0,
    releaseDate: "",
    interestDays: 0,
    releaseAmount: 0
  })
  isCreate.value = false
}

async function handleConfirm() {
  const selected = tableRef.value?.getSelectionRows().filter((row: any) => row.status === 1)
  if (selected.length === 0) {
    ElMessage.warning("请选择待确认的记录")
    return
  }

  try {
    const response = await depositConfirm({
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

function updateRemainingAmount() {
  remainingAmount.value = (selectedRow.value?.remainingAmount || 0) - form.releaseAmount
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

onMounted(() => {
  fetchData()
  getCompanies()
})
</script>

<template>
  <div class="fixed-deposit-management">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入存款编号、单位名称模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 90px;" @change="handleSearch">
            <el-option label="全部" :value="0" />
            <el-option v-for="(value, key) in statusOptions" :key="key" :label="`${value}`" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额范围">
          <el-input v-model="searchForm.amountFrom" clearable style="width: 70px;" />
          &nbsp;&nbsp;到&nbsp;&nbsp;
          <el-input v-model="searchForm.amountTo" clearable style="width: 70px;" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增存款
          </el-button>
          <el-button type="primary" @click="handleImport">
            <SvgIcon name="import" />
            导入定期存款
          </el-button>
          <el-button type="warning" v-if="multipleSelection.length > 0" @click="handleConfirm">批量确认</el-button>
          <el-button type="danger" v-if="multipleSelection.length > 0" @click="handleBatchDelete">批量删除</el-button>
        </el-form-item>
      </el-form>

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
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="depositCode" label="存款编号" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="depositType" label="存款类型" width="100" align="center">
          <template #default="{ row }">
            {{ depositPeriodMap[row.depositPeriod] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="起息日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="company.companyName" label="单位名称" min-width="180" />
        <el-table-column prop="amount" label="金额(元)" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formattedMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="depositPeriod" label="定存期限" width="100" align="center">
          <template #default="{ row }">
            {{ depositPeriodMap[row.depositPeriod] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="到期日期" width="110" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="earlyRelease" label="提前释放" width="100" align="center">
          <template #default="{ row }">
            {{ row.earlyRelease === 1 ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="releaseDate" label="释放日期" width="110" align="center" sortable="custom" />
        <el-table-column prop="interestDays" label="已计息天数" width="120" sortable="custom" align="center" />
        <el-table-column prop="releaseAmount" label="释放金额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formattedMoney(row.releaseAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingAmount" label="剩余金额" width="120" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formattedMoney(row.remainingAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.name" label="创建人" width="100" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="导入批次" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="clickable" @click="handleBatchDetail(row.batchNo)">{{ row.batchNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastInterestDate" label="最近计息日" width="150" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="success" v-if="row.status === 2 && new Date(row.endDate) > new Date() && row.remainingAmount > 0" @click="handleRelease(row)">提前释放</el-button>
            <el-button type="danger" v-if="row.status === 1" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog
      v-model="showCreateDialog"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        ref="formRef"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存款编号" prop="depositCode">
              <el-input v-model="form.depositCode" :disabled="!isCreate" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存款类型" prop="depositType">
              <el-select v-model="form.depositType" placeholder="请选择存款类型" :disabled="!isCreate">
                <el-option v-for="(item, key) in depositTypeMap" :key="key" :label="item" :value="Number(key)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起息日期" prop="startDate">
              <el-date-picker
                v-model="form.startDate"
                type="date"
                placeholder="请选择起息日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled="!isCreate"
              />
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
                :disabled="!isCreate"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number v-model="form.amount" :step="1" :precision="2" :disabled="!isCreate" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="定存期限" prop="depositPeriod">
              <el-select v-model="form.depositPeriod" placeholder="请选择定存期限" :disabled="!isCreate" style="width: 100%">
                <el-option v-for="(item, key) in depositPeriodMap" :key="key" :label="item" :value="Number(key)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                placeholder="请输入备注信息"
                :rows="2"
                :disabled="!isCreate"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="!isCreate">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="创建人">
                <el-input :model-value="selectedRow?.creator.name" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建日期">
                <el-input :model-value="formatDateTime(selectedRow?.createdAt)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="修改人">
                <el-input :model-value="selectedRow?.updater?.name" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="修改日期">
                <el-input :model-value="formatDateTime(selectedRow?.updatedAt)" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="是否提前释放" label-width="100px" prop="earlyRelease">
                <el-select v-model="form.earlyRelease" :disabled="new Date(selectedRow?.endDate || '') < new Date()">
                  <el-option label="是" :value="1" />
                  <el-option label="否" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="释放日期" prop="releaseDate">
                <el-date-picker
                  v-model="form.releaseDate"
                  type="date"
                  placeholder="选择释放日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled="form.earlyRelease === 0"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="已计息天数" label-width="100px" prop="interestDays">
                <el-input-number
                  v-model="form.interestDays"
                  :min="0"
                  :precision="0"
                  :disabled="form.earlyRelease === 0"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="释放金额" label-width="100px" prop="releaseAmount">
                <el-input-number
                  v-model="form.releaseAmount"
                  :min="0"
                  :precision="2"
                  @change="updateRemainingAmount"
                  :disabled="form.earlyRelease === 0"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="剩余金额">
            <el-input :model-value="formattedMoney(remainingAmount)" readonly>
              <template #prepend>￥</template>
            </el-input>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <DepositImport
      ref="depositImportRef"
      @success="importSuccess"
    />

    <ModalForm ref="batchFormRef" @close="batchFormVisibility = false" v-if="batchFormVisibility" />
  </div>
</template>

<style scoped>
.fixed-deposit-management {
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

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { CompanyTree } from "../basic/apis/type"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { getCompaniesTree } from "../basic/apis"
import { createReceive, getPaymentClearings, receiveConfirm, receiveDelete, updateReceive } from "./apis"
import ModalForm from "./forms/_batch_detail.vue"
import ReceiveImport from "./forms/_receive-import.vue"

interface PaymentReceive {
  id: number
  receiveType: number
  receiveDate: string
  sapCode: string | null
  companyName: string
  customerName: string | null
  projectName: string | null
  receiveBank: string | null
  billNo: string | null
  billType: string | null
  billAmount: number
  dueDate: string
  collectionDate: string | null
  received: number
  discountDate: string | null
  discountAmount: number
  discountFee: number
  accountAmount: number
  accountSet: string | null
  status: number
  createdBy: string
  creator: { name: string }
  createdAt: string
  updater: { name: string }
  updatedAt: string
  batchNo: string
}

const systemParamsStore = useSystemParamsStore()
const receiveBankMap = systemParamsStore.getArrayDict(4).reduce((prev, cur) => {
  prev[cur.value] = cur.name
  return prev
}, {} as Record<number, string>)

const loading = ref(false)
const selectedRow = ref<PaymentReceive | null>(null)
const showEditDialog = ref(false)
const dialogTitle = ref("贴现填报")
const formRef = ref<FormInstance>()
const receiveImportRef = ref<any>(null)
const batchFormRef = ref<InstanceType<typeof ModalForm>>()
const batchFormVisibility = ref(false)
const isCreate = ref(false)
const companyOptions = ref<CompanyTree[]>([])

const rules = computed<FormRules>(() => {
  const isCreateReceive = isCreate.value
  return {
    receiveType: [
      { required: isCreateReceive, message: "请选择到款类型", trigger: "change" }
    ],
    receiveDate: [
      { required: isCreateReceive, message: "请选择到款日期", trigger: "change" }
    ],
    companyId: [
      { required: isCreateReceive, message: "请选择单位", trigger: "change" }
    ],
    accountAmount: [
      { required: true, message: "请输入到款金额", trigger: "blur" }
    ],
    billAmount: [
      { required: editForm.receiveType === 2, message: "请输入票据金额", trigger: "blur" }
    ],
    dueDate: [
      { required: editForm.receiveType === 2, message: "请选择到期日", trigger: "change" }
    ]
  }
})

const discountDisabled = computed(() => {
  return editForm.discountDate === ""
})

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
const tableData = ref<PaymentReceive[]>([])

const editForm = reactive({
  id: 0,
  sapCode: "",
  companyId: undefined as number | undefined,
  projectName: "",
  receiveType: undefined as number | undefined,
  receiveDate: "" as string,
  accountAmount: 0 as number | undefined,
  customerName: "",
  collectionDate: "",
  discountDate: "",
  discountAmount: 0 as number | undefined,
  discountFee: 0 as number | undefined,
  billAmount: 0 as number | undefined,
  billNo: "",
  dueDate: "",
  receiveBank: undefined as string | undefined,
  received: 0 as number
})

// function getReceiveTypeLabel(type: number) {
//   const labels = { 1: "银行到款", 2: "票据到款" }
//   return labels[type as keyof typeof labels] || "未知"
// }

function getStatusLabel(status: number) {
  const labels = { 1: "待确认", 2: "已生效", 3: "已清算", 4: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
}

function getStatusType(status: number) {
  const types = { 1: "warning", 2: "success", 3: "primary", 4: "info" }
  return types[status as keyof typeof types] || "info"
}

// function getBillTypeLabel(type: string | null) {
//   if (!type) return "-"
//   const labels = { 1: "银行承兑汇票", 2: "商业承兑汇票" }
//   return labels[type as unknown as keyof typeof labels] || type
// }

function formatAmount(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return "-"
  return formattedMoney(amount)
}

function formatDate(date: string | null) {
  return date ? formatDateTime(date, "YYYY-MM-DD") : "-"
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword || undefined,
      status: searchForm.status,
      page: pagination.page,
      size: pagination.size,
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
    const response = await getPaymentClearings(params)

    const result: any = response
    let count = 1
    tableData.value = result.data.records.map((item: any) => {
      return {
        ...item,
        seq: count++
      }
    })
    pagination.total = result.data.total
  } catch (error: any) {
    ElMessage.error(error.message || "获取数据失败")
  } finally {
    loading.value = false
  }
}

async function handleImport() {
  receiveImportRef.value?.open()
}

function importSuccess() {
  handleSearch()
}

function handleCreate() {
  dialogTitle.value = "新增到款"
  isCreate.value = true
  resetForm()
  showEditDialog.value = true
}

function handleEdit(row: any) {
  dialogTitle.value = "到款信息编辑"
  isCreate.value = false
  selectedRow.value = row
  Object.assign(editForm, {
    id: row.id,
    sapCode: row.sapCode,
    companyId: row.companyId,
    projectName: row.projectName,
    receiveType: row.receiveType,
    receiveDate: row.receiveDate,
    accountAmount: Number(row.accountAmount),
    customerName: row.customerName,
    collectionDate: row.collectionDate || "",
    discountDate: row.discountDate || "",
    discountAmount: Number(row.discountAmount),
    discountFee: Number(row.discountFee),
    billAmount: Number(row.billAmount),
    billNo: row.billNo || "",
    dueDate: row.dueDate || "",
    receiveBank: row.receiveBank ? String(row.receiveBank) : undefined,
    received: row.received
  })
  showEditDialog.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    const submitData = { ...editForm }

    let response
    if (isCreate.value) {
      response = await createReceive(submitData)
    } else {
      response = await updateReceive(submitData, editForm.id)
    }

    if (response.code === 0) {
      ElMessage.success(isCreate.value ? "创建成功" : "更新成功")
      showEditDialog.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || (isCreate.value ? "创建失败" : "更新失败"))
    }
  } catch (error) {
    console.error("提交失败:", error)
  }
}

async function handleConfirm() {
  const selected = tableRef.value?.getSelectionRows().filter((row: any) => row.status === 1)
  if (selected.length === 0) {
    ElMessage.warning("请选择待确认的记录")
    return
  }

  try {
    const response = await receiveConfirm({
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

async function handleDelete(row: PaymentReceive) {
  try {
    if (row.status !== 1) {
      ElMessage.warning("只能删除待确认的记录")
      return
    }
    await ElMessageBox.confirm(`确定要删除该记录吗？`, "提示", { type: "warning" })

    const response = await receiveDelete(row.id)

    if (response.code === 0) {
      ElMessage.success("删除成功")
      fetchData()
    } else {
      ElMessage.error(response.message || "删除失败")
    }
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败")
    }
  }
}

function handleDateChange() {
  editForm.received = 1
}

function handleReceive(row: any) {
  handleEdit(row)
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function handleFilter(value: any, row: any, column: any) {
  const property = column.property
  return row[property] === Number(value)
}

function handleSortChange(column: any) {
  const { prop, order } = column
  searchForm.sort = (order === "descending" ? "-" : "+") + prop
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    keyword: "",
    status: 0,
    dateRange: [],
    amountFrom: undefined,
    amountTo: undefined,
    sort: ""
  })
  handleSearch()
}

function handleBatchDetail(batchNo: string) {
  batchFormVisibility.value = true
  nextTick(() => {
    batchFormRef.value?.open({ batchNo: batchNo as string })
  })
}

function resetForm() {
  Object.assign(editForm, {
    id: 0,
    sapCode: "",
    companyId: undefined,
    projectName: "",
    receiveType: undefined,
    receiveDate: "",
    accountAmount: 0,
    customerName: "",
    collectionDate: "",
    discountDate: "",
    discountAmount: 0,
    discountFee: 0,
    billAmount: 0,
    billNo: "",
    dueDate: "",
    receiveBank: undefined,
    received: 0
  })
}

function handleSizeChange(val: number) {
  pagination.size = val
  fetchData()
}

function handleCurrentChange(val: number) {
  pagination.page = val
  fetchData()
}

function discountChange() {
  if (editForm.discountDate !== "") {
    editForm.accountAmount = (editForm.discountAmount || 0) + (editForm.discountFee || 0)
  }
}

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
  <div class="payment-clearing">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
        <el-row>
          <el-col>
            <el-form-item label="关键词">
              <el-input v-model="searchForm.keyword" placeholder="可输入单位名称、客户名称、项目名称模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 90px;" @change="handleSearch">
                <el-option label="全部" :value="0" />
                <el-option label="待确认" :value="1" />
                <el-option label="已生效" :value="2" />
                <el-option label="已清算" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="金额范围">
              <el-input v-model="searchForm.amountFrom" clearable style="width: 70px;" />
              &nbsp;&nbsp;到&nbsp;&nbsp;
              <el-input v-model="searchForm.amountTo" clearable style="width: 70px;" />
            </el-form-item>
            <el-form-item label="到款日期">
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
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <el-form-item>
              <el-button type="primary" @click="handleCreate">
                <el-icon><Plus /></el-icon>
                新增到款
              </el-button>
              <el-button type="primary" @click="handleImport">
                <SvgIcon name="import" />
                导入到款
              </el-button>
              <el-button type="warning" @click="handleConfirm">批量确认</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table
        ref="tableRef"
        :data="tableData"
        border
        stripe
        v-loading="loading"
        :sort-config="{ remote: true }"
        @sort-change="handleSortChange"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column width="50" type="selection" align="center" />
        <el-table-column
          prop="receiveType"
          label="到款类型"
          width="100"
          align="center"
          :filters="[{ text: '银行到款', value: '1' }, { text: '票据到款', value: '2' }]"
          :filter-method="handleFilter"
        >
          <template #default="{ row }">
            {{ row.receiveType === 1 ? "银行到款" : "票据到款" }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveDate" label="到款日期" width="110" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.receiveDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="sapCode" label="SAP代码" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="company.companyName" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户名称" width="220" show-overflow-tooltip />
        <el-table-column prop="projectName" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="accountAmount" label="到款金额(元)" width="150" align="right" sortable="custom">
          <template #default="{ row }">
            {{ formatAmount(row.accountAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveBank" label="到款银行" width="120" align="center">
          <template #default="{ row }">
            {{ receiveBankMap[row.receiveBank] || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="billNo" label="票据号码" width="120" show-overflow-tooltip />
        <el-table-column prop="dueDate" label="到期日" width="120" align="center" sortable="custom" />
        <el-table-column prop="collectionDate" label="托收日期" width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.collectionDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="received" label="是否已到账" width="80" align="center">
          <template #default="{ row }">
            <span :class="{ 'text-success': row.received === 1, 'text-danger': row.received === 0 }">
              {{ row.received === 1 ? "已到账" : "未到账" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="discountDate" label="贴现日期" width="120" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.discountDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="贴现到款金额" width="120" align="center" sortable="custom" />
        <el-table-column prop="discountFee" label="贴现手续费" width="120" align="center" sortable="custom" />
        <el-table-column prop="company.accountName" label="账套" width="110" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.name" label="创建人" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="clickable" @click="handleBatchDetail(row.batchNo)">{{ row.batchNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" type="danger" @click="handleDelete(row)">删除</el-button>
            <el-button v-if="row.status === 2 && row.receiveType === 2 && row.received === 0" type="success" @click="handleReceive(row)">
              到账填报
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="showEditDialog" :title="dialogTitle" width="700px">
        <el-form ref="formRef" :model="editForm" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="到款类型" prop="receiveType">
                <el-select v-model="editForm.receiveType" placeholder="请选择到款类型" :disabled="!isCreate" style="width: 100%">
                  <el-option label="银行到款" :value="1" />
                  <el-option label="票据到款" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="到款日期" prop="receiveDate">
                <el-date-picker
                  v-model="editForm.receiveDate"
                  type="date"
                  placeholder="请选择到款日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :disabled="!isCreate"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="单位名称" prop="companyId">
                <el-tree-select
                  v-model="editForm.companyId"
                  :data="companyOptions"
                  placeholder="请选择单位"
                  :render-after-expand="false"
                  :check-strictly="true"
                  clearable
                  :disabled="!isCreate"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="SAP代码" prop="sapCode">
                <el-input v-model="editForm.sapCode" placeholder="请输入SAP代码" :disabled="!isCreate" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="到款银行" prop="receiveBank">
                <el-select v-model="editForm.receiveBank" placeholder="请选择银行" :disabled="!isCreate" style="width: 100%">
                  <el-option v-for="(item, key) in receiveBankMap" :key="key" :label="item" :value="key" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目名称" prop="projectName">
                <el-input v-model="editForm.projectName" placeholder="请输入项目名称" :disabled="!isCreate" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户名称" prop="customerName">
                <el-input v-model="editForm.customerName" placeholder="请输入客户名称" :disabled="!isCreate" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="到账金额" prop="accountAmount">
                <el-input-number v-model="editForm.accountAmount" :precision="2" :step="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="editForm.receiveType === 2">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="票据号码" prop="billNo">
                  <el-input v-model="editForm.billNo" placeholder="请输入票据号码" :disabled="!isCreate" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="票据金额" prop="billAmount">
                  <el-input-number v-model="editForm.billAmount" :precision="2" :step="1000" style="width: 100%" :disabled="!isCreate" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="到期日" prop="dueDate">
                  <el-date-picker
                    v-model="editForm.dueDate"
                    type="date"
                    placeholder="请选择到期日"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                    :disabled="!isCreate"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="托收日期" prop="collectionDate">
                  <el-date-picker
                    v-model="editForm.collectionDate"
                    type="date"
                    placeholder="选择托收日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                    @change="handleDateChange"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="是否已到账" prop="received">
                  <el-select v-model="editForm.received" style="width: 100%">
                    <el-option label="已到账" :value="1" />
                    <el-option label="未到账" :value="0" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="贴现日期" prop="discountDate">
                  <el-date-picker
                    v-model="editForm.discountDate"
                    type="date"
                    placeholder="选择贴现日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="贴现到款金额" prop="discountAmount">
                  <el-input-number
                    v-model="editForm.discountAmount"
                    :min="0"
                    :precision="2"
                    :disabled="discountDisabled"
                    @change="discountChange"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="贴现手续费" prop="discountFee">
                  <el-input-number
                    v-model="editForm.discountFee"
                    :min="0"
                    :precision="2"
                    :disabled="discountDisabled"
                    @change="discountChange"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div v-if="!isCreate" style="margin-top: 20px">
            <el-divider content-position="left">系统信息</el-divider>
            <el-row :gutter="20">
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
            <el-row :gutter="20">
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
          </div>
        </el-form>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
        </template>
      </el-dialog>

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

    <ReceiveImport
      ref="receiveImportRef"
      @success="importSuccess"
    />

    <ModalForm ref="batchFormRef" @close="batchFormVisibility = false" v-if="batchFormVisibility" />
  </div>
</template>

<style scoped>
.payment-clearing {
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

:deep(.el-tabs__content) {
  padding-top: 10px;
}

.text-success {
  color: #409eff;
}

.text-danger {
  color: #f56c6c;
}

.clickable {
  cursor: pointer;
  color: var(--el-color-primary);
}
</style>

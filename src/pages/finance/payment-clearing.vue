<script setup lang="ts">
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { getPaymentClearings, receiveConfirm, receiveDelete, updateReceive } from "./apis"
import ReceiveImport from "./forms/_receive-import.vue"

interface PaymentReceive {
  id: number
  receiveType: number
  receiveDate: string
  sapCode: string | null
  companyName: string
  customerName: string | null
  projectName: string | null
  receiveAmount: number
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
  updator: { name: string }
  updatedAt: string
  batchNo: string
}

const loading = ref(false)
const selectedRow = ref<PaymentReceive | null>(null)
const showEditDialog = ref(false)
const receiveImportRef = ref<any>(null)

const searchForm = reactive({
  keyword: "",
  status: 0,
  dateRange: [] as string[]
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
  receiveAmount: undefined as number | undefined,
  collectionDate: "",
  discountDate: "",
  discountAmount: undefined as number | undefined,
  discountFee: undefined as number | undefined,
  received: 0 as number,
  accountAmount: undefined as number | undefined
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
      size: pagination.size
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

function handleEdit(row: PaymentReceive) {
  selectedRow.value = row
  editForm.id = row.id
  editForm.receiveAmount = Number(row.receiveAmount)
  editForm.collectionDate = row.collectionDate || ""
  editForm.discountDate = row.discountDate || ""
  editForm.discountAmount = Number(row.discountAmount)
  editForm.discountFee = Number(row.discountFee)
  editForm.accountAmount = Number(row.accountAmount)
  editForm.received = row.received || 0
  showEditDialog.value = true
}

async function handleSaveEdit() {
  try {
    const updateData: any = {}

    updateData.collectionDate = editForm.collectionDate || null
    updateData.discountDate = editForm.discountDate || null
    updateData.discountAmount = editForm.discountAmount
    updateData.discountFee = editForm.discountFee
    updateData.accountAmount = editForm.accountAmount
    updateData.received = editForm.received

    const response = await updateReceive(updateData, editForm.id)

    if (response.code === 0) {
      ElMessage.success("更新成功")
      showEditDialog.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || "更新失败")
    }
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败")
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

function handleReceive() {
  const selected = tableRef.value?.getSelectionRows().filter((row: any) => row.receiveType === 2 && row.received === 0)
  if (selected.length === 0) {
    ElMessage.warning("请选择要操作的记录，票据类型并且未到账。")
    return
  }
  handleEdit(selected.pop())
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    keyword: "",
    status: 0,
    dateRange: []
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="payment-clearing">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
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
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleImport">
            <SvgIcon name="import" />
            导入到款
          </el-button>
          <el-button type="primary" @click="handleReceive">
            <el-icon><DocumentChecked /></el-icon>
            到账填报
          </el-button>
          <el-button type="warning" @click="handleConfirm">批量确认</el-button>
        </el-form-item>
      </el-form>

      <el-table
        ref="tableRef"
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column width="50" type="selection" align="center" />
        <el-table-column prop="receiveType" label="到款类型" width="100" align="center">
          <template #default="{ row }">
            {{ row.receiveType === 1 ? "银行到款" : "票据到款" }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveDate" label="到款日期" width="110" align="center">
          <template #default="{ row }">
            {{ formatDate(row.receiveDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="sapCode" label="SAP代码" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="companyName" label="单位名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户名称" width="220" show-overflow-tooltip />
        <el-table-column prop="projectName" label="项目名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="accountAmount" label="到款金额(元)" width="150" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.accountAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="receiveBank" label="到款银行" width="120" align="center" />
        <el-table-column prop="billNo" label="票据号码" width="120" show-overflow-tooltip />
        <el-table-column prop="dueDate" label="到期日" width="120" align="center" />
        <el-table-column prop="receiptDate" label="托收日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.receiptDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="received" label="是否已到账" width="80" align="center">
          <template #default="{ row }">
            {{ row.received === 1 ? "已到账" : "未到账" }}
          </template>
        </el-table-column>
        <el-table-column prop="discountDate" label="贴现日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.discountDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="贴现到款金额" width="120" align="center" />
        <el-table-column prop="discountFee" label="贴现手续费" width="120" align="center" />
        <el-table-column prop="accountSet" label="账套" width="100" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.name" label="创建人" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="批次号" width="130" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="showEditDialog" title="贴现填报" width="600px">
        <el-form :model="editForm" label-width="80px">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="SAP代码">
                <el-input :model-value="selectedRow?.sapCode" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位名称">
                <el-input :model-value="selectedRow?.companyName" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="项目名称">
                <el-input :model-value="selectedRow?.projectName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="票据金额">
                <el-input :model-value="selectedRow?.billAmount" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="24">
              <el-form-item label="客户名称">
                <el-input :model-value="selectedRow?.customerName" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="托收日期">
                <el-date-picker
                  v-model="editForm.collectionDate"
                  type="date"
                  placeholder="选择托收日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  @change="handleDateChange"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否已到账" label-width="100px">
                <el-select v-model="editForm.received">
                  <el-option label="已到账" :value="1" />
                  <el-option label="未到账" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="贴现日期">
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
            <el-col :span="12">
              <el-form-item label="贴现到款金额" label-width="100px">
                <el-input-number
                  v-model="editForm.discountAmount"
                  :min="0"
                  :precision="2"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="贴现手续费" label-width="100px">
                <el-input-number
                  v-model="editForm.discountFee"
                  :min="0"
                  :precision="2"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="到款金额" label-width="100px">
                <el-input-number
                  v-model="editForm.accountAmount"
                  :min="0"
                  :precision="2"
                />
              </el-form-item>
            </el-col>
          </el-row>
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
                <el-input :model-value="selectedRow?.updator.name" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="修改日期">
                <el-input :model-value="formatDateTime(selectedRow?.updatedAt)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveEdit">保存</el-button>
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
  </div>
</template>

<style scoped>
.payment-clearing {
  padding: 10px;
}

.search-form {
  margin-bottom: 10px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:deep(.search-form .el-form-item) {
  margin-bottom: 0;
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
</style>

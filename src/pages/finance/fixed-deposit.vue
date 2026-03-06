<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { useSystemParamsStore } from "@/pinia/stores/system-params"
import { depositConfirm, getFixedDeposits, releaseFixedDeposit } from "./apis"
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
}

const loading = ref(false)
const selectedRow = ref<FixedDeposit | null>(null)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增存款")
const formRef = ref<FormInstance>()
const depositImportRef = ref<any>([])

const systemParamsStore = useSystemParamsStore()
const depositPeriodMap = systemParamsStore.getArrayDict(3)
const depositTypeMap = systemParamsStore.getArrayDict(1)

const searchForm = reactive({
  keyword: "",
  status: "0",
  dateRange: [] as string[]
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
  earlyRelease: 0,
  releaseDate: "" as string,
  interestDays: 0,
  releaseAmount: 0,
})

const rules = computed<FormRules>(() => {
  const isEarlyRelease = form.earlyRelease === 1
  return {
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
  const labels = { 1: "待确认", 2: "已生效", 3: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
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
      endDate: ""
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
    batchNo: "",
    status: "0",
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

function handleRelease(row: FixedDeposit) {
  dialogTitle.value = "提前释放存款"
  selectedRow.value = row
  remainingAmount.value = row.remainingAmount
  Object.assign(form, {
    id: row.id,
    earlyRelease: row.earlyRelease,
    releaseDate: row.releaseDate || "",
    interestDays: row.interestDays || 0,
    releaseAmount: row.releaseAmount || 0,
  })
  showCreateDialog.value = true
}

async function handleDelete(row: FixedDeposit) {
  try {
    await ElMessageBox.confirm(`确定要删除存款记录 ${row.depositCode} 吗？`, "提示", {
      type: "warning"
    })
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success("删除成功")
    fetchData()
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
    if (form.earlyRelease === 1) {
      submitLoading.value = true
      const response = await releaseFixedDeposit(form)
      if (response.code === 0) {
        ElMessage.success(response.message || "释放成功")
        fetchData()
      } else {
        ElMessage.error(response.message || "释放失败")
      }
    }
    showCreateDialog.value = false
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

function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    earlyRelease: 0,
    releaseDate: "",
    interestDays: 0,
    releaseAmount: 0,
  })
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

onMounted(() => {
  fetchData()
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
            <el-option label="存续中" :value="1" />
            <el-option label="已到期" :value="2" />
            <el-option label="已支取" :value="3" />
          </el-select>
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
          <!-- <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增存款
          </el-button> -->
          <el-button type="primary" @click="handleImport">
            <SvgIcon name="import" />
            导入定期存款
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
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="depositCode" label="存款编号" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="depositType" label="存款类型" width="100" align="center">
          <template #default="{ row }">
            {{ depositTypeMap.find(item => item.value === String(row.depositType))?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="起息日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="company.companyName" label="单位名称" min-width="180" />
        <el-table-column prop="amount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="depositPeriod" label="定存期限" width="100" align="center">
          <template #default="{ row }">
            {{ depositPeriodMap.find(item => item.value === String(row.depositPeriod))?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="到期日期" width="100" align="center">
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
        <el-table-column prop="releaseDate" label="释放日期" width="100" align="center" />
        <el-table-column prop="daysCount" label="已计息天数" width="100" align="center" />
        <el-table-column prop="releaseAmount" label="释放金额" width="120" align="center" />
        <el-table-column prop="remainingAmount" label="剩余金额" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator.name" label="创建人" width="100" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNo" label="导入批次" width="130" align="right" show-overflow-tooltip />
        <el-table-column prop="recentInterestDate" label="最近计息日" width="150" align="right" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="success" v-if="row.status === 2" @click="handleRelease(row)">提前释放</el-button>
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
      width="600px"
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
            <el-form-item label="存款编号">
              <el-input :model-value="selectedRow?.depositCode" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存款类型">
              <el-input :model-value="depositTypeMap.find(item => item.value === String(selectedRow?.depositType))?.name || '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起息日期" prop="startDate">
              <el-date-picker
                :model-value="selectedRow?.startDate"
                type="date"
                placeholder="请选择起息日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位名称">
              <el-input :model-value="selectedRow?.company.companyName" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额">
              <el-input :model-value="selectedRow?.amount" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="定存期限">
              <el-input :model-value="depositPeriodMap.find(item => item.value === String(selectedRow?.depositPeriod))?.name || '-'" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                :model-value="selectedRow?.remark"
                type="textarea"
                placeholder="请输入备注信息"
                :rows="2"
                disabled
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
</style>

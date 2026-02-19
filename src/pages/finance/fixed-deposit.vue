<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { getFixedDeposits } from "./apis"
import DepositImport from "./forms/_deposit-import.vue"

interface FixedDeposit {
  id: number
  depositCode: string
  companyId: number
  companyName: string
  depositAmount: number
  depositTerm: number
  interestRate: number
  startDate: string
  endDate: string
  expectedIncome: number
  actualIncome: number
  status: number
  createdBy: string
  createdAt: string
  remark: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增存款")
const formRef = ref<FormInstance>()
const depositImportRef = ref<any>([])

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

const tableData = ref<FixedDeposit[]>([])
const companyOptions = ref<{ id: number, companyName: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  depositCode: "",
  companyId: undefined as number | undefined,
  depositAmount: undefined as number | undefined,
  depositTerm: undefined as number | undefined,
  interestRate: undefined as number | undefined,
  startDate: "",
  remark: ""
})

const rules = reactive<FormRules>({
  depositCode: [{ required: true, message: "请输入存款编号", trigger: "blur" }],
  companyId: [{ required: true, message: "请选择存款单位", trigger: "change" }],
  depositAmount: [{ required: true, message: "请输入存款金额", trigger: "blur" }],
  depositTerm: [{ required: true, message: "请选择存款期限", trigger: "change" }],
  interestRate: [{ required: true, message: "请输入年利率", trigger: "blur" }],
  startDate: [{ required: true, message: "请选择起息日期", trigger: "change" }]
})

function getStatusLabel(status: number) {
  const labels = { 1: "存续中", 2: "已到期", 3: "已支取" }
  return labels[status as keyof typeof labels] || "未知"
}

function getStatusType(status: number) {
  const types = { 1: "primary", 2: "warning", 3: "success" }
  return types[status as keyof typeof types] || "info"
}

function formatDate(date: string) {
  return date ? formatDateTime(date, "YYYY-MM-DD") : "-"
}

function calculateExpectedIncome() {
  if (form.depositAmount && form.depositTerm && form.interestRate) {
    const years = form.depositTerm / 12
    return form.depositAmount * (form.interestRate / 100) * years
  }
  return 0
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

async function getCompanies() {
  try {
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              { id: 1, companyName: "上海工程局一分公司" },
              { id: 2, companyName: "上海工程局二分公司" }
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

function handleEdit(row: FixedDeposit) {
  dialogTitle.value = "编辑存款"
  Object.assign(form, {
    id: row.id,
    depositCode: row.depositCode,
    companyId: row.companyId,
    depositAmount: row.depositAmount,
    depositTerm: row.depositTerm,
    interestRate: row.interestRate,
    startDate: row.startDate,
    remark: row.remark
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
    await formRef.value.validate()
    submitLoading.value = true
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
    depositCode: "",
    companyId: undefined,
    depositAmount: undefined,
    depositTerm: undefined,
    interestRate: undefined,
    startDate: "",
    remark: ""
  })
}

function generateDepositCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  form.depositCode = `FD${year}${month}${day}${random}`
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
        </el-form-item>
      </el-form>

      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column width="50" type="selection" align="center" />
        <el-table-column prop="seq" label="序号" width="80" align="center" />
        <el-table-column prop="depositCode" label="存款编号" width="120" align="center" show-overflow-tooltip />
        <el-table-column prop="depositType" label="存款类型" width="100" align="center" />
        <el-table-column prop="startDate" label="起息日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="companyName" label="单位名称" min-width="180" />
        <el-table-column prop="depositAmount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formattedMoney(row.depositAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="depositTerm" label="定存期限" width="100" align="center">
          <template #default="{ row }">
            {{ row.depositTerm }}个月
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="到期日期" width="100" align="center">
          <template #default="{ row }">
            {{ formatDate(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="isEarlyRelease" label="提前释放" width="100" align="center" />
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
        <el-table-column prop="batchNo" label="导入批次" width="130" align="center" />
        <el-table-column prop="recentInterestDate" label="最近计息日" width="150" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(row)">删除</el-button>
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
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存款编号" prop="depositCode">
              <el-input v-model="form.depositCode" placeholder="请输入存款编号">
                <template #append>
                  <el-button @click="generateDepositCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存款单位" prop="companyId">
              <el-select v-model="form.companyId" placeholder="请选择存款单位" filterable>
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
            <el-form-item label="存款金额" prop="depositAmount">
              <el-input-number
                v-model="form.depositAmount"
                placeholder="请输入存款金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存款期限" prop="depositTerm">
              <el-select v-model="form.depositTerm" placeholder="请选择存款期限">
                <el-option label="3个月" :value="3" />
                <el-option label="6个月" :value="6" />
                <el-option label="12个月" :value="12" />
                <el-option label="24个月" :value="24" />
                <el-option label="36个月" :value="36" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年利率(%)" prop="interestRate">
              <el-input-number
                v-model="form.interestRate"
                placeholder="请输入年利率"
                :min="0"
                :step="0.1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起息日期" prop="startDate">
              <el-date-picker
                v-model="form.startDate"
                type="date"
                placeholder="请选择起息日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="预期收益">
          <el-input :value="formattedMoney(calculateExpectedIncome())" disabled>
            <template #prepend>￥</template>
          </el-input>
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

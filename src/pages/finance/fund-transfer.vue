<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { formattedMoney } from "@@/utils"
import { formatDateTime } from "@@/utils/datetime"
import { getFundTransfers, transferConfirm, transferDelete } from "./apis"
import TransferImport from "./forms/_transfer-import.vue"

interface FundTransfer {
  id: number
  seq: number
  transferCode: string
  companyName: string // 单位名称
  transferAmount: number // 转账金额
  transferType: number // 转账类型：1-上划，2-下拨
  transferDate: string // 转账日期
  transferStatus: number // 转账状态：1-待处理，2-处理中，3-已完成，4-已取消
  transferDirection: string // 转账方向：上划/下拨
  bankAccount: string // 银行账户
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增转账")
const formRef = ref<FormInstance>()
const activeTab = ref("up")
const transferImportRef = ref<any>(null)
const upTableRef = ref<any>(null)
const downTableRef = ref<any>(null)

const searchForm = reactive({
  keyword: "",
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const upTableData = ref<FundTransfer[]>([])
const downTableData = ref<FundTransfer[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  transferCode: "",
  fromCompanyCode: "",
  fromCompanyName: "",
  toCompanyCode: "",
  toCompanyName: "",
  transferAmount: undefined as number | undefined,
  transferType: undefined as number | undefined,
  transferDate: "",
  transferStatus: 1,
  bankAccount: "",
  remark: ""
})

const rules = reactive<FormRules>({
  fromCompanyName: [{ required: true, message: "请选择拨出单位", trigger: "change" }],
  toCompanyName: [{ required: true, message: "请选择拨入单位", trigger: "change" }],
  transferAmount: [{ required: true, message: "请输入转账金额", trigger: "blur" }],
  transferType: [{ required: true, message: "请选择转账类型", trigger: "change" }],
  transferDate: [{ required: true, message: "请选择转账日期", trigger: "change" }]
})

// 获取转账状态标签
function getTransferStatusLabel(status: number) {
  const labels = { 1: "待确认", 2: "已生效", 3: "已删除" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取转账状态标签类型
function getTransferStatusType(status: number) {
  const types = { 1: "info", 2: "warning", 3: "success", 4: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 格式化日期
function formatDate(date: string) {
  return date ? formatDateTime(date, "YYYY-MM-DD") : "-"
}

// 生成转账编号
function generateTransferCode() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  form.transferCode = `FT${year}${month}${day}${random}`
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      type: activeTab.value === "up" ? 1 : 2,
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const response = await getFundTransfers(params)

    if (response.code === 0) {
      let count = 1
      const data = response.data.records.map((item: any) => ({
        ...item,
        seq: count++
      })) || []
      pagination.total = response.data.total || 0
      if (activeTab.value === "up") upTableData.value = data
      else downTableData.value = data
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
    // const response = await request({
    //   url: '/finance/companies',
    //   method: 'get'
    // })

    // if (response.code === 200) {
    //   companyOptions.value = response.data.items || []
    // }
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
    keyword: "",
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
function handleEdit(row: FundTransfer) {
  dialogTitle.value = "编辑转账"
  Object.assign(form, {
    id: row.id,
    companyName: row.companyName,
    transferAmount: row.transferAmount,
    transferType: row.transferType,
    transferDate: row.transferDate,
    transferStatus: row.transferStatus,
    bankAccount: row.bankAccount,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: FundTransfer) {
  try {
    await ElMessageBox.confirm(`确定要删除转账记录 ${row.transferCode} 吗？`, "提示", {
      type: "warning"
    })

    const response = await transferDelete(row.id)

    if (response.code === 0) {
      ElMessage.success("删除成功")
      fetchData()
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败")
    }
  }
}

// 提交表单
async function handleSubmit() {
  // if (!formRef.value) return

  // try {
  //   await formRef.value.validate()
  //   submitLoading.value = true

  //   const url = form.id ? `/finance/fund-transfer/${form.id}` : '/finance/fund-transfer'
  //   const method = form.id ? 'put' : 'post'

  //   const response = await request({
  //     url,
  //     method,
  //     data: {
  //       transferCode: form.transferCode,
  //       fromCompanyCode: form.fromCompanyCode,
  //       fromCompanyName: form.fromCompanyName,
  //       toCompanyCode: form.toCompanyCode,
  //       toCompanyName: form.toCompanyName,
  //       transferAmount: form.transferAmount,
  //       transferType: form.transferType,
  //       transferDate: form.transferDate,
  //       transferStatus: form.transferStatus,
  //       bankAccount: form.bankAccount,
  //       remark: form.remark
  //     }
  //   })

  //   if (response.code === 200) {
  //     ElMessage.success(form.id ? "更新成功" : "创建成功")
  //     showCreateDialog.value = false
  //     fetchData()
  //   }
  // } catch (error) {
  //   console.error("提交失败:", error)
  // } finally {
  //   submitLoading.value = false
  // }
}

// 重置表单
function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    transferCode: "",
    fromCompanyCode: "",
    fromCompanyName: "",
    toCompanyCode: "",
    toCompanyName: "",
    transferAmount: undefined,
    transferType: undefined,
    transferDate: "",
    transferStatus: 1,
    bankAccount: "",
    remark: ""
  })
}

// 选择拨出单位
function onFromCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.fromCompanyCode = company.companyCode
    form.fromCompanyName = company.companyName
  }
}

// 选择拨入单位
function onToCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.toCompanyCode = company.companyCode
    form.toCompanyName = company.companyName
  }
}

async function handleConfirm() {
  const selected = activeTab.value === "up"
    ? upTableRef.value?.getSelectionRows().filter((row: any) => row.transferStatus === 1)
    : downTableRef.value?.getSelectionRows().filter((row: any) => row.transferStatus === 1)
  if (selected.length === 0) {
    ElMessage.warning("请选择待确认的记录")
    return
  }

  try {
    const response = await transferConfirm({
      ids: selected.map((r: any) => r.id),
      type: activeTab.value === "up" ? 1 : 2
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

function handleTabChange() {
  if (activeTab.value === "up") {
    if (upTableData.value.length === 0) fetchData()
  } else if (activeTab.value === "down") {
    if (downTableData.value.length === 0) fetchData()
  }
}

async function handleImport() {
  transferImportRef.value?.open(activeTab.value === "up" ? 1 : 2)
}

function importSuccess() {
  handleSearch()
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
})
</script>

<template>
  <div class="fund-transfer-management">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="分公司每日资金上划" name="up">
          <!-- 搜索条件 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="关键词">
              <el-input v-model="searchForm.keyword" placeholder="可输入单位名称、转账编号模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="转账状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="全部" :value="0" />
                <el-option label="待确认" :value="1" />
                <el-option label="已生效" :value="2" />
                <el-option label="已删除" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="转账日期">
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
              <el-button type="primary" @click="handleImport">
                <SvgIcon name="import" />
                导入
              </el-button>
              <el-button type="warning" @click="handleConfirm">批量确认</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table
            ref="upTableRef"
            :data="upTableData"
            border
            stripe
            v-loading="loading"
            header-cell-class-name="header-cell-fix"
          >
            <el-table-column width="50" type="selection" align="center" />
            <el-table-column prop="seq" label="序号" width="60" align="center" />
            <el-table-column prop="transferCode" label="转账编号" width="120" show-overflow-tooltip />
            <el-table-column prop="transferDate" label="转账日期" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.transferDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="companyName" label="单位名称" min-width="150" />
            <el-table-column prop="transferAmount" label="金额(元)" width="150" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.transferAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="transferStatus" label="转账状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getTransferStatusType(row.transferStatus) as any">
                  {{ getTransferStatusLabel(row.transferStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150" />
            <el-table-column prop="createdBy" label="创建人" width="100" align="center" />
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="batchNo" label="导入批次" width="130" align="center" show-overflow-tooltip />
            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
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
        </el-tab-pane>

        <el-tab-pane label="局集团资金下拨" name="down">
          <!-- 搜索条件 -->
          <el-form :model="searchForm" inline class="search-form">
            <el-form-item label="关键词">
              <el-input v-model="searchForm.keyword" placeholder="可输入单位名称、转账编号模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="转账状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
                <el-option label="全部" :value="0" />
                <el-option label="待确认" :value="1" />
                <el-option label="已生效" :value="2" />
                <el-option label="已删除" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="转账日期">
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
              <el-button type="primary" @click="handleImport">
                <SvgIcon name="import" />
                导入
              </el-button>
              <el-button type="warning" @click="handleConfirm">批量确认</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table
            ref="downTableRef"
            :data="downTableData"
            border
            stripe
            v-loading="loading"
            header-cell-class-name="header-cell-fix"
          >
            <el-table-column width="50" type="selection" align="center" />
            <el-table-column prop="seq" label="序号" width="60" align="center" />
            <el-table-column prop="transferCode" label="转账编号" width="120" show-overflow-tooltip />
            <el-table-column prop="transferDate" label="转账日期" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.transferDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="companyName" label="单位名称" min-width="150" />
            <el-table-column prop="transferAmount" label="（下拨/代付）金额" width="150" align="right">
              <template #default="{ row }">
                {{ formattedMoney(row.transferAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="isLoan" label="是否贷款" width="100" align="center">
              <template #default="{ row }">
                {{ row.isLoan === 1 ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column prop="dueDate" label="贷款期限" width="120" align="center">
              <template #default="{ row }">
                {{ formatDate(row.dueDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="transferStatus" label="转账状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getTransferStatusType(row.transferStatus) as any">
                  {{ getTransferStatusLabel(row.transferStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150" />
            <el-table-column prop="createdBy" label="创建人" width="100" align="center" />
            <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="batchNo" label="导入批次" width="130" align="center" show-overflow-tooltip />
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
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <TransferImport
      ref="transferImportRef"
      @success="importSuccess"
    />

    <!-- 新增/编辑对话框 -->
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
            <el-form-item label="转账编号" prop="transferCode">
              <el-input v-model="form.transferCode" placeholder="请输入转账编号">
                <template #append>
                  <el-button @click="generateTransferCode">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转账类型" prop="transferType">
              <el-select v-model="form.transferType" placeholder="请选择转账类型">
                <el-option label="上划" :value="1" />
                <el-option label="下拨" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="拨出单位" prop="fromCompanyName">
              <el-select
                v-model="form.fromCompanyName"
                placeholder="请选择拨出单位"
                filterable
                @change="onFromCompanyChange"
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
            <el-form-item label="拨入单位" prop="toCompanyName">
              <el-select
                v-model="form.toCompanyName"
                placeholder="请选择拨入单位"
                filterable
                @change="onToCompanyChange"
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
            <el-form-item label="转账金额" prop="transferAmount">
              <el-input-number
                v-model="form.transferAmount"
                placeholder="请输入转账金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转账日期" prop="transferDate">
              <el-date-picker
                v-model="form.transferDate"
                type="date"
                placeholder="请选择转账日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="银行账户" prop="bankAccount">
          <el-input v-model="form.bankAccount" placeholder="请输入银行账户" />
        </el-form-item>

        <el-form-item label="转账状态" prop="transferStatus">
          <el-select v-model="form.transferStatus" placeholder="请选择转账状态" disabled>
            <el-option label="待处理" :value="1" />
            <el-option label="处理中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
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
  </div>
</template>

<style scoped>
.fund-transfer-management {
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

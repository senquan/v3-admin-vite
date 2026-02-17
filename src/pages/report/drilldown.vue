<script setup lang="ts">
import type { FormInstance } from "element-plus"

interface DrillDownRecord {
  id: number
  parentReportCode: string // 上级报表编号
  childReportCode: string // 下级报表编号
  companyCode: string // 单位编号
  companyName: string // 单位名称
  projectName: string // 项目名称
  projectCode: string // 项目编号
  drillDownType: number // 穿透类型：1-按项目穿透，2-按部门穿透，3-按时间穿透
  amount: number // 金额
  ratio: number // 占比(%)
  detailInfo: string // 详细信息
  drillDownDate: string // 穿透日期
  status: number // 状态：1-有效，2-无效
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增穿透记录")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  projectName: "",
  drillDownType: undefined as number | undefined,
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<DrillDownRecord[]>([])
const companyOptions = ref<{ id: number, companyName: string, companyCode: string }[]>([])
const projectOptions = ref<{ id: number, projectName: string, projectCode: string }[]>([])

const form = reactive({
  id: undefined as number | undefined,
  parentReportCode: "",
  childReportCode: "",
  companyCode: "",
  companyName: "",
  projectName: "",
  projectCode: "",
  drillDownType: 1,
  amount: undefined as number | undefined,
  ratio: undefined as number | undefined,
  detailInfo: "",
  drillDownDate: "",
  status: 1,
  remark: ""
})

// 获取穿透类型标签
function getDrillDownTypeLabel(type: number) {
  const labels = { 1: "按项目穿透", 2: "按部门穿透", 3: "按时间穿透" }
  return labels[type as keyof typeof labels] || "未知"
}

// 获取穿透类型标签类型
function getDrillDownTypeType(type: number) {
  const types = { 1: "primary", 2: "success", 3: "warning" }
  return types[type as keyof typeof types] || "info"
}

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "有效", 2: "无效" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取状态标签类型
function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 格式化金额
function formatAmount(amount: number) {
  return amount?.toFixed(2) || "0.00"
}

// 格式化百分比
function formatRatio(ratio: number) {
  return ratio?.toFixed(2) || "0.00"
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
                parentReportCode: "PP202401010001",
                childReportCode: "CD202401010001",
                companyCode: "SH001",
                companyName: "上海工程局",
                projectName: "高铁建设项目A标段",
                projectCode: "P2024001",
                drillDownType: 1,
                amount: 20000000,
                ratio: 40.00,
                detailInfo: "高铁建设项目A标段详细收支明细",
                drillDownDate: "2024-04-01",
                status: 1,
                remark: "项目收支穿透分析",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
              },
              {
                id: 2,
                parentReportCode: "PP202401010002",
                childReportCode: "CD202401010002",
                companyCode: "SH002",
                companyName: "上海工程局二分公司",
                projectName: "地铁建设项目B标段",
                projectCode: "P2024002",
                drillDownType: 1,
                amount: 15000000,
                ratio: 30.00,
                detailInfo: "地铁建设项目B标段详细收支明细",
                drillDownDate: "2024-04-01",
                status: 1,
                remark: "项目收支穿透分析",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
              },
              {
                id: 3,
                parentReportCode: "PP202401010003",
                childReportCode: "CD202401010003",
                companyCode: "SH001",
                companyName: "上海工程局",
                projectName: "财务部门",
                projectCode: "D001",
                drillDownType: 2,
                amount: 5000000,
                ratio: 10.00,
                detailInfo: "财务部门费用明细",
                drillDownDate: "2024-04-01",
                status: 1,
                remark: "部门费用穿透分析",
                createdBy: "admin",
                createdAt: "2024-04-01T00:00:00Z"
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
async function getProjects() {
  try {
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              { id: 1, projectName: "高铁建设项目A标段", projectCode: "P2024001" },
              { id: 2, projectName: "地铁建设项目B标段", projectCode: "P2024002" },
              { id: 3, projectName: "桥梁建设项目C标段", projectCode: "P2024003" }
            ]
          }
        })
      }, 300)
    })

    const result: any = response
    projectOptions.value = result.data.items
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
    companyName: "",
    projectName: "",
    drillDownType: undefined,
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
function handleEdit(row: DrillDownRecord) {
  dialogTitle.value = "编辑穿透记录"
  Object.assign(form, {
    id: row.id,
    parentReportCode: row.parentReportCode,
    childReportCode: row.childReportCode,
    companyCode: row.companyCode,
    companyName: row.companyName,
    projectName: row.projectName,
    projectCode: row.projectCode,
    drillDownType: row.drillDownType,
    amount: row.amount,
    ratio: row.ratio,
    detailInfo: row.detailInfo,
    drillDownDate: row.drillDownDate,
    status: row.status,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(_row: DrillDownRecord) {
  try {
    await ElMessageBox.confirm(`确定要删除穿透记录吗？`, "提示", {
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
    parentReportCode: "",
    childReportCode: "",
    companyCode: "",
    companyName: "",
    projectName: "",
    projectCode: "",
    drillDownType: 1,
    amount: undefined,
    ratio: undefined,
    detailInfo: "",
    drillDownDate: "",
    status: 1,
    remark: ""
  })
}

// 选择单位
function onCompanyChange(companyId: number) {
  const company = companyOptions.value.find(item => item.id === companyId)
  if (company) {
    form.companyCode = company.companyCode
    form.companyName = company.companyName
  }
}

// 选择项目
function onProjectChange(projectId: number) {
  const project = projectOptions.value.find(item => item.id === projectId)
  if (project) {
    form.projectCode = project.projectCode
    form.projectName = project.projectName
  }
}

// 初始化
onMounted(() => {
  fetchData()
  getCompanies()
  getProjects()
})
</script>

<template>
  <div class="drilldown-query">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="穿透类型">
          <el-select v-model="searchForm.drillDownType" placeholder="请选择类型" clearable>
            <el-option label="按项目穿透" :value="1" />
            <el-option label="按部门穿透" :value="2" />
            <el-option label="按时间穿透" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="有效" :value="1" />
            <el-option label="无效" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="穿透日期">
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
            新增穿透
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
        <el-table-column prop="parentReportCode" label="上级报表编号" width="140" align="center" />
        <el-table-column prop="childReportCode" label="下级报表编号" width="140" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="150" />
        <el-table-column prop="projectName" label="项目名称" min-width="150" />
        <el-table-column prop="drillDownType" label="穿透类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDrillDownTypeType(row.drillDownType) as any">
              {{ getDrillDownTypeLabel(row.drillDownType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="ratio" label="占比(%)" width="100" align="right">
          <template #default="{ row }">
            {{ formatRatio(row.ratio) }}%
          </template>
        </el-table-column>
        <el-table-column prop="detailInfo" label="详细信息" min-width="180" />
        <el-table-column prop="drillDownDate" label="穿透日期" width="120" align="center">
          <template #default="{ row }">
            {{ formatDate(row.drillDownDate) }}
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
      width="800px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上级报表编号" prop="parentReportCode">
              <el-input v-model="form.parentReportCode" placeholder="请输入上级报表编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下级报表编号" prop="childReportCode">
              <el-input v-model="form.childReportCode" placeholder="请输入下级报表编号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
          <el-col :span="12">
            <el-form-item label="项目名称" prop="projectName">
              <el-select
                v-model="form.projectName"
                placeholder="请选择项目"
                filterable
                @change="onProjectChange"
              >
                <el-option
                  v-for="item in projectOptions"
                  :key="item.id"
                  :label="item.projectName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="穿透类型" prop="drillDownType">
              <el-select v-model="form.drillDownType" placeholder="请选择穿透类型">
                <el-option label="按项目穿透" :value="1" />
                <el-option label="按部门穿透" :value="2" />
                <el-option label="按时间穿透" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="有效" :value="1" />
                <el-option label="无效" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number
                v-model="form.amount"
                placeholder="请输入金额"
                :min="0"
                :step="10000"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="占比(%)" prop="ratio">
              <el-input-number
                v-model="form.ratio"
                placeholder="请输入占比"
                :min="0"
                :max="100"
                :step="0.1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="穿透日期" prop="drillDownDate">
              <el-date-picker
                v-model="form.drillDownDate"
                type="date"
                placeholder="请选择穿透日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细信息" prop="detailInfo">
          <el-input
            v-model="form.detailInfo"
            type="textarea"
            placeholder="请输入详细信息"
            :rows="3"
          />
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
.drilldown-query {
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

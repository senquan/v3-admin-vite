<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { InterestRate, InterestRateForm } from "./apis/type"
import { formatDateTime } from "@@/utils/datetime"
import {
  confirmInterestRateUpdate,
  createInterestRate,
  getInterestRateList,
  getInterestRateTypes
} from "./apis"

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const showConfirmDialog = ref(false)
const dialogStatus = ref("create")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  rateType: 0,
  status: undefined as number | undefined,
  dateRange: [] as string[]
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<InterestRate[]>([])
const rateTypeOptions = ref<any[]>([])

const form = reactive<InterestRateForm>({
  id: undefined,
  rateType: 0,
  rateValue: 0,
  remark: ""
})

const confirmForm = reactive({
  id: undefined as number | undefined,
  rateCode: "",
  oldRateValue: 0,
  newRateValue: undefined as number | undefined,
  remark: ""
})

const rules = reactive<FormRules>({
  rateType: [{ required: true, message: "请选择利率类型", trigger: "change" }],
  rateValue: [{ required: true, message: "请输入利率值", trigger: "blur" }]
})

const confirmRules = reactive<FormRules>({
  newRateValue: [{ required: true, message: "请输入新利率值", trigger: "blur" }]
})

function getStatusLabel(status: number) {
  return status === 1 ? "有效" : "无效"
}

function getStatusTagType(status: number) {
  return status === 1 ? "success" : "danger"
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.rateType) params.rateType = searchForm.rateType
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const response = await getInterestRateList(params)
    tableData.value = response.data.records
    console.log(tableData.value)
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

async function fetchRateTypes() {
  const response = await getInterestRateTypes()
  rateTypeOptions.value = response.data.records.map((item: any) => ({
    label: item.name,
    value: item.value
  }))
}

function formatRate(rate: number) {
  return Math.round(rate * 100) / 100
}

function handleSearch() {
  pagination.page = 1
  fetchData()
}

function resetSearch() {
  Object.assign(searchForm, {
    rateType: 0,
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

function handleCreate() {
  dialogStatus.value = "create"
  resetForm()
  showCreateDialog.value = true
}

// function handleEdit(row: InterestRate) {
//   dialogStatus.value = "edit"
//   Object.assign(form, {
//     id: row.id,
//     rateType: row.rateType,
//     rateCode: row.rateCode,
//     rateValue: row.rateValue,
//     effectiveDate: row.effectiveDate,
//     expiryDate: row.expiryDate,
//     status: row.status,
//     currency: row.currency,
//     term: row.term,
//     remark: row.remark
//   })
//   showCreateDialog.value = true
// }

function handleConfirmUpdate(row: InterestRate) {
  confirmForm.id = row.id
  confirmForm.rateCode = row.rateCode
  confirmForm.oldRateValue = row.rateValue
  confirmForm.newRateValue = undefined
  confirmForm.remark = ""
  showConfirmDialog.value = true
}

async function handleConfirmSubmit() {
  try {
    submitLoading.value = true
    const response = await confirmInterestRateUpdate(confirmForm.id!, confirmForm.newRateValue!, confirmForm.remark)
    if (response.code === 0) {
      ElMessage.success("确认修改成功，原记录已置为无效")
      showConfirmDialog.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || "确认修改失败")
    }
  } catch (error: any) {
    ElMessage.error(error.message || "确认修改失败")
  } finally {
    submitLoading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const data = { ...form }
    const response = await createInterestRate(data)

    if (response.code === 0) {
      ElMessage.success(form.id ? "更新成功" : "创建成功")
      showCreateDialog.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || "提交失败")
    }
  } catch (error: any) {
    ElMessage.error(error.message || "提交失败")
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    rateType: undefined,
    rateValue: undefined,
    remark: ""
  })
}

onMounted(() => {
  fetchData()
  fetchRateTypes()
})
</script>

<template>
  <div class="interest-rate-management">
    <el-card>
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="利率生效时间">
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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100px;">
            <el-option label="生效" :value="1" />
            <el-option label="失效" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增利率
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
        <el-table-column prop="rateCode" label="利率编号" width="150" show-overflow-tooltip />
        <el-table-column prop="rateType" label="利率类型" width="100" align="center">
          <template #default="{ row }">
            {{ rateTypeOptions.find((option: any) => option.value === String(row.rateType))?.label || "未知" }}
          </template>
        </el-table-column>
        <el-table-column prop="rateValue" label="利率值(%)" width="100" align="right">
          <template #default="{ row }">
            {{ formatRate(row.rateValue) }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status) as any">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="effectiveDate" label="生效日期" width="110" align="center" />
        <el-table-column prop="expiryDate" label="失效日期" width="110" align="center">
          <template #default="{ row }">
            {{ row.expiryDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="creator.name" label="创建人" width="110" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updater.name" label="修改人" width="110" align="center" />
        <el-table-column prop="updatedAt" label="修改时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" type="warning" @click="handleConfirmUpdate(row)">
              调整
            </el-button>
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
      :title="dialogStatus === 'create' ? '新增利率' : '编辑利率'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="利率类型" prop="rateType">
              <el-select v-model="form.rateType" placeholder="请选择利率类型" style="width: 100%;">
                <el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="利率值" prop="rateValue">
              <el-input-number
                v-model="form.rateValue"
                :min="0"
                :max="100"
                :precision="2"
                :step="0.01"
                style="width: 100%;"
              >
                <template #suffix>
                  <span>%</span>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注信息" :rows="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showConfirmDialog" title="调整利率" width="600px">
      <el-form :model="confirmForm" :rules="confirmRules" ref="formRef" label-width="100px">
        <el-form-item label="利率编号">
          <el-input v-model="confirmForm.rateCode" disabled />
        </el-form-item>
        <el-form-item label="当前利率">
          <el-input :value="`${formatRate(confirmForm.oldRateValue)}%`" disabled />
        </el-form-item>
        <el-form-item label="新利率值(%)" prop="newRateValue">
          <el-input-number
            v-model="confirmForm.newRateValue"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.01"
            style="width: 100%;"
          >
            <template #suffix>
              <span>%</span>
            </template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="confirmForm.remark" type="textarea" placeholder="请输入备注信息" :rows="5" />
        </el-form-item>
      </el-form>
      <p style="color: #E6A23C; font-size: 12px; margin-top: 30px; text-align: center;">
        提示：确认后原利率将置为无效，新利率立即生效
      </p>
      <template #footer>
        <el-button @click="showConfirmDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmSubmit" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.interest-rate-management {
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
</style>

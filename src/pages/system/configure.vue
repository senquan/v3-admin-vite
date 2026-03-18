<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import { deleteSystemConfig, getSystemConfig, updateSystemConfig } from "./apis"

interface SystemConfig {
  id: number
  key: string // 配置键
  name: string // 配置名称
  value: string // 配置值
  type: number // 配置类型：1-字符串，2-数字，3-布尔值，4-JSON
  category: string // 配置分类
  description: string // 配置描述
  isEnabled: number // 状态：1-启用，2-禁用
  isSystem: number // 是否系统配置：1-是，2-否
  remark: string
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增系统配置")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: "",
  status: undefined as number | undefined,
  type: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const tableData = ref<SystemConfig[]>([])

const form = reactive({
  id: undefined as number | undefined,
  key: "",
  name: "",
  value: "",
  type: 1,
  category: "",
  description: "",
  isEnabled: 1,
  isSystem: 2,
  remark: ""
})

const rules = reactive<FormRules>({
  key: [
    { required: true, message: "请输入配置键", trigger: "blur" },
    { pattern: /^[a-z]\w*$/i, message: "配置键只能包含字母、数字和下划线，且以字母开头", trigger: "blur" }
  ],
  name: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  value: [{ required: true, message: "请输入配置值", trigger: "blur" }],
  type: [{ required: true, message: "请选择配置类型", trigger: "change" }]
})

// 获取配置类型标签
function getConfigTypeLabel(type: number) {
  const labels = { 1: "字符串", 2: "数字", 3: "布尔值", 4: "JSON" }
  return labels[type as keyof typeof labels] || "未知"
}

// 获取配置类型标签类型
function getConfigTypeType(type: number) {
  const types = { 1: "primary", 2: "success", 3: "warning", 4: "info" }
  return types[type as keyof typeof types] || "info"
}

// 获取状态标签
function getStatusLabel(status: number) {
  const labels = { 1: "启用", 2: "禁用" }
  return labels[status as keyof typeof labels] || "未知"
}

// 获取状态标签类型
function getStatusType(status: number) {
  const types = { 1: "success", 2: "danger" }
  return types[status as keyof typeof types] || "info"
}

// 获取系统配置标签
function getSystemLabel(isSystem: number) {
  const labels = { 1: "系统", 2: "自定义" }
  return labels[isSystem as keyof typeof labels] || "未知"
}

// 获取系统配置标签类型
function getSystemType(isSystem: number) {
  const types = { 1: "danger", 2: "primary" }
  return types[isSystem as keyof typeof types] || "info"
}

// 格式化配置值显示
function formatConfigValue(row: SystemConfig) {
  if (row.type === 4) {
    try {
      return JSON.stringify(JSON.parse(row.value), null, 2)
    } catch {
      return row.value
    }
  }
  return row.value
}

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      status: searchForm.status || undefined,
      type: searchForm.type || undefined
    }
    const response = await getSystemConfig(params)

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
    type: undefined
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
function handleEdit(row: SystemConfig) {
  dialogTitle.value = "编辑系统配置"
  Object.assign(form, {
    id: row.id,
    key: row.key,
    name: row.name,
    value: row.value,
    type: row.type,
    category: row.category,
    description: row.description,
    isEnabled: row.isEnabled,
    isSystem: row.isSystem,
    remark: row.remark
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: SystemConfig) {
  try {
    // 系统配置不允许删除
    if (row.isSystem === 1) {
      ElMessage.warning("系统配置不允许删除")
      return
    }

    await ElMessageBox.confirm(`确定要删除配置 ${row.name} 吗？`, "提示", {
      type: "warning"
    })

    const response = await deleteSystemConfig(row.id || 0)

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

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const updateData: any = {}

    updateData.name = form.name || null
    updateData.value = form.value || null
    updateData.type = form.type || null
    updateData.description = form.description || null
    updateData.isEnabled = form.isEnabled || null

    const response = await updateSystemConfig(updateData, form.id || 0)

    if (response.code === 0) {
      ElMessage.success("更新成功")
      showCreateDialog.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || "更新失败")
    }
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
    key: "",
    name: "",
    value: "",
    type: 1,
    category: "",
    description: "",
    status: 1,
    isSystem: 2,
    remark: ""
  })
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="system-configure-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入配置名称、类型模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="配置类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 120px;">
            <el-option label="字符串" :value="1" />
            <el-option label="数字" :value="2" />
            <el-option label="布尔值" :value="3" />
            <el-option label="JSON" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100px;">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <!-- <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增配置
          </el-button> -->
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        header-cell-class-name="header-cell-fix"
      >
        <el-table-column prop="key" label="配置键" width="150" align="center" />
        <el-table-column prop="name" label="配置名称" width="180" show-overflow-tooltip />
        <el-table-column prop="value" label="配置值" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip
              :content="formatConfigValue(row)"
              placement="top"
              :disabled="formatConfigValue(row).length <= 50"
            >
              <span class="config-value">
                {{ formatConfigValue(row).length > 50 ? `${formatConfigValue(row).substring(0, 50)}...` : formatConfigValue(row) }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="配置类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getConfigTypeType(row.type) as any">
              {{ getConfigTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.isEnabled) as any">
              {{ getStatusLabel(row.isEnabled) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isSystem" label="配置类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getSystemType(row.isSystem) as any">
              {{ getSystemLabel(row.isSystem) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              v-if="row.isSystem !== 1"
              type="danger"
              @click="handleDelete(row)"
            >
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
            <el-form-item label="配置键" prop="key">
              <el-input
                v-model="form.key"
                placeholder="请输入配置键"
                :disabled="true"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入配置名称"
                :disabled="!!form.id && form.isSystem === 1"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="配置类型" prop="configType">
              <el-select
                v-model="form.type"
                placeholder="请选择配置类型"
                :disabled="!!form.id && form.isSystem === 1"
              >
                <el-option label="字符串" :value="1" />
                <el-option label="数字" :value="2" />
                <el-option label="布尔值" :value="3" />
                <el-option label="JSON" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="配置值" prop="configValue">
          <el-input
            v-model="form.value"
            type="textarea"
            placeholder="请输入配置值"
            :rows="4"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入配置描述"
            :rows="2"
            :disabled="!!form.id && form.isSystem === 1"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.isEnabled" placeholder="请选择状态">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.system-configure-management {
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

.config-value {
  font-family: "Courier New", monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
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

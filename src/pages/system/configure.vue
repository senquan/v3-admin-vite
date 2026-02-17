<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface SystemConfig {
  id: number
  configKey: string // 配置键
  configName: string // 配置名称
  configValue: string // 配置值
  configType: number // 配置类型：1-字符串，2-数字，3-布尔值，4-JSON
  category: string // 配置分类
  description: string // 配置描述
  status: number // 状态：1-启用，2-禁用
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
  configName: "",
  category: "",
  status: undefined as number | undefined,
  configType: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<SystemConfig[]>([])

const form = reactive({
  id: undefined as number | undefined,
  configKey: "",
  configName: "",
  configValue: "",
  configType: 1,
  category: "",
  description: "",
  status: 1,
  isSystem: 2,
  remark: ""
})

const rules = reactive<FormRules>({
  configKey: [
    { required: true, message: "请输入配置键", trigger: "blur" },
    { pattern: /^[a-z]\w*$/i, message: "配置键只能包含字母、数字和下划线，且以字母开头", trigger: "blur" }
  ],
  configName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  configValue: [{ required: true, message: "请输入配置值", trigger: "blur" }],
  configType: [{ required: true, message: "请选择配置类型", trigger: "change" }],
  category: [{ required: true, message: "请输入配置分类", trigger: "blur" }]
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
  if (row.configType === 4) {
    try {
      return JSON.stringify(JSON.parse(row.configValue), null, 2)
    } catch {
      return row.configValue
    }
  }
  return row.configValue
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
                configKey: "system_name",
                configName: "系统名称",
                configValue: "财务管理系统",
                configType: 1,
                category: "基础配置",
                description: "系统显示名称",
                status: 1,
                isSystem: 1,
                remark: "系统核心配置，不可修改",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 2,
                configKey: "max_upload_size",
                configName: "最大上传文件大小",
                configValue: "10485760",
                configType: 2,
                category: "文件配置",
                description: "单位：字节",
                status: 1,
                isSystem: 2,
                remark: "可自定义配置",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 3,
                configKey: "enable_notification",
                configName: "启用通知功能",
                configValue: "true",
                configType: 3,
                category: "功能配置",
                description: "是否启用系统通知",
                status: 1,
                isSystem: 2,
                remark: "可自定义配置",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              },
              {
                id: 4,
                configKey: "email_config",
                configName: "邮件配置",
                configValue: "{\"host\":\"smtp.example.com\",\"port\":587,\"username\":\"user@example.com\",\"password\":\"password\"}",
                configType: 4,
                category: "邮件配置",
                description: "邮件服务器配置信息",
                status: 1,
                isSystem: 2,
                remark: "JSON格式配置",
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              }
            ],
            total: 4
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

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchData()
}

// 重置搜索
function resetSearch() {
  Object.assign(searchForm, {
    configName: "",
    category: "",
    status: undefined,
    configType: undefined
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
    configKey: row.configKey,
    configName: row.configName,
    configValue: row.configValue,
    configType: row.configType,
    category: row.category,
    description: row.description,
    status: row.status,
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

    await ElMessageBox.confirm(`确定要删除配置 ${row.configName} 吗？`, "提示", {
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
    await formRef.value.validate()
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
    configKey: "",
    configName: "",
    configValue: "",
    configType: 1,
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
        <el-form-item label="配置名称">
          <el-input v-model="searchForm.configName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置分类">
          <el-input v-model="searchForm.category" placeholder="请输入配置分类" />
        </el-form-item>
        <el-form-item label="配置类型">
          <el-select v-model="searchForm.configType" placeholder="请选择类型" clearable>
            <el-option label="字符串" :value="1" />
            <el-option label="数字" :value="2" />
            <el-option label="布尔值" :value="3" />
            <el-option label="JSON" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增配置
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
        <el-table-column prop="configKey" label="配置键" width="150" align="center" />
        <el-table-column prop="configName" label="配置名称" min-width="120" />
        <el-table-column prop="configValue" label="配置值" min-width="180">
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
        <el-table-column prop="configType" label="配置类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getConfigTypeType(row.configType) as any">
              {{ getConfigTypeLabel(row.configType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="配置分类" width="120" align="center" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status) as any">
              {{ getStatusLabel(row.status) }}
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
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)" size="small">
              编辑
            </el-button>
            <el-button
              v-if="row.isSystem !== 1"
              type="danger"
              @click="handleDelete(row)"
              size="small"
            >
              删除
            </el-button>
            <el-button
              v-else
              type="info"
              size="small"
              disabled
            >
              系统配置
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
            <el-form-item label="配置键" prop="configKey">
              <el-input
                v-model="form.configKey"
                placeholder="请输入配置键"
                :disabled="!!form.id && form.isSystem === 1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置名称" prop="configName">
              <el-input
                v-model="form.configName"
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
                v-model="form.configType"
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
          <el-col :span="12">
            <el-form-item label="配置分类" prop="category">
              <el-input
                v-model="form.category"
                placeholder="请输入配置分类"
                :disabled="!!form.id && form.isSystem === 1"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="配置值" prop="configValue">
          <el-input
            v-model="form.configValue"
            type="textarea"
            placeholder="请输入配置值"
            :rows="4"
            :disabled="!!form.id && form.isSystem === 1"
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
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置类型">
              <el-tag :type="getSystemType(form.isSystem) as any">
                {{ getSystemLabel(form.isSystem) }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

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
        <el-button
          v-if="!form.id || form.isSystem !== 1"
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
        >
          确定
        </el-button>
        <el-button
          v-else
          type="info"
          disabled
        >
          系统配置不可修改
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

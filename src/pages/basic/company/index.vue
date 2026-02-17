<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"

interface Company {
  id: number
  companyCode: string
  companyName: string
  parentCompanyId: number | null
  parentCompanyName?: string
  companyLevel: number
  status: number
  createdBy: string
  createdAt: string
}

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogTitle = ref("新增单位")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  companyName: "",
  companyCode: "",
  status: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<Company[]>([])
const companyOptions = ref<Company[]>([])

const form = reactive({
  id: undefined as number | undefined,
  companyCode: "",
  companyName: "",
  parentCompanyId: undefined as number | undefined,
  companyLevel: 1,
  status: 1
})

const rules = reactive<FormRules>({
  companyCode: [{ required: true, message: "请输入单位编号", trigger: "blur" }],
  companyName: [{ required: true, message: "请输入单位名称", trigger: "blur" }],
  companyLevel: [{ required: true, message: "请选择单位层级", trigger: "change" }]
})

// 获取层级标签
function getLevelLabel(level: number) {
  const labels = ["未知", "一级", "二级", "三级"]
  return labels[level] || "未知"
}

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString()
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
                companyCode: "SH001",
                companyName: "上海工程局",
                parentCompanyId: null,
                companyLevel: 1,
                status: 1,
                createdBy: "admin",
                createdAt: "2024-01-01T00:00:00Z"
              }
            ],
            total: 1
          }
        })
      }, 500)
    })

    const result: any = response
    tableData.value = result.data.items
    pagination.total = result.data.total

    // 设置上级单位选项
    companyOptions.value = result.data.items.filter((item: Company) => item.companyLevel < 3)
  } catch (error) {
    ElMessage.error(`获取数据失败:${error}`)
  } finally {
    loading.value = false
  }
}

// 获取上级单位列表
async function getParentCompanies() {
  try {
    // 模拟API调用
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            items: [
              { id: 1, companyName: "上海工程局", companyLevel: 1 }
            ]
          }
        })
      }, 300)
    })

    const result: any = response
    companyOptions.value = result.data.items
  } catch (error) {
    console.error("获取上级单位失败:", error)
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
    companyCode: "",
    status: undefined
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
function handleEdit(row: Company) {
  dialogTitle.value = "编辑单位"
  Object.assign(form, {
    id: row.id,
    companyCode: row.companyCode,
    companyName: row.companyName,
    parentCompanyId: row.parentCompanyId,
    companyLevel: row.companyLevel,
    status: row.status
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(_: Company) {
  try {
    await ElMessageBox.confirm("确定要删除该单位吗？", "提示", {
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
    companyCode: "",
    companyName: "",
    parentCompanyId: undefined,
    companyLevel: 1,
    status: 1
  })
}

// 初始化
onMounted(() => {
  fetchData()
  getParentCompanies()
})
</script>

<template>
  <div class="company-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="单位名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="单位编号">
          <el-input v-model="searchForm.companyCode" placeholder="请输入单位编号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增单位
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" border stripe v-loading="loading" header-cell-class-name="text-center" row-class-name="text-center">
        <el-table-column prop="companyCode" label="单位编号" width="120" align="center" />
        <el-table-column prop="companyName" label="单位名称" min-width="200" />
        <el-table-column prop="parentCompanyName" label="上级单位" min-width="150" />
        <el-table-column prop="companyLevel" label="单位层级" width="100" align="center">
          <template #default="{ row }">
            {{ getLevelLabel(row.companyLevel) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" @click="handleDelete(row)">删除</el-button>
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
      width="500px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="单位编号" prop="companyCode">
          <el-input v-model="form.companyCode" placeholder="请输入单位编号" />
        </el-form-item>
        <el-form-item label="单位名称" prop="companyName">
          <el-input v-model="form.companyName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="上级单位" prop="parentCompanyId">
          <el-select v-model="form.parentCompanyId" placeholder="请选择上级单位" clearable filterable>
            <el-option
              v-for="item in companyOptions"
              :key="item.id"
              :label="item.companyName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单位层级" prop="companyLevel">
          <el-select v-model="form.companyLevel" placeholder="请选择单位层级">
            <el-option label="一级" :value="1" />
            <el-option label="二级" :value="2" />
            <el-option label="三级" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
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
.company-management {
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus"
import type { Company, CompanyTree } from "../apis/type"
import { formatDateTime } from "@@/utils/datetime"
import { createCompany, deleteCompany, getCompaniesTree, getCompanyList, updateCompany } from "../apis"

const loading = ref(false)
const submitLoading = ref(false)
const showCreateDialog = ref(false)
const dialogStatus = ref("create")
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: "",
  status: 0
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<Company[]>([])
const companyOptions = ref<CompanyTree[]>([])

const form = reactive({
  id: undefined as number | undefined,
  companyCode: "",
  companyName: "",
  accountCode: "",
  accountName: "",
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

// 查询数据
async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status

    const response = await getCompanyList(params)
    tableData.value = response.data.records
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error(`获取数据失败:${error}`)
  } finally {
    loading.value = false
  }
}

// 获取上级单位列表
async function getParentCompanies() {
  try {
    if (companyOptions.value.length === 0) {
      const response = await getCompaniesTree()
      companyOptions.value = response.data.records
    }
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
    keyword: "",
    status: 0
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
  dialogStatus.value = "edit"
  getParentCompanies()
  Object.assign(form, {
    id: row.id,
    companyCode: row.companyCode,
    companyName: row.companyName,
    accountCode: row.accountCode,
    accountName: row.accountName,
    parentCompanyId: row.parentCompanyId,
    companyLevel: row.companyLevel,
    status: row.status
  })
  showCreateDialog.value = true
}

// 删除
async function handleDelete(row: Company) {
  try {
    await ElMessageBox.confirm("确定要删除该企业账套吗？", "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    })

    const response = await deleteCompany(row.id)
    if (response.code === 0) {
      ElMessage.success("删除成功")
    } else {
      ElMessage.error("删除失败")
    }
  } catch (error) {
    console.error("删除失败:", error)
  } finally {
    fetchData()
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    const response = dialogStatus.value === "edit" ? await updateCompany(form) : await createCompany(form)

    if (response.code === 0) {
      ElMessage.success(form.id ? "更新成功" : "创建成功")
      showCreateDialog.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || "提交失败")
    }
  } catch (error) {
    console.error("提交失败:", error)
  } finally {
    submitLoading.value = false
  }
}

function handleCreate() {
  dialogStatus.value = "create"
  resetForm()
  getParentCompanies()
  showCreateDialog.value = true
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
    accountCode: "",
    accountName: "",
    parentCompanyId: undefined,
    companyLevel: 1,
    status: 1
  })
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="company-management">
    <el-card>
      <!-- 搜索条件 -->
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="可输入单位名称和单位编号模糊搜索" clearable style="width: 300px;" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100px;">
            <el-option label="全部" :value="0" />
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增单位
          </el-button>
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
        <el-table-column prop="companyCode" label="单位编号" width="120" show-overflow-tooltip />
        <el-table-column prop="companyName" label="单位名称" min-width="200" />
        <el-table-column prop="parentCompany.companyName" label="上级单位" width="150" show-overflow-tooltip />
        <el-table-column prop="accountCode" label="账套编号" width="170" show-overflow-tooltip />
        <el-table-column prop="accountName" label="账套名称" width="170" show-overflow-tooltip />
        <el-table-column prop="companyLevel" label="层级" width="80" align="center">
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
      :title="dialogStatus === 'create' ? '新增单位' : '编辑单位'"
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
        <el-form-item label="账套编号" prop="accountCode">
          <el-input v-model="form.accountCode" placeholder="请输入账套编号" />
        </el-form-item>
        <el-form-item label="账套名称" prop="accountName">
          <el-input v-model="form.accountName" placeholder="请输入账套名称" />
        </el-form-item>
        <el-form-item label="上级单位" prop="parentCompanyId">
          <el-tree-select
            v-model="form.parentCompanyId"
            :data="companyOptions"
            placeholder="请选择上级单位"
            :render-after-expand="false"
            :check-strictly="true"
            clearable
          />
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

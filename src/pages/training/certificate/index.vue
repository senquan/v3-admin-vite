<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type * as CertificateTemplateType from "./apis/type"
import { getBranchList } from "@/common/apis/branches"
import { getBranchUserList } from "@/common/apis/users"
import { formatDateTime } from "@/common/utils/datetime"
import { request } from "@/http/axios"
import { ElMessage, ElMessageBox } from "element-plus"
import * as CertificateTemplateApi from "./apis"

// 响应式数据
const loading = ref(false)
const tableData = ref<CertificateTemplateType.CertificateTemplateListData[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref("新增证书模板")
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const multipleSelection = ref<CertificateTemplateType.CertificateTemplateListData[]>([])
const backgroundImageList = ref<any>([])
const rightSealList = ref<any>([])
const leftSealList = ref<any>([])

// 证书颁发相关数据
const issueDialogVisible = ref(false)
const issueLoading = ref(false)
const departmentList = ref<any[]>([])
const userList = ref<any[]>([])
const selectedUsers = ref<any[]>([])
const selectedDepartmentId = ref<number | null>(null)
const currentTemplateId = ref<number | null>(null)
const issueFormRef = ref<FormInstance>()
const issueForm = ref({
  reason: "",
  issueDate: new Date().toISOString().split("T")[0]
})

// 查询参数
const queryParams = reactive({
  keyword: "",
  cer_type: "",
  page: 1,
  pageSize: 10
})

// 表单数据
const formData = reactive<CertificateTemplateType.CertificateTemplateCreateData>({
  name: "",
  description: "",
  background_image: "",
  cer_type: 1,
  cer_fields: {},
  cer_title: "",
  cer_content: "",
  cer_right_signature_company: "",
  cer_right_signature_datetime: "",
  cer_right_signature_seal: "",
  cer_left_signature_company: "",
  cer_left_signature_datetime: "",
  cer_left_signature_seal: ""
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入模板名称", trigger: "blur" },
    { min: 1, max: 100, message: "名称长度在 1 到 100 个字符", trigger: "blur" }
  ],
  cer_type: [
    { required: true, message: "请选择证书类型", trigger: "change" }
  ],
  cer_title: [
    { required: true, message: "请输入证书标题", trigger: "blur" }
  ]
}

// 证书类型选项
const certificateTypeOptions: CertificateTemplateType.CertificateTypeOption[] = [
  { label: "培训证书", value: 1 },
  { label: "考试证书", value: 2 },
  { label: "技能证书", value: 3 },
  { label: "荣誉证书", value: 4 },
  { label: "其他", value: 5 }
]

// 获取证书模板列表
function fetchTemplateList() {
  loading.value = true
  return CertificateTemplateApi.fetchList(queryParams)
    .then((response) => {
      if (response.data && response.data.templates) {
        tableData.value = response.data.templates
        total.value = response.data.total
      } else {
        ElMessage.error(response.message || "获取证书模板列表失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取证书模板列表失败")
      console.error(error)
    })
    .finally(() => {
      loading.value = false
    })
}

// 搜索
function handleSearch() {
  queryParams.page = 1
  fetchTemplateList()
}

// 分页变化
function handlePageChange(page: number) {
  queryParams.page = page
  fetchTemplateList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.page = 1
  fetchTemplateList()
}

// 打开新增对话框
function handleAdd() {
  dialogTitle.value = "新增证书模板"
  isEdit.value = false
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
function handleEdit(row: CertificateTemplateType.CertificateTemplateListData) {
  dialogTitle.value = "编辑证书模板"
  isEdit.value = true
  currentId.value = row.id

  return CertificateTemplateApi.fetchDetail(row.id)
    .then((response) => {
      if (response.code === 0) {
        resetForm()
        const data = response.data
        formData.name = data.name || ""
        formData.description = data.description || ""
        formData.background_image = data.background_image || ""
        formData.cer_type = data.cer_type || 1
        formData.cer_fields = data.cer_fields || {}
        formData.cer_title = data.cer_title || ""
        formData.cer_content = data.cer_content || ""
        formData.cer_right_signature_company = data.cer_right_signature_company || ""
        formData.cer_right_signature_datetime = data.cer_right_signature_datetime || ""
        formData.cer_right_signature_seal = data.cer_right_signature_seal || ""
        formData.cer_left_signature_company = data.cer_left_signature_company || ""
        formData.cer_left_signature_datetime = data.cer_left_signature_datetime || ""
        formData.cer_left_signature_seal = data.cer_left_signature_seal || ""

        // 设置文件列表
        if (data.background_image) {
          backgroundImageList.value = [{ name: "背景图片", url: data.background_image }]
        }
        if (data.cer_right_signature_seal) {
          rightSealList.value = [{ name: "右侧印章", url: data.cer_right_signature_seal }]
        }
        if (data.cer_left_signature_seal) {
          leftSealList.value = [{ name: "左侧印章", url: data.cer_left_signature_seal }]
        }

        dialogVisible.value = true
      } else {
        ElMessage.error(response.message || "获取证书模板详情失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取证书模板详情失败")
      console.error(error)
    })
}

// 颁发证书
function handleIssue(row: CertificateTemplateType.CertificateTemplateListData) {
  currentTemplateId.value = row.id
  issueDialogVisible.value = true
  loadDepartmentList()
  loadUserList()
}

// 加载部门列表
function loadDepartmentList() {
  return getBranchList()
    .then((response) => {
      if (response.code === 0) {
        departmentList.value = response.data.branches || []
      } else {
        ElMessage.error(response.message || "获取部门列表失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取部门列表失败")
      console.error(error)
    })
}

// 加载用户列表
function loadUserList() {
  const params = selectedDepartmentId.value ? { branchId: selectedDepartmentId.value } : undefined
  return getBranchUserList(params)
    .then((response) => {
      if (response.code === 0) {
        userList.value = response.data.users || []
      } else {
        ElMessage.error(response.message || "获取用户列表失败")
      }
    })
    .catch((error: unknown) => {
      ElMessage.error("获取用户列表失败")
      console.error(error)
    })
}

// 部门变化时重新加载用户列表
function handleDepartmentChange() {
  selectedUsers.value = []
  loadUserList()
}

// 确认颁发证书
function confirmIssue() {
  if (!issueFormRef.value) return
  if (selectedUsers.value.length === 0) {
    ElMessage.warning("请选择要颁发证书的用户")
    return
  }

  return issueFormRef.value.validate()
    .then(() => {
      issueLoading.value = true
      const data = {
        templateId: currentTemplateId.value || 0,
        userIds: selectedUsers.value,
        reason: issueForm.value.reason,
        issueDate: issueForm.value.issueDate
      }
      return CertificateTemplateApi.issueCertificate(data)
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("证书颁发成功")
        issueDialogVisible.value = false
        resetIssueForm()
      } else {
        ElMessage.error(response.message || "证书颁发失败")
      }
    })
    .catch((error) => {
      ElMessage.error("证书颁发失败")
      console.error(error)
    })
    .finally(() => {
      issueLoading.value = false
    })
}

// 重置颁发表单
function resetIssueForm() {
  selectedUsers.value = []
  selectedDepartmentId.value = null
  issueForm.value.reason = ""
  issueForm.value.issueDate = new Date().toISOString().split("T")[0]
  issueFormRef.value?.clearValidate()
}

// 关闭颁发对话框
function handleIssueClose() {
  issueDialogVisible.value = false
  resetIssueForm()
}

// 删除证书模板
function handleDelete(row: CertificateTemplateType.CertificateTemplateListData) {
  return ElMessageBox.confirm(
    `确定要删除证书模板"${row.name}"吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      return CertificateTemplateApi.deleteCertificateTemplate(row.id)
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("删除成功")
        fetchTemplateList()
      } else {
        ElMessage.error(response.message || "删除失败")
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("删除失败")
        console.error(error)
      }
    })
}

// 批量删除
function handleBatchDelete() {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning("请选择要删除的证书模板")
    return
  }

  return ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 个证书模板吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      const ids = multipleSelection.value.map(item => item.id)
      return CertificateTemplateApi.batchDeleteCertificateTemplate({ ids })
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("批量删除成功")
        fetchTemplateList()
      } else {
        ElMessage.error(response.message || "批量删除失败")
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("批量删除失败")
        console.error(error)
      }
    })
}

// 表格选择变化
function handleSelectionChange(selection: CertificateTemplateType.CertificateTemplateListData[]) {
  multipleSelection.value = selection
}

// 提交表单
function handleSubmit() {
  if (!formRef.value) return

  // 设置图片URL
  if (backgroundImageList.value.length > 0) {
    formData.background_image = backgroundImageList.value[0].url || backgroundImageList.value[0].response?.data?.url
  }
  if (rightSealList.value.length > 0) {
    formData.cer_right_signature_seal = rightSealList.value[0].url || rightSealList.value[0].response?.data?.url
  }
  if (leftSealList.value.length > 0) {
    formData.cer_left_signature_seal = leftSealList.value[0].url || leftSealList.value[0].response?.data?.url
  }

  return formRef.value.validate()
    .then(() => {
      if (isEdit.value && currentId.value) {
        return CertificateTemplateApi.updateCertificateTemplate(currentId.value, formData)
      } else {
        return CertificateTemplateApi.createCertificateTemplate(formData)
      }
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success(isEdit.value ? "更新成功" : "创建成功")
        dialogVisible.value = false
        fetchTemplateList()
      } else {
        ElMessage.error(response.message || (isEdit.value ? "更新失败" : "创建失败"))
      }
    })
    .catch((error) => {
      ElMessage.error(isEdit.value ? "更新失败" : "创建失败")
      console.error(error)
    })
}

// 重置表单
function resetForm() {
  formData.name = ""
  formData.description = ""
  formData.background_image = ""
  formData.cer_type = 1
  formData.cer_fields = {}
  formData.cer_title = ""
  formData.cer_content = ""
  formData.cer_right_signature_company = ""
  formData.cer_right_signature_datetime = ""
  formData.cer_right_signature_seal = ""
  formData.cer_left_signature_company = ""
  formData.cer_left_signature_datetime = ""
  formData.cer_left_signature_seal = ""
  formRef.value?.clearValidate()
  backgroundImageList.value = []
  rightSealList.value = []
  leftSealList.value = []
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
  resetForm()
}

// 获取证书类型标签
function getCertificateTypeLabel(type: number | null) {
  if (!type) return "未知"
  const option = certificateTypeOptions.find(item => item.value === type)
  return option ? option.label : "未知"
}

// 自定义上传请求
function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append("file", file)
  return request({
    url: "upload/file",
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        onProgress({ percent })
      }
    }
  }).then((response: any) => {
    onSuccess(response)
    return response
  }).catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTemplateList()
})
</script>

<template>
  <div class="certificate-template-page">
    <div class="filter-container">
      <el-input v-model="queryParams.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleSearch" />
      <el-select v-model="queryParams.cer_type" placeholder="请选择证书类型" clearable class="filter-item" style="width: 150px">
        <el-option
          v-for="item in certificateTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增证书模板
      </el-button>
      <el-button type="danger" :disabled="multipleSelection.length === 0" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </div>

    <!-- 表格 -->
    <div class="grid-grouping">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="模板名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="cer_type" label="证书类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ getCertificateTypeLabel(row.cer_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cer_title" label="证书标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleIssue(row)">
              颁发
            </el-button>
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-if="total > queryParams.pageSize"
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入模板名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证书类型" prop="cer_type">
              <el-select v-model="formData.cer_type" placeholder="请选择证书类型" style="width: 100%">
                <el-option
                  v-for="item in certificateTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="证书标题" prop="cer_title">
          <el-input
            v-model="formData.cer_title"
            placeholder="请输入证书标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="证书内容" prop="cer_content">
          <el-input
            v-model="formData.cer_content"
            type="textarea"
            :rows="3"
            placeholder="请输入证书内容"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="背景图片">
          <el-upload
            v-model:file-list="backgroundImageList"
            class="uploader"
            :limit="1"
            :http-request="customUploadRequest"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="右侧签名公司">
              <el-input
                v-model="formData.cer_right_signature_company"
                placeholder="请输入右侧签名公司"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="右侧签名日期">
              <el-input
                v-model="formData.cer_right_signature_datetime"
                placeholder="请输入右侧签名日期"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="右侧印章">
          <el-upload
            v-model:file-list="rightSealList"
            class="uploader"
            :limit="1"
            :http-request="customUploadRequest"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="左侧签名公司">
              <el-input
                v-model="formData.cer_left_signature_company"
                placeholder="请输入左侧签名公司"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="左侧签名日期">
              <el-input
                v-model="formData.cer_left_signature_datetime"
                placeholder="请输入左侧签名日期"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="左侧印章">
          <el-upload
            v-model:file-list="leftSealList"
            class="uploader"
            :limit="1"
            :http-request="customUploadRequest"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? "更新" : "创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 证书颁发对话框 -->
    <el-dialog
      v-model="issueDialogVisible"
      title="颁发证书"
      width="80%"
      height="800px"
      :close-on-click-modal="false"
      @close="handleIssueClose"
    >
      <el-form
        ref="issueFormRef"
        :model="issueForm"
        label-width="100px"
        :rules="{ reason: [{ required: true, message: '请输入颁发原因', trigger: 'blur' }] }"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="department-tree">
              <h4>选择部门</h4>
              <el-tree
                :data="departmentList"
                node-key="_id"
                :props="{ children: 'children', label: 'name' }"
                @node-click="(data) => {
                  selectedDepartmentId = data._id
                  handleDepartmentChange()
                }"
                highlight-current
              />
            </div>
          </el-col>
          <el-col :span="16">
            <div class="user-list">
              <h4>选择用户</h4>
              <el-table
                :data="userList"
                @selection-change="(selection) => selectedUsers = selection.map((item: any) => item.id)"
                max-height="300px"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="用户名" />
                <el-table-column prop="realname" label="姓名" />
                <el-table-column prop="email" label="邮箱" />
                <el-table-column prop="phone" label="电话" />
              </el-table>
            </div>
          </el-col>
        </el-row>
        <el-form-item label="颁发原因" prop="reason" style="margin-top: 20px;">
          <el-input
            v-model="issueForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入颁发原因"
          />
        </el-form-item>
        <el-form-item label="颁发日期">
          <el-date-picker
            v-model="issueForm.issueDate"
            type="date"
            placeholder="选择颁发日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleIssueClose">取消</el-button>
          <el-button type="primary" :loading="issueLoading" @click="confirmIssue">
            确认颁发
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 20px 5px;
}

.pagination-wrapper {
  padding: 10px;
  background: #fff;
}

.dialog-footer {
  text-align: right;
}

.uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

/* 证书颁发对话框样式 */
.department-tree {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
  height: 350px;
  overflow-y: auto;
}

.department-tree h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.user-list {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
}

.user-list h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>

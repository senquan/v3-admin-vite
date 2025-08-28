<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type * as CoursewareType from "./apis/type"
import { formatDateTime } from "@/common/utils/datetime"
import { request } from "@/http/axios"
import * as CoursewareApi from "./apis"

// 响应式数据
const loading = ref(false)
const tableData = ref<CoursewareType.CoursewareListData[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref("新增课件")
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const multipleSelection = ref<CoursewareType.CoursewareListData[]>([])
const fileList = ref<any>([])

// 查询参数
const queryParams = reactive({
  keyword: "",
  category: "",
  status: 1,
  page: 1,
  pageSize: 10
})

// 表单数据
const formData = reactive<CoursewareType.CoursewareCreateData>({
  title: "",
  description: "",
  category: 1,
  tags: "",
  files: [],
  status: 1
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入课件标题", trigger: "blur" },
    { min: 1, max: 100, message: "标题长度在 1 到 100 个字符", trigger: "blur" }
  ],
  category: [
    { required: true, message: "请选择课件分类", trigger: "change" }
  ]
}

// 课件分类选项
const categoryOptions = [
  { label: "安全培训", value: 1 },
  { label: "技能培训", value: 2 },
  { label: "管理培训", value: 3 },
  { label: "其他", value: 4 }
]

// 状态选项
const statusOptions = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 }
]

// 获取课件列表
function fetchList() {
  loading.value = true
  return CoursewareApi.fetchList(queryParams)
    .then((response) => {
      if (response.data && response.data.coursewares) {
        tableData.value = response.data.coursewares
        total.value = response.data.total
      } else {
        ElMessage.error(response.message || "获取课件列表失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取课件列表失败")
      console.error(error)
    })
    .finally(() => {
      loading.value = false
    })
}

// 搜索
function handleSearch() {
  queryParams.page = 1
  fetchList()
}

// 分页变化
function handlePageChange(page: number) {
  queryParams.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.page = 1
  fetchList()
}

// 打开新增对话框
function handleAdd() {
  dialogTitle.value = "新增课件"
  isEdit.value = false
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

// 打开编辑对话框
function handleEdit(row: CoursewareType.CoursewareListData) {
  dialogTitle.value = "编辑课件"
  isEdit.value = true
  currentId.value = row.id

  return CoursewareApi.fetchDetail(row.id)
    .then((response) => {
      if (response.code === 0) {
        resetForm()
        const data = response.data
        formData.title = data.title
        formData.description = data.description || ""
        formData.category = data.category
        formData.tags = data.tags || ""
        formData.files = data.materials.map(m => ({
          name: m.title,
          url: m.file_path
        }))
        formData.status = data.status
        fileList.value = formData.files
        dialogVisible.value = true
      } else {
        ElMessage.error(response.message || "获取课件详情失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取课件详情失败")
      console.error(error)
    })
}

// 删除课件
function handleDelete(row: CoursewareType.CoursewareListData) {
  return ElMessageBox.confirm(
    `确定要删除课件"${row.title}"吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      return CoursewareApi.deleteCourseware(row.id)
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("删除成功")
        fetchList()
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

// 表格选择变化
function handleSelectionChange(selection: CoursewareType.CoursewareListData[]) {
  multipleSelection.value = selection
}

// 提交表单
function handleSubmit() {
  if (!formRef.value) return
  if (fileList.value.length === 0) {
    ElMessage.warning("请上传课件文件")
    return
  }
  formData.files = fileList.value.map((item: any) => {
    return {
      name: item.name,
      url: item.url || item.response.data.url
    }
  }).filter((item: any) => item.url !== "")
  return formRef.value.validate()
    .then(() => {
      if (isEdit.value && currentId.value) {
        return CoursewareApi.updateCourseware(currentId.value, formData)
      } else {
        return CoursewareApi.createCourseware(formData)
      }
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success(isEdit.value ? "更新成功" : "创建成功")
        dialogVisible.value = false
        fetchList()
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
  formData.title = ""
  formData.description = ""
  formData.category = 1
  formData.tags = ""
  formData.files = []
  formData.status = 1
  formRef.value?.clearValidate()
  fileList.value = []
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
  resetForm()
}

// 获取分类标签
function getCategoryLabel(category: number) {
  const option = categoryOptions.find((item: any) => item.value === category)
  return option ? option.label : "未知"
}

// 获取状态标签
function getStatusLabel(status: number) {
  return status === 1 ? "启用" : "禁用"
}

function handlePreview(file: any) {
  console.log(file)
}

function handleRemove(file: any, fileList: any) {
  console.log(file, fileList)
}

function beforeRemove(file: any, fileList: any): boolean {
  console.log(file, fileList)
  return true
}

function beforeUpload(file: any) {
  console.log(file)
}

function handleExceed(files: any, fileList: any) {
  console.log(files, fileList)
}

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
  fetchList()
})
</script>

<template>
  <div class="courseware-page">
    <div class="filter-container">
      <el-input v-model="queryParams.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleSearch" />
      <el-select v-model="queryParams.category" placeholder="请选择分类" clearable class="filter-item" style="width: 150px">
        <el-option
          v-for="item in categoryOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="filter-item" style="width: 120px">
        <el-option
          v-for="item in statusOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增课件
      </el-button>
      <!-- <el-button type="danger" :disabled="multipleSelection.length === 0" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button> -->
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
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag>{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="150" show-overflow-tooltip />
        <el-table-column prop="view_count" label="查看次数" width="100" align="center" />
        <el-table-column prop="download_count" label="下载次数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_time" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
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
      width="600px"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="课件标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入课件标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="课件描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入课件描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="课件分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课件文件" prop="file">
          <el-upload
            v-model:file-list="fileList"
            class="uploader"
            multiple
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-remove="beforeRemove"
            :before-upload="beforeUpload"
            :on-exceed="handleExceed"
            :http-request="customUploadRequest"
            style="width: 380px; margin-top: 20px;"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传课件文件
            </el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input
            v-model="formData.tags"
            placeholder="请输入标签，多个标签用逗号分隔"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
</style>

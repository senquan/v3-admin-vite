<script lang="ts" setup>
import type { FormInstance } from "element-plus"
import type * as SurveyType from "./apis/type"
import { formatDateTime } from "@/common/utils/datetime"
import * as SurveyApi from "./apis"

// 响应式数据
const loading = ref(false)
const tableData = ref<SurveyType.SurveyListData[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref("新增问卷")
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const multipleSelection = ref<SurveyType.SurveyListData[]>([])

// 查询参数
const queryParams = reactive({
  keyword: "",
  category: "",
  status: "",
  page: 1,
  pageSize: 10
})

// 表单数据
const formData = reactive<SurveyType.SurveyCreateData>({
  title: "",
  description: "",
  category: 1,
  status: 0,
  start_time: "",
  end_time: "",
  is_anonymous: 0,
  max_submissions: 0,
  questions: []
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入问卷标题", trigger: "blur" },
    { min: 1, max: 100, message: "标题长度在 1 到 100 个字符", trigger: "blur" }
  ],
  category: [
    { required: true, message: "请选择问卷分类", trigger: "change" }
  ]
}

// 问卷分类选项
const categoryOptions = [
  { label: "满意度调查", value: 1 },
  { label: "培训反馈", value: 2 },
  { label: "需求调研", value: 3 },
  { label: "其他", value: 4 }
]

// 状态选项
const statusOptions = [
  { label: "草稿", value: 0 },
  { label: "发布", value: 1 },
  { label: "已结束", value: 2 }
]

// 问题类型选项
const questionTypeOptions = [
  { label: "单选题", value: 1 },
  { label: "多选题", value: 2 },
  { label: "填空题", value: 3 },
  { label: "简答题", value: 4 }
]

// 获取问卷列表
function fetchList() {
  loading.value = true
  return SurveyApi.fetchList(queryParams)
    .then((response) => {
      if (response.data && response.data.surveys) {
        tableData.value = response.data.surveys
        total.value = response.data.total
      } else {
        ElMessage.error(response.message || "获取问卷列表失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取问卷列表失败")
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
  dialogTitle.value = "新增问卷"
  isEdit.value = false
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

function handleImport() {
  ElMessage.success("Coming SOON")
}

// 打开编辑对话框
function handleEdit(row: SurveyType.SurveyListData) {
  dialogTitle.value = "编辑问卷"
  isEdit.value = true
  currentId.value = row.id

  return SurveyApi.fetchDetail(row.id)
    .then((response) => {
      if (response.code === 0) {
        resetForm()
        const data = response.data
        formData.title = data.title
        formData.description = data.description || ""
        formData.category = data.category
        formData.status = data.status
        formData.start_time = data.start_time || ""
        formData.end_time = data.end_time || ""
        formData.is_anonymous = data.is_anonymous
        formData.max_submissions = data.max_submissions || 0
        formData.questions = data.questions || []
        dialogVisible.value = true
      } else {
        ElMessage.error(response.message || "获取问卷详情失败")
      }
    })
    .catch((error) => {
      ElMessage.error("获取问卷详情失败")
      console.error(error)
    })
}

// 删除问卷
function handleDelete(row: SurveyType.SurveyListData) {
  return ElMessageBox.confirm(
    `确定要删除问卷"${row.title}"吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      return SurveyApi.deleteSurvey(row.id)
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

// 发布问卷
function handlePublish(row: SurveyType.SurveyListData) {
  return ElMessageBox.confirm(
    `确定要发布问卷"${row.title}"吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "info"
    }
  )
    .then(() => {
      return SurveyApi.publishSurvey(row.id)
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("发布成功")
        fetchList()
      } else {
        ElMessage.error(response.message || "发布失败")
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("发布失败")
        console.error(error)
      }
    })
}

// 结束问卷
function handleEnd(row: SurveyType.SurveyListData) {
  return ElMessageBox.confirm(
    `确定要结束问卷"${row.title}"吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      return SurveyApi.endSurvey(row.id)
    })
    .then((response) => {
      if (response.code === 0) {
        ElMessage.success("结束成功")
        fetchList()
      } else {
        ElMessage.error(response.message || "结束失败")
      }
    })
    .catch((error) => {
      if (error !== "cancel") {
        ElMessage.error("结束失败")
        console.error(error)
      }
    })
}

// 表格选择变化
function handleSelectionChange(selection: SurveyType.SurveyListData[]) {
  multipleSelection.value = selection
}

// 提交表单
function handleSubmit() {
  if (!formRef.value) return
  return formRef.value.validate()
    .then(() => {
      if (isEdit.value && currentId.value) {
        return SurveyApi.updateSurvey(currentId.value, formData)
      } else {
        return SurveyApi.createSurvey(formData)
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
  formData.status = 0
  formData.start_time = ""
  formData.end_time = ""
  formData.is_anonymous = 0
  formData.max_submissions = 0
  formData.questions = []
  formRef.value?.clearValidate()
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
  const option = statusOptions.find((item: any) => item.value === status)
  return option ? option.label : "未知"
}

// 获取状态颜色
function getStatusColor(status: number) {
  switch (status) {
    case 0:
      return "info"
    case 1:
      return "success"
    case 2:
      return "danger"
    default:
      return "info"
  }
}

// 添加问题
function addQuestion() {
  formData.questions = formData.questions || []
  formData.questions.push({
    question_text: "",
    question_type: 1,
    is_required: 0,
    sort_order: formData.questions.length + 1,
    options: []
  })
}

// 删除问题
function removeQuestion(index: number) {
  formData.questions?.splice(index, 1)
  // 重新排序
  formData.questions?.forEach((question, idx) => {
    question.sort_order = idx + 1
  })
}

// 添加选项
function addOption(questionIndex: number) {
  formData.questions = formData.questions || []
  if (!formData.questions?.[questionIndex].options) {
    formData.questions[questionIndex].options = []
  }
  formData.questions[questionIndex].options?.push({
    option_text: "",
    option_value: ""
  })
}

// 删除选项
function removeOption(questionIndex: number, optionIndex: number) {
  formData.questions?.[questionIndex].options?.splice(optionIndex, 1)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="survey-page">
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
        新增问卷
      </el-button>
      <el-button type="primary" @click="handleImport">
        <el-icon><Upload /></el-icon>
        导入问卷
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
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag>{{ getCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submission_count" label="提交数" width="100" align="center" />
        <el-table-column prop="view_count" label="查看次数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">
            {{ row.start_time ? formatDateTime(row.start_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180">
          <template #default="{ row }">
            {{ row.end_time ? formatDateTime(row.end_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_time" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-if="row.status === 0" type="success" size="small" @click="handlePublish(row)">
              发布
            </el-button>
            <el-button v-if="row.status === 1" type="warning" size="small" @click="handleEnd(row)">
              结束
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
        label-width="100px"
      >
        <el-form-item label="问卷标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入问卷标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="问卷描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入问卷描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="问卷分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="formData.start_time"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="formData.end_time"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否匿名">
              <el-radio-group v-model="formData.is_anonymous">
                <el-radio :label="0">实名</el-radio>
                <el-radio :label="1">匿名</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大提交数">
              <el-input-number
                v-model="formData.max_submissions"
                :min="1"
                placeholder="不限制"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 问题设计 -->
        <el-form-item label="问题设计">
          <div style="width: 100%">
            <el-button type="primary" @click="addQuestion">
              <el-icon><Plus /></el-icon>
              添加问题
            </el-button>

            <div v-for="(question, qIndex) in formData.questions" :key="qIndex" class="question-item">
              <el-card style="margin-top: 15px;">
                <template #header>
                  <div class="question-header">
                    <span>问题 {{ qIndex + 1 }}</span>
                    <el-button type="danger" size="small" @click="removeQuestion(qIndex)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </template>

                <el-form-item label="问题内容">
                  <el-input
                    v-model="question.question_text"
                    placeholder="请输入问题内容"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="问题类型">
                      <el-select v-model="question.question_type" style="width: 100%">
                        <el-option
                          v-for="item in questionTypeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="是否必填">
                      <el-radio-group v-model="question.is_required">
                        <el-radio :label="0">非必填</el-radio>
                        <el-radio :label="1">必填</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- 选择题选项 -->
                <div v-if="question.question_type === 1 || question.question_type === 2">
                  <el-form-item label="选项设置">
                    <div style="width: 100%">
                      <el-button size="small" @click="addOption(qIndex)">
                        <el-icon><Plus /></el-icon>
                        添加选项
                      </el-button>

                      <div v-for="(option, oIndex) in question.options" :key="oIndex" class="option-item">
                        <el-row :gutter="10" style="margin-top: 10px;">
                          <el-col :span="10">
                            <el-input
                              v-model="option.option_text"
                              placeholder="选项文本"
                            />
                          </el-col>
                          <el-col :span="10">
                            <el-input
                              v-model="option.option_value"
                              placeholder="选项值"
                            />
                          </el-col>
                          <el-col :span="4">
                            <el-button type="danger" size="small" @click="removeOption(qIndex, oIndex)">
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </el-col>
                        </el-row>
                      </div>
                    </div>
                  </el-form-item>
                </div>
              </el-card>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="1">发布</el-radio>
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

.question-item {
  margin-bottom: 15px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-item {
  margin-top: 10px;
}
</style>

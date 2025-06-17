<script lang="ts" setup>
import type { FormInstance, FormRules } from "element-plus"
import type {
  CreateQuestionParams,
  Question,
  QuestionListParams,
  QuestionOption
} from "./apis/type"
import { ElMessage, ElMessageBox } from "element-plus"
import QuestionImport from "./_import.vue"
import {
  batchDeleteQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionDetail,
  getQuestionList,
  updateQuestion
} from "./apis"

// 响应式数据
const loading = ref(false)
const tableData = ref<Question[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref("")
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const multipleSelection = ref<Question[]>([])

// 搜索表单
const searchForm = reactive<QuestionListParams>({
  page: 1,
  pageSize: 20,
  keyword: "",
  question_type: "",
  category_id: undefined,
  difficulty: undefined
})

// 题目表单
const questionForm = reactive<CreateQuestionParams>({
  category_id: undefined,
  training_category: undefined,
  question_type: "单选题",
  content: "",
  difficulty: 1,
  answer: "",
  analysis: "",
  has_image: false,
  image_path: "",
  fits_position: undefined,
  score: 1,
  source: "",
  status: true,
  options: []
})

// 选项表单
const optionForm = reactive<QuestionOption>({
  option_label: "A",
  option_content: "",
  is_correct: false
})

const questionFormRef = ref<FormInstance>()
const optionDialogVisible = ref(false)
const optionDialogTitle = ref("")
const isEditOption = ref(false)
const currentOptionIndex = ref<number | null>(null)
const questionImportRef = ref<any>([])

// 表单验证规则
const questionRules = reactive<FormRules<CreateQuestionParams>>({
  question_type: [{ required: true, message: "请选择题目类型", trigger: "change" }],
  content: [{ required: true, message: "请输入题目内容", trigger: "blur" }],
  difficulty: [{ required: true, message: "请选择难度等级", trigger: "change" }],
  score: [{ required: true, message: "请输入分值", trigger: "blur" }]
})

const optionRules = reactive<FormRules<QuestionOption>>({
  option_label: [{ required: true, message: "请输入选项标签", trigger: "blur" }],
  option_content: [{ required: true, message: "请输入选项内容", trigger: "blur" }]
})

// 题目类型选项
const questionTypeOptions = [
  { label: "单选题", value: "单选" },
  { label: "多选题", value: "多选" },
  { label: "判断题", value: "判断" },
  { label: "填空题", value: "填空" },
  { label: "简答题", value: "简答" }
]

// 难度等级选项
const difficultyOptions = [
  { label: "1级 - 很简单", value: 1 },
  { label: "2级 - 简单", value: 2 },
  { label: "3级 - 中等", value: 3 },
  { label: "4级 - 困难", value: 4 },
  { label: "5级 - 很困难", value: 5 }
]

// 计算属性
const hasOptions = computed(() => {
  return ["单选题", "多选题"].includes(questionForm.question_type)
})

// 获取题库列表
function fetchQuestionList() {
  loading.value = true
  getQuestionList(searchForm)
    .then((res) => {
      if (res.data && res.data.questions) {
        tableData.value = res.data.questions
        total.value = res.data.total
      } else {
        ElMessage.error(res.message || "获取题库列表失败")
      }
    })
    .catch((error) => {
      console.error("获取题库列表失败:", error)
      ElMessage.error("获取题库列表失败")
    })
    .finally(() => {
      loading.value = false
    })
}

// 搜索
function handleFilter() {
  searchForm.page = 1
  fetchQuestionList()
}

function handleImport() {
  questionImportRef.value?.open()
}

// 分页变化
function handlePageChange(page: number) {
  searchForm.page = page
  fetchQuestionList()
}

function handleSizeChange(size: number) {
  searchForm.pageSize = size
  searchForm.page = 1
  fetchQuestionList()
}

// 多选变化
function handleSelectionChange(selection: Question[]) {
  multipleSelection.value = selection
}

// 重置表单
function resetForm() {
  Object.assign(questionForm, {
    category_id: undefined,
    training_category: undefined,
    question_type: "单选题",
    content: "",
    difficulty: 1,
    answer: "",
    analysis: "",
    has_image: false,
    image_path: "",
    fits_position: undefined,
    score: 1,
    source: "",
    status: true,
    options: []
  })
  questionFormRef.value?.clearValidate()
}

// 打开新增对话框
function handleAdd() {
  resetForm()
  dialogTitle.value = "新增题目"
  isEdit.value = false
  currentId.value = null
  dialogVisible.value = true
}

// 打开编辑对话框
function handleEdit(row: Question) {
  resetForm()
  dialogTitle.value = "编辑题目"
  isEdit.value = true
  currentId.value = row._id!

  // 获取题目详情
  getQuestionDetail(row._id!)
    .then((res) => {
      if (res.data) {
        const question = res.data
        Object.assign(questionForm, {
          category_id: question.category_id,
          training_category: question.training_category,
          question_type: question.question_type,
          content: question.content,
          difficulty: question.difficulty,
          answer: question.answer,
          analysis: question.analysis,
          has_image: question.has_image,
          image_path: question.image_path,
          fits_position: question.fits_position,
          score: question.score,
          source: question.source,
          status: question.status,
          options: question.options || []
        })
        dialogVisible.value = true
      } else {
        ElMessage.error(res.message || "获取题目详情失败")
      }
    })
    .catch((error) => {
      console.error("获取题目详情失败:", error)
      ElMessage.error("获取题目详情失败")
    })
}

// 保存题目
function handleSave() {
  questionFormRef.value?.validate((valid) => {
    if (valid) {
      const saveData = { ...questionForm }

      const apiCall = isEdit.value
        ? updateQuestion(currentId.value!, saveData)
        : createQuestion(saveData)

      apiCall
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success(isEdit.value ? "更新题目成功" : "创建题目成功")
            dialogVisible.value = false
            fetchQuestionList()
          } else {
            ElMessage.error(res.message || (isEdit.value ? "更新题目失败" : "创建题目失败"))
          }
        })
        .catch((error) => {
          console.error(isEdit.value ? "更新题目失败:" : "创建题目失败:", error)
          ElMessage.error(isEdit.value ? "更新题目失败" : "创建题目失败")
        })
    }
  })
}

// 删除题目
function handleDelete(row: Question) {
  ElMessageBox.confirm(
    `确定要删除题目"${row.content.substring(0, 20)}..."吗？`,
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      deleteQuestion(row._id!)
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success("删除题目成功")
            fetchQuestionList()
          } else {
            ElMessage.error(res.message || "删除题目失败")
          }
        })
        .catch((error) => {
          console.error("删除题目失败:", error)
          ElMessage.error("删除题目失败")
        })
    })
    .catch(() => {
      // 用户取消删除
    })
}

// 批量删除
// function handleBatchDelete() {
//   if (multipleSelection.value.length === 0) {
//     ElMessage.warning("请选择要删除的题目")
//     return
//   }

//   ElMessageBox.confirm(
//     `确定要删除选中的 ${multipleSelection.value.length} 个题目吗？`,
//     "确认批量删除",
//     {
//       confirmButtonText: "确定",
//       cancelButtonText: "取消",
//       type: "warning"
//     }
//   )
//     .then(() => {
//       const ids = multipleSelection.value.map(item => item._id!)
//       batchDeleteQuestions({ ids })
//         .then(res => {
//           if (res.code === 0) {
//             ElMessage.success("批量删除题目成功")
//             fetchQuestionList()
//           } else {
//             ElMessage.error(res.message || "批量删除题目失败")
//           }
//         })
//         .catch(error => {
//           console.error("批量删除题目失败:", error)
//           ElMessage.error("批量删除题目失败")
//         })
//     })
//     .catch(() => {
//       // 用户取消删除
//     })
// }

// 选项管理
function handleAddOption() {
  Object.assign(optionForm, {
    option_label: String.fromCharCode(65 + questionForm.options!.length), // A, B, C, D...
    option_content: "",
    is_correct: false
  })
  optionDialogTitle.value = "新增选项"
  isEditOption.value = false
  currentOptionIndex.value = null
  optionDialogVisible.value = true
}

function handleEditOption(index: number) {
  const option = questionForm.options![index]
  Object.assign(optionForm, option)
  optionDialogTitle.value = "编辑选项"
  isEditOption.value = true
  currentOptionIndex.value = index
  optionDialogVisible.value = true
}

function handleSaveOption() {
  if (!optionForm.option_label || !optionForm.option_content) {
    ElMessage.warning("请填写完整的选项信息")
    return
  }

  if (!questionForm.options) {
    questionForm.options = []
  }

  if (isEditOption.value && currentOptionIndex.value !== null) {
    questionForm.options[currentOptionIndex.value] = { ...optionForm }
  } else {
    questionForm.options.push({ ...optionForm })
  }

  optionDialogVisible.value = false
}

function handleDeleteOption(index: number) {
  questionForm.options!.splice(index, 1)
}

function importSuccess() {
  handleFilter()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchQuestionList()
})
</script>

<template>
  <div class="question-management">
    <!-- 搜索区域 -->
    <div class="filter-container">
      <el-input
        v-model="searchForm.keyword"
        placeholder="请输入题目内容关键词"
        clearable
        class="filter-item"
        style="width: 200px"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="searchForm.question_type"
        placeholder="请选择题目类型"
        clearable
        @change="handleFilter"
        class="filter-item"
        style="width: 150px"
      >
        <el-option
          v-for="item in questionTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select
        v-model="searchForm.difficulty"
        placeholder="请选择难度等级"
        clearable
        @change="handleFilter"
        class="filter-item"
        style="width: 150px"
      >
        <el-option
          v-for="item in difficultyOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" @click="handleFilter"><i class="ep-search" /> 搜索</el-button>
      <el-button type="primary" @click="handleAdd"><i class="ep-plus" /> 新增题目</el-button>
      <!-- <el-button type="danger" :disabled="multipleSelection.length === 0" @click="handleBatchDelete"><i class="ep-delete" /> 批量删除</el-button> -->.
      <el-button type="primary" @click="handleImport">批量导入题目</el-button>
    </div>
    <!-- 表格区域 -->
    <div class="grid-grouping">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="_id" label="序号" width="80" />
        <el-table-column prop="question_type" label="题目类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.question_type === '单选题' ? 'primary' : row.question_type === '多选题' ? 'success' : 'info'">
              {{ row.question_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="题目内容" min-width="300">
          <template #default="{ row }">
            <div class="question-content">
              <el-text truncated>{{ row.content }}</el-text>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80" align="center" />
        <el-table-column prop="score" label="分值" width="80" align="center" />
        <el-table-column prop="categoryEntity.name" label="分类" width="120" />
        <el-table-column prop="creatorEntity.username" label="创建人" width="100" />
        <el-table-column prop="create_time" label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.create_time).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
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

    <div class="pagination-container">
      <el-pagination
        v-if="total > Number(searchForm.pageSize)"
        v-model:current-page="searchForm.page"
        v-model:page-size="searchForm.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 题目编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="questionFormRef"
        :model="questionForm"
        :rules="questionRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题目类型" prop="question_type">
              <el-select v-model="questionForm.question_type" style="width: 100%">
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
            <el-form-item label="难度等级" prop="difficulty">
              <el-select v-model="questionForm.difficulty" style="width: 100%">
                <el-option
                  v-for="item in difficultyOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题目内容" prop="content">
          <el-input
            v-model="questionForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入题目内容"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分值" prop="score">
              <el-input-number
                v-model="questionForm.score"
                :min="1"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源出处">
              <el-input v-model="questionForm.source" placeholder="请输入来源出处" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标准答案">
          <el-input
            v-model="questionForm.answer"
            type="textarea"
            :rows="2"
            placeholder="请输入标准答案"
          />
        </el-form-item>

        <el-form-item label="解析">
          <el-input
            v-model="questionForm.analysis"
            type="textarea"
            :rows="3"
            placeholder="请输入题目解析"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="questionForm.status"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <!-- 选项管理 -->
        <el-form-item v-if="hasOptions" label="选项管理">
          <div class="options-container">
            <div class="options-header">
              <span>题目选项</span>
              <el-button type="primary" size="small" @click="handleAddOption">
                <i class="ep-plus" /> 添加选项
              </el-button>
            </div>
            <div v-if="questionForm.options && questionForm.options.length > 0" class="options-list">
              <div
                v-for="(option, index) in questionForm.options"
                :key="index"
                class="option-item"
              >
                <div class="option-content">
                  <el-tag :type="option.is_correct ? 'success' : 'info'" class="option-label">
                    {{ option.option_label }}
                  </el-tag>
                  <span class="option-text">{{ option.option_content }}</span>
                  <el-tag v-if="option.is_correct" type="success" size="small">
                    正确答案
                  </el-tag>
                </div>
                <div class="option-actions">
                  <el-button type="primary" size="small" @click="handleEditOption(index)">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" @click="handleDeleteOption(index)">
                    删除
                  </el-button>
                </div>
              </div>
            </div>
            <div v-else class="no-options">
              <el-empty description="暂无选项，请添加选项" :image-size="60" />
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 选项编辑对话框 -->
    <el-dialog
      v-model="optionDialogVisible"
      :title="optionDialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="optionForm" :rules="optionRules" label-width="80px">
        <el-form-item label="选项标签" prop="option_label">
          <el-input v-model="optionForm.option_label" placeholder="如：A, B, C, D" />
        </el-form-item>
        <el-form-item label="选项内容" prop="option_content">
          <el-input
            v-model="optionForm.option_content"
            type="textarea"
            :rows="3"
            placeholder="请输入选项内容"
          />
        </el-form-item>
        <el-form-item label="正确答案">
          <el-switch
            v-model="optionForm.is_correct"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="optionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveOption">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <QuestionImport
      ref="questionImportRef"
      @success="importSuccess"
    />
  </div>
</template>

<style scoped>
.question-management {
  padding: 20px;
}

.filter-container {
  background: #fff;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  padding: 20px 5px;
}
.fr {
  float: right;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.question-content {
  line-height: 1.5;
  word-break: break-word;
}

.options-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.option-label {
  min-width: 30px;
  text-align: center;
}

.option-text {
  flex: 1;
  word-break: break-word;
}

.option-actions {
  display: flex;
  gap: 5px;
}

.no-options {
  text-align: center;
  padding: 20px;
}

.dialog-footer {
  text-align: right;
}
</style>

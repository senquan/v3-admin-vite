<script setup lang="ts">
import type { Exam, ExamListParams, GenerateExamParams } from "./apis/exam"
import { generateExam, getExamDetail, getExamList, regenerateExam, updateExamSettings } from "./apis/exam"

// 响应式数据
const loading = ref(false)
const generateLoading = ref(false)
const settingsLoading = ref(false)
const tableData = ref<Exam[]>([])
const generateDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const settingsDialogVisible = ref(false)
const currentExam = ref<Exam | null>(null)
const generateFormRef = ref()
const settingsFormRef = ref()

// 搜索表单
const searchForm = reactive<ExamListParams>({
  keyword: "",
  type: undefined,
  category_id: undefined,
  level: undefined
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 生成考试表单
const generateForm = reactive<GenerateExamParams>({
  title: "",
  description: "",
  examType: 1,
  settings: {
    totalScore: 100,
    examCategory: 1,
    level: 2,
    coverage: 80,
    difficulty: 5,
    fairness: 5,
    questionCount: 20,
    questionTypes: ["single_choice", "multiple_choice"],
    categories: [1]
  }
})

// 设置表单
const settingsForm = reactive({
  totalScore: 100,
  level: 2,
  examCategory: 1
})

// 表单验证规则
const generateRules = {
  "title": [{ required: true, message: "请输入考试名称", trigger: "blur" }],
  "examType": [{ required: true, message: "请选择考试类型", trigger: "change" }],
  "settings.totalScore": [{ required: true, message: "请输入总分", trigger: "blur" }],
  "settings.questionCount": [{ required: true, message: "请输入题目数量", trigger: "blur" }],
  "settings.level": [{ required: true, message: "请选择难度级别", trigger: "change" }],
  "settings.examCategory": [{ required: true, message: "请选择考试分类", trigger: "change" }]
}

const settingsRules = {
  totalScore: [{ required: true, message: "请输入总分", trigger: "blur" }],
  level: [{ required: true, message: "请选择难度级别", trigger: "change" }],
  examCategory: [{ required: true, message: "请选择考试分类", trigger: "change" }]
}

// 获取考试列表
async function fetchExamList() {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    const response = await getExamList(params)
    if (response.code === 200) {
      tableData.value = response.data.exams
      pagination.total = response.data.total
    }
  } catch (error) {
    console.error("获取考试列表失败:", error)
    ElMessage.error("获取考试列表失败")
  } finally {
    loading.value = false
  }
}

// 搜索
// function handleSearch() {
//   pagination.page = 1
//   fetchExamList()
// }

// 重置
// function handleReset() {
//   Object.assign(searchForm, {
//     keyword: "",
//     type: undefined,
//     category_id: undefined,
//     level: undefined
//   })
//   pagination.page = 1
//   fetchExamList()
// }

// 排序变化
function handleSortChange() {
  fetchExamList()
}

// 分页大小变化
function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchExamList()
}

// 当前页变化
function handleCurrentChange(page: number) {
  pagination.page = page
  fetchExamList()
}

// 显示生成对话框
// function showGenerateDialog() {
//   generateDialogVisible.value = true
// }

// 生成考试
async function handleGenerateExam() {
  try {
    await generateFormRef.value.validate()
    generateLoading.value = true

    const response = await generateExam(generateForm)
    if (response.code === 200) {
      ElMessage.success("考试生成成功")
      generateDialogVisible.value = false
      fetchExamList()
      // 重置表单
      Object.assign(generateForm, {
        title: "",
        description: "",
        examType: 1,
        settings: {
          totalScore: 100,
          examCategory: 1,
          level: 2,
          coverage: 80,
          difficulty: 5,
          fairness: 5,
          questionCount: 20,
          questionTypes: ["single_choice", "multiple_choice"],
          categories: [1]
        }
      })
    }
  } catch (error) {
    console.error("生成考试失败:", error)
    ElMessage.error("生成考试失败")
  } finally {
    generateLoading.value = false
  }
}

// 查看详情
async function handleViewDetail(exam: Exam) {
  try {
    const response = await getExamDetail(exam._id!)
    if (response.code === 200) {
      currentExam.value = response.data.exam
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error("获取考试详情失败:", error)
    ElMessage.error("获取考试详情失败")
  }
}

// 开始考试
function handleStartExam(exam: Exam) {
  console.log(exam)
  ElMessage.info("开始考试功能待实现")
}

// 编辑设置
function handleEditSettings(exam: Exam) {
  currentExam.value = exam
  settingsForm.totalScore = exam.total_score
  settingsForm.level = exam.level
  settingsForm.examCategory = exam.category_id
  settingsDialogVisible.value = true
}

// 更新设置
async function handleUpdateSettings() {
  try {
    await settingsFormRef.value.validate()
    settingsLoading.value = true

    const response = await updateExamSettings(currentExam.value!._id!, settingsForm)
    if (response.code === 200) {
      ElMessage.success("设置更新成功")
      settingsDialogVisible.value = false
      fetchExamList()
    }
  } catch (error) {
    console.error("更新设置失败:", error)
    ElMessage.error("更新设置失败")
  } finally {
    settingsLoading.value = false
  }
}

// 重新生成考试
async function handleRegenerateExam(exam: Exam) {
  try {
    await ElMessageBox.confirm("确认重新生成此考试的题目？原有题目将被替换。", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    const response = await regenerateExam(exam._id!)
    if (response.code === 200) {
      ElMessage.success("考试重新生成成功")
      fetchExamList()
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重新生成考试失败:", error)
      ElMessage.error("重新生成考试失败")
    }
  }
}

// 获取考试类型名称
function getExamTypeName(type: number) {
  const typeMap: Record<number, string> = {
    1: "练习考试",
    2: "正式考试",
    3: "模拟考试"
  }
  return typeMap[type] || "未知"
}

// 获取考试类型标签类型
function getExamTypeTagType(type: number): "success" | "warning" | "info" | "primary" | "danger" {
  const typeMap: Record<number, "success" | "warning" | "info" | "primary" | "danger"> = {
    1: "success",
    2: "danger",
    3: "warning"
  }
  return typeMap[type] || "info"
}

// 获取难度级别名称
function getLevelName(level: number) {
  const levelMap: Record<number, string> = {
    1: "简单",
    2: "中等",
    3: "困难"
  }
  return levelMap[level] || "未知"
}

// 获取难度级别标签类型
function getLevelTagType(level: number): "success" | "warning" | "info" | "primary" | "danger" {
  const typeMap: Record<number, "success" | "warning" | "info" | "primary" | "danger"> = {
    1: "success",
    2: "warning",
    3: "danger"
  }
  return typeMap[level] || "info"
}

// 获取题目类型名称
function getQuestionTypeName(type: string | undefined) {
  const typeMap: Record<string, string> = {
    single_choice: "单选题",
    multiple_choice: "多选题",
    true_false: "判断题",
    fill_blank: "填空题",
    short_answer: "简答题"
  }
  return type ? typeMap[type] || "未知" : "-"
}

// 获取难度标签类型
function getDifficultyTagType(difficulty: number | undefined): "success" | "warning" | "info" | "primary" | "danger" {
  if (!difficulty) return "info"
  if (difficulty <= 3) return "success"
  if (difficulty <= 7) return "warning"
  return "danger"
}

// 获取难度名称
function getDifficultyName(difficulty: number | undefined) {
  if (!difficulty) return "-"
  if (difficulty <= 3) return "简单"
  if (difficulty <= 7) return "中等"
  return "困难"
}

// 格式化日期
function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString("zh-CN")
}

// 组件挂载
onMounted(() => {
  fetchExamList()
})
</script>

<template>
  <div class="exam-center-container">
    <!-- 页面头部 -->
    <!-- <div class="page-header">
      <el-row :gutter="20">
        <el-col :span="18">
          <div class="header-content">
            <h2>考试中心</h2>
            <p>智能生成考试，支持多种题型和难度配置</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="header-actions">
            <el-button type="primary" size="large" @click="showGenerateDialog">
              <el-icon><Plus /></el-icon>
              生成新考试
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div> -->

    <!-- 搜索和筛选 -->
    <!-- <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="考试名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入考试名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="考试类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="练习考试" :value="1" />
            <el-option label="正式考试" :value="2" />
            <el-option label="模拟考试" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试分类">
          <el-select v-model="searchForm.category_id" placeholder="请选择分类" clearable style="width: 150px">
            <el-option label="技能考试" :value="1" />
            <el-option label="安全考试" :value="2" />
            <el-option label="管理考试" :value="3" />
            <el-option label="其他考试" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度级别">
          <el-select v-model="searchForm.level" placeholder="请选择难度" clearable style="width: 150px">
            <el-option label="简单" :value="1" />
            <el-option label="中等" :value="2" />
            <el-option label="困难" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card> -->

    <!-- 考试列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>考试列表</span>
          <div class="header-stats">
            <el-tag type="info">共 {{ pagination.total }} 场考试</el-tag>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="title" label="考试名称" min-width="200">
          <template #default="{ row }">
            <div class="exam-title">
              <div class="title">{{ row.title }}</div>
              <div class="description">{{ row.description || "暂无描述" }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="考试类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getExamTypeTagType(row.type)">{{ getExamTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="categoryEntity.name" label="考试分类" width="120">
          <template #default="{ row }">
            {{ row.categoryEntity?.name || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="level" label="难度级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)">{{ getLevelName(row.level) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="total_score" label="总分" width="80" />

        <el-table-column prop="duration" label="考试时长" width="100">
          <template #default="{ row }">
            {{ row.duration }}分钟
          </template>
        </el-table-column>

        <el-table-column prop="examQuestions" label="题目数量" width="100">
          <template #default="{ row }">
            {{ row.examQuestions?.length || 0 }}题
          </template>
        </el-table-column>

        <el-table-column prop="creatorEntity.username" label="创建者" width="120">
          <template #default="{ row }">
            {{ row.creatorEntity?.username || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="创建时间" width="180" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.create_time) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button type="success" size="small" @click="handleStartExam(row)">
              开始考试
            </el-button>
            <el-button type="warning" size="small" @click="handleEditSettings(row)">
              编辑设置
            </el-button>
            <el-button type="info" size="small" @click="handleRegenerateExam(row)">
              重新生成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 生成考试对话框 -->
    <el-dialog v-model="generateDialogVisible" title="生成新考试" width="800px">
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="考试名称" prop="title">
              <el-input v-model="generateForm.title" placeholder="请输入考试名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试类型" prop="examType">
              <el-select v-model="generateForm.examType" placeholder="请选择考试类型" style="width: 100%">
                <el-option label="练习考试" :value="1" />
                <el-option label="正式考试" :value="2" />
                <el-option label="模拟考试" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="考试描述">
          <el-input v-model="generateForm.description" type="textarea" :rows="3" placeholder="请输入考试描述" />
        </el-form-item>

        <el-divider content-position="left">考试设置</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="总分" prop="settings.totalScore">
              <el-input-number v-model="generateForm.settings!.totalScore" :min="1" :max="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题目数量" prop="settings.questionCount">
              <el-input-number v-model="generateForm.settings!.questionCount" :min="1" :max="200" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度级别" prop="settings.level">
              <el-select v-model="generateForm.settings!.level" placeholder="请选择难度" style="width: 100%">
                <el-option label="简单" :value="1" />
                <el-option label="中等" :value="2" />
                <el-option label="困难" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="考试分类" prop="settings.examCategory">
              <el-select v-model="generateForm.settings!.examCategory" placeholder="请选择分类" style="width: 100%">
                <el-option label="技能考试" :value="1" />
                <el-option label="安全考试" :value="2" />
                <el-option label="管理考试" :value="3" />
                <el-option label="其他考试" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="知识覆盖率" prop="settings.coverage">
              <el-slider v-model="generateForm.settings!.coverage" :min="50" :max="100" show-input style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难易度分布" prop="settings.difficulty">
              <el-slider v-model="generateForm.settings!.difficulty" :min="1" :max="10" show-input style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题目类型">
              <el-checkbox-group v-model="generateForm.settings!.questionTypes">
                <el-checkbox label="单选题" value="single_choice" />
                <el-checkbox label="多选题" value="multiple_choice" />
                <el-checkbox label="判断题" value="true_false" />
                <el-checkbox label="填空题" value="fill_blank" />
                <el-checkbox label="简答题" value="short_answer" />
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公平性指标">
              <el-slider v-model="generateForm.settings!.fairness" :min="1" :max="10" show-input style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="generateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGenerateExam" :loading="generateLoading">
            生成考试
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 考试详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="考试详情" width="900px">
      <div v-if="currentExam" class="exam-detail">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="考试名称">{{ currentExam.title }}</el-descriptions-item>
          <el-descriptions-item label="考试类型">{{ getExamTypeName(currentExam.type) }}</el-descriptions-item>
          <el-descriptions-item label="考试分类">{{ currentExam.categoryEntity?.name || "-" }}</el-descriptions-item>
          <el-descriptions-item label="难度级别">{{ getLevelName(currentExam.level) }}</el-descriptions-item>
          <el-descriptions-item label="总分">{{ currentExam.total_score }}分</el-descriptions-item>
          <el-descriptions-item label="及格分">{{ currentExam.pass_score }}分</el-descriptions-item>
          <el-descriptions-item label="考试时长">{{ currentExam.duration }}分钟</el-descriptions-item>
          <el-descriptions-item label="题目数量">{{ currentExam.examQuestions?.length || 0 }}题</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ currentExam.creatorEntity?.username || "-" }}</el-descriptions-item>
        </el-descriptions>

        <div class="exam-description" style="margin-top: 20px;" v-if="currentExam.description">
          <h4>考试描述</h4>
          <p>{{ currentExam.description }}</p>
        </div>

        <div class="exam-questions" style="margin-top: 20px;">
          <h4>题目列表</h4>
          <el-table :data="currentExam.examQuestions" style="width: 100%" max-height="400">
            <el-table-column prop="question_order" label="序号" width="80" />
            <el-table-column prop="questionEntity.content" label="题目内容" min-width="300">
              <template #default="{ row }">
                <div class="question-content">
                  <div v-html="row.questionEntity?.content || '-'" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="questionEntity.question_type" label="题型" width="100">
              <template #default="{ row }">
                {{ getQuestionTypeName(row.questionEntity?.question_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="questionEntity.difficulty" label="难度" width="80">
              <template #default="{ row }">
                <el-tag :type="getDifficultyTagType(row.questionEntity?.difficulty)">{{ getDifficultyName(row.questionEntity?.difficulty) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="question_score" label="分值" width="80" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑设置对话框 -->
    <el-dialog v-model="settingsDialogVisible" title="编辑考试设置" width="600px">
      <el-form :model="settingsForm" :rules="settingsRules" ref="settingsFormRef" label-width="120px">
        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="settingsForm.totalScore" :min="1" :max="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="难度级别" prop="level">
          <el-select v-model="settingsForm.level" placeholder="请选择难度" style="width: 100%">
            <el-option label="简单" :value="1" />
            <el-option label="中等" :value="2" />
            <el-option label="困难" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试分类" prop="examCategory">
          <el-select v-model="settingsForm.examCategory" placeholder="请选择分类" style="width: 100%">
            <el-option label="技能考试" :value="1" />
            <el-option label="安全考试" :value="2" />
            <el-option label="管理考试" :value="3" />
            <el-option label="其他考试" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="settingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateSettings" :loading="settingsLoading">
            保存设置
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.exam-center-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.header-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.header-content p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-stats {
  display: flex;
  gap: 10px;
}

.exam-title .title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.exam-title .description {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.exam-detail {
  max-height: 600px;
  overflow-y: auto;
}

.exam-description {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.exam-questions {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.question-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

:deep(.el-table .cell) {
  padding: 8px 0;
}
</style>

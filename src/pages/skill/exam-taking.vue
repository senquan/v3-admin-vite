<template>
  <div class="exam-taking-container">
    <!-- 考试头部信息 -->
    <div class="exam-header">
      <div class="exam-info">
        <h2>知识测试系统</h2>
        <p>取在日期：{{ formatDate(new Date()) }} 星期{{ getDayOfWeek() }}</p>
      </div>
    </div>

    <!-- 考试导航栏 -->
    <div class="exam-navigation">
      <div class="nav-buttons">
        <el-button
          :disabled="currentQuestionIndex === 0"
          @click="goToPreviousQuestion"
        >
          上一题
        </el-button>
        <el-button
          :disabled="currentQuestionIndex === questions.length - 1"
          @click="goToNextQuestion"
        >
          下一题
        </el-button>
        <el-button
          :disabled="currentQuestionIndex === 0"
          @click="goToFirstQuestion"
        >
          第一题
        </el-button>
        <el-button @click="submitExam" type="danger">
          交卷
        </el-button>
        <el-button @click="showAnswerSheet" type="info">
          答题卡
        </el-button>
      </div>
      <div class="return-button">
        <el-button @click="returnToMain" type="primary">
          返回主页
        </el-button>
      </div>
    </div>

    <!-- 题目内容区域 -->
    <div class="question-content" v-if="currentQuestion">
      <div class="question-header">
        <span class="question-number">题目{{ currentQuestionIndex + 1 }}</span>
        <div class="question-info">
          <span class="correct-answer"></span>
        </div>
      </div>

      <div class="question-text">
        {{ currentQuestion.content }}
      </div>

      <!-- 选择题选项 -->
      <div class="question-options" v-if="isChoiceQuestion">
        <div
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          class="option-item"
          :class="{ 'selected': isOptionSelected(getOptionLabel(index)) }"
          @click="selectOption(getOptionLabel(index))"
        >
          <span class="option-label">{{ getOptionLabel(index) }}</span>
          <span class="option-text">{{ option.option_content || option }}</span>
        </div>
      </div>

      <!-- 判断题选项 -->
      <div class="question-options" v-else-if="currentQuestion.question_type === '判断'">
        <div
          class="option-item"
          :class="{ 'selected': userAnswers[currentQuestionIndex] === '正确' }"
          @click="selectOption('正确')"
        >
          <span class="option-label">A</span>
          <span class="option-text">正确</span>
        </div>
        <div
          class="option-item"
          :class="{ 'selected': userAnswers[currentQuestionIndex] === '错误' }"
          @click="selectOption('错误')"
        >
          <span class="option-label">B</span>
          <span class="option-text">错误</span>
        </div>
      </div>

      <!-- 填空题/简答题 -->
      <div class="question-input" v-else>
        <el-input
          v-model="userAnswers[currentQuestionIndex]"
          type="textarea"
          :rows="4"
          placeholder="请输入您的答案"
        />
      </div>
    </div>

    <!-- 答题卡对话框 -->
    <el-dialog v-model="answerSheetVisible" title="答题卡" width="600px">
      <div class="answer-sheet">
        <div class="sheet-grid">
          <div
            v-for="(question, index) in questions"
            :key="index"
            class="sheet-item"
            :class="{
              'answered': userAnswers[index],
              'current': index === currentQuestionIndex
            }"
            @click="goToQuestion(index)"
          >
            {{ index + 1 }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="answerSheetVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 提交确认对话框 -->
    <el-dialog v-model="submitDialogVisible" title="提交确认" width="400px">
      <p>确定要提交考试吗？提交后将无法修改答案。</p>
      <p>已答题：{{ answeredCount }}/{{ questions.length }}</p>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSubmit">确定提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { getExamDetail } from './apis/exam'
import type { Exam, ExamQuestion } from './apis/exam'

const route = useRoute()
const router = useRouter()

// 考试数据
const exam = ref<Exam | null>(null)
const questions = ref<ExamQuestion[]>([])
const currentQuestionIndex = ref(0)
const userAnswers = ref<string[]>([])

// 对话框状态
const answerSheetVisible = ref(false)
const submitDialogVisible = ref(false)
// 当前题目
const currentQuestion = computed(() => {
  if (questions.value.length === 0) return null
  return questions.value[currentQuestionIndex.value]?.questionEntity
})

// 是否为选择题
const isChoiceQuestion = computed(() => {
  if (!currentQuestion.value) return false
  return ['单选', '多选'].includes(currentQuestion.value.question_type)
})

// 已答题数量
const answeredCount = computed(() => {
  return userAnswers.value.filter(answer => answer && answer.trim()).length
})

// 获取选项标签
function getOptionLabel(index: number): string {
  return String.fromCharCode(65 + index) // A, B, C, D...
}

// 检查选项是否被选中
function isOptionSelected(label: string): boolean {
  const answer = userAnswers.value[currentQuestionIndex.value]
  if (!answer) return false

  if (currentQuestion.value?.question_type === '多选') {
    return answer.split(',').includes(label)
  }
  return answer === label
}

// 选择选项
function selectOption(label: string) {
  const questionType = currentQuestion.value?.question_type

  if (questionType === '多选') {
    // 多选题处理
    let currentAnswers = userAnswers.value[currentQuestionIndex.value]?.split(',').filter(a => a) || []

    if (currentAnswers.includes(label)) {
      currentAnswers = currentAnswers.filter(a => a !== label)
    } else {
      currentAnswers.push(label)
    }

    userAnswers.value[currentQuestionIndex.value] = currentAnswers.sort().join(',')
  } else {
    // 单选题和判断题处理
    userAnswers.value[currentQuestionIndex.value] = label
  }
}

// 导航函数
function goToPreviousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function goToNextQuestion() {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

function goToFirstQuestion() {
  currentQuestionIndex.value = 0
}

function goToQuestion(index: number) {
  currentQuestionIndex.value = index
  answerSheetVisible.value = false
}

// 显示答题卡
function showAnswerSheet() {
  answerSheetVisible.value = true
}

// 提交考试
function submitExam() {
  submitDialogVisible.value = true
}

// 确认提交
function confirmSubmit() {
  submitDialogVisible.value = false

  // 计算得分
  let score = 0
  let correctCount = 0

  questions.value.forEach((question, index) => {
    const userAnswer = userAnswers.value[index]
    const correctAnswer = question.questionEntity?.answer

    if (userAnswer && correctAnswer && userAnswer === correctAnswer) {
      score += question.question_score
      correctCount++
    }
  })

  // 跳转到结果页面
  router.push({
    name: 'ExamResult',
    params: {
      examId: route.params.examId
    },
    query: {
      score: score.toString(),
      correctCount: correctCount.toString(),
      totalQuestions: questions.value.length.toString(),
      answers: JSON.stringify(userAnswers.value)
    }
  })
}

// 返回主页
function returnToMain() {
  ElMessageBox.confirm('确定要返回主页吗？当前答题进度将丢失。', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    router.push('/skill/myexam')
  })
}

// 格式化日期
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// 获取星期
function getDayOfWeek(): string {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[new Date().getDay()]
}

// 加载考试数据
async function loadExamData() {
  try {
    const examId = Number(route.params.examId)
    if (!examId) {
      ElMessage.error('考试ID无效')
      router.push('/skill/myexam')
      return
    }

    const response = await getExamDetail(examId)
    if (response.code === 0) {
      exam.value = response.data.exam
      questions.value = response.data.exam.examQuestions || []

      // 初始化答案数组
      userAnswers.value = new Array(questions.value.length).fill('')

      if (questions.value.length === 0) {
        ElMessage.warning('该考试暂无题目')
        router.push('/skill/myexam')
      }
    } else {
      ElMessage.error(response.message || '加载考试失败')
      router.push('/skill/myexam')
    }
  } catch (error) {
    console.error('加载考试数据失败:', error)
    ElMessage.error('加载考试数据失败')
    router.push('/skill/myexam')
  }
}

onMounted(() => {
  loadExamData()
})
</script>

<style scoped>
.exam-taking-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.exam-header {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.exam-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.exam-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.exam-navigation {
  background: white;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.question-content {
  background: white;
  margin: 20px;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.question-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.correct-answer {
  color: #67c23a;
  font-weight: 500;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 25px;
  color: #333;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.option-item:hover {
  border-color: #4a90e2;
  background: #f0f8ff;
}

.option-item.selected {
  border-color: #4a90e2;
  background: #e6f3ff;
  color: #4a90e2;
}

.option-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  font-weight: 600;
  margin-right: 15px;
  flex-shrink: 0;
}

.option-item.selected .option-label {
  background: #4a90e2;
  color: white;
}

.option-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.question-input {
  margin-top: 20px;
}

.answer-sheet {
  padding: 20px;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 10px;
}

.sheet-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.sheet-item:hover {
  border-color: #4a90e2;
  background: #f0f8ff;
}

.sheet-item.answered {
  background: #67c23a;
  color: white;
  border-color: #67c23a;
}

.sheet-item.current {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

:deep(.el-button) {
  border-radius: 6px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}
</style>

<template>
  <div class="exam-result-container">
    <!-- 结果头部 -->
    <div class="result-header">
      <div class="header-buttons">
        <el-button @click="returnToMain" type="primary">返回主页</el-button>
        <el-button @click="reviewAnswers" type="info">再答一次</el-button>
        <el-button @click="viewAnswers" type="success">查看答案</el-button>
      </div>
    </div>

    <!-- 得分显示 -->
    <div class="score-display">
      <div class="score-card">
        <div class="score-title">本次答题得分</div>
        <div class="score-value" :class="scoreClass">{{ score }}分</div>
        <div class="score-status" :class="statusClass">{{ scoreStatus }}</div>

        <div class="score-details">
          <div class="detail-item">
            <span class="label">本次答题用时</span>
            <span class="value">{{ usedTime }}分钟</span>
          </div>
          <div class="detail-item">
            <span class="label">答题数量</span>
            <span class="value">{{ totalQuestions }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细结果 -->
    <div class="result-details" v-if="showDetails">
      <el-card class="details-card">
        <template #header>
          <div class="card-header">
            <span>答题详情</span>
            <el-button @click="toggleDetails" type="text">{{ showDetails ? '收起' : '展开' }}</el-button>
          </div>
        </template>

        <div class="statistics">
          <div class="stat-item">
            <div class="stat-label">正确题数</div>
            <div class="stat-value correct">{{ correctCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">错误题数</div>
            <div class="stat-value incorrect">{{ incorrectCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">未答题数</div>
            <div class="stat-value unanswered">{{ unansweredCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">正确率</div>
            <div class="stat-value accuracy">{{ accuracyRate }}%</div>
          </div>
        </div>

        <div class="question-list" v-if="questions.length > 0">
          <div class="list-header">
            <h4>题目详情</h4>
          </div>
          <div
            v-for="(question, index) in questions"
            :key="index"
            class="question-item"
            :class="getQuestionResultClass(index)"
          >
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <span class="question-type">{{ getQuestionTypeName(question.questionEntity?.question_type) }}</span>
              <span class="question-score">{{ question.question_score }}分</span>
              <span class="result-icon" :class="getQuestionResultClass(index)">
                <el-icon v-if="isQuestionCorrect(index)"><Check /></el-icon>
                <el-icon v-else-if="userAnswers[index]"><Close /></el-icon>
                <el-icon v-else><Minus /></el-icon>
              </span>
            </div>

            <div class="question-content">
              <div class="question-text">{{ question.questionEntity?.content }}</div>

              <div class="answer-comparison" v-if="question.questionEntity?.options">
                <div class="answer-row">
                  <span class="answer-label">您的答案：</span>
                  <span class="user-answer" :class="{ 'correct': isQuestionCorrect(index), 'incorrect': userAnswers[index] && !isQuestionCorrect(index) }">
                    {{ formatAnswer(userAnswers[index], question.questionEntity?.options) || '未作答' }}
                  </span>
                </div>
                <div class="answer-row">
                  <span class="answer-label">正确答案：</span>
                  <span class="correct-answer">
                    {{ formatAnswer(question.questionEntity?.answer || '', question.questionEntity?.options) }}
                  </span>
                </div>
              </div>

              <div class="answer-comparison" v-else>
                <div class="answer-row">
                  <span class="answer-label">您的答案：</span>
                  <span class="user-answer" :class="{ 'correct': isQuestionCorrect(index), 'incorrect': userAnswers[index] && !isQuestionCorrect(index) }">
                    {{ userAnswers[index] || '未作答' }}
                  </span>
                </div>
                <div class="answer-row">
                  <span class="answer-label">正确答案：</span>
                  <span class="correct-answer">{{ question.questionEntity?.answer }}</span>
                </div>
              </div>

              <div class="question-analysis" v-if="question.questionEntity?.analysis">
                <div class="analysis-label">解析：</div>
                <div class="analysis-content">{{ question.questionEntity.analysis }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Close, Minus } from '@element-plus/icons-vue'
import { getExamDetail } from './apis/exam'
import type { Exam, ExamQuestion } from './apis/exam'

const route = useRoute()
const router = useRouter()

// 考试数据
const exam = ref<Exam | null>(null)
const questions = ref<ExamQuestion[]>([])
const userAnswers = ref<string[]>([])
const score = ref(0)
const correctCount = ref(0)
const totalQuestions = ref(0)
const usedTime = ref(0)
const showDetails = ref(true)

// 计算属性
const incorrectCount = computed(() => {
  return totalQuestions.value - correctCount.value - unansweredCount.value
})

const unansweredCount = computed(() => {
  return userAnswers.value.filter(answer => !answer || !answer.trim()).length
})

const accuracyRate = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

const scoreClass = computed(() => {
  if (score.value >= (exam.value?.pass_score || 60)) {
    return 'pass'
  }
  return 'fail'
})

const statusClass = computed(() => {
  return scoreClass.value
})

const scoreStatus = computed(() => {
  if (score.value >= (exam.value?.pass_score || 60)) {
    return '合格'
  }
  return '不合格'
})

// 获取题目类型名称
function getQuestionTypeName(type?: string): string {
  const typeMap: Record<string, string> = {
    'single_choice': '单选',
    'multiple_choice': '多选',
    'true_false': '判断',
    'fill_blank': '填空',
    'short_answer': '简答'
  }
  return typeMap[type || ''] || '未知'
}

// 检查题目是否正确
function isQuestionCorrect(index: number): boolean {
  const userAnswer = userAnswers.value[index]
  const correctAnswer = questions.value[index]?.questionEntity?.answer

  if (!userAnswer || !correctAnswer) return false

  // 对于多选题，需要比较排序后的答案
  if (questions.value[index]?.questionEntity?.question_type === 'multiple_choice') {
    const userSorted = userAnswer.split(',').sort().join(',')
    const correctSorted = correctAnswer.split(',').sort().join(',')
    return userSorted === correctSorted
  }

  return userAnswer === correctAnswer
}

// 获取题目结果样式类
function getQuestionResultClass(index: number): string {
  if (isQuestionCorrect(index)) return 'correct'
  if (userAnswers.value[index]) return 'incorrect'
  return 'unanswered'
}

// 格式化答案显示
function formatAnswer(answer: string, options?: any[]): string {
  if (!answer) return ''

  if (!options) return answer

  // 如果是选择题，将字母答案转换为具体内容
  const letters = answer.split(',').map(a => a.trim())
  const contents = letters.map(letter => {
    const index = letter.charCodeAt(0) - 65 // A=0, B=1, C=2...
    if (index >= 0 && index < options.length) {
      const option = options[index]
      return `${letter}. ${option.content || option}`
    }
    return letter
  })

  return contents.join('; ')
}

// 切换详情显示
function toggleDetails() {
  showDetails.value = !showDetails.value
}

// 返回主页
function returnToMain() {
  router.push('/skill')
}

// 再答一次
function reviewAnswers() {
  router.push({
    name: 'ExamTaking',
    params: {
      examId: route.params.examId
    }
  })
}

// 查看答案
function viewAnswers() {
  showDetails.value = true
  // 滚动到详情区域
  setTimeout(() => {
    const detailsElement = document.querySelector('.result-details')
    if (detailsElement) {
      detailsElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

// 加载考试数据和结果
async function loadExamResult() {
  try {
    // 从路由参数获取结果数据
    score.value = Number(route.query.score) || 0
    correctCount.value = Number(route.query.correctCount) || 0
    totalQuestions.value = Number(route.query.totalQuestions) || 0

    if (route.query.answers) {
      try {
        userAnswers.value = JSON.parse(route.query.answers as string)
      } catch (e) {
        console.error('解析用户答案失败:', e)
        userAnswers.value = []
      }
    }

    // 加载考试详情
    const examId = Number(route.params.examId)
    if (examId) {
      const response = await getExamDetail(examId)
      if (response.code === 200) {
        exam.value = response.data.exam
        questions.value = response.data.exam.examQuestions || []
      }
    }

    // 模拟用时（实际应该从考试开始时间计算）
    usedTime.value = Math.floor(Math.random() * 30) + 10

  } catch (error) {
    console.error('加载考试结果失败:', error)
    ElMessage.error('加载考试结果失败')
  }
}

onMounted(() => {
  loadExamResult()
})
</script>

<style scoped>
.exam-result-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.score-display {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.score-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 400px;
}

.score-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.score-value {
  font-size: 72px;
  font-weight: bold;
  margin-bottom: 15px;
}

.score-value.pass {
  color: #67c23a;
}

.score-value.fail {
  color: #f56c6c;
}

.score-status {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
}

.score-status.pass {
  color: #67c23a;
}

.score-status.fail {
  color: #f56c6c;
}

.score-details {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.detail-item .label {
  font-size: 14px;
  color: #666;
}

.detail-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.result-details {
  max-width: 1000px;
  margin: 0 auto;
}

.details-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.correct {
  color: #67c23a;
}

.stat-value.incorrect {
  color: #f56c6c;
}

.stat-value.unanswered {
  color: #909399;
}

.stat-value.accuracy {
  color: #409eff;
}

.question-list {
  margin-top: 20px;
}

.list-header {
  margin-bottom: 20px;
}

.question-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.question-item.correct {
  border-color: #67c23a;
  background: #f0f9ff;
}

.question-item.incorrect {
  border-color: #f56c6c;
  background: #fef0f0;
}

.question-item.unanswered {
  border-color: #909399;
  background: #f5f5f5;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.question-number {
  font-weight: 600;
  color: #333;
}

.question-type {
  font-size: 12px;
  padding: 2px 8px;
  background: #e0e0e0;
  border-radius: 4px;
  color: #666;
}

.question-score {
  font-size: 12px;
  color: #666;
}

.result-icon {
  margin-left: auto;
  font-size: 18px;
}

.result-icon.correct {
  color: #67c23a;
}

.result-icon.incorrect {
  color: #f56c6c;
}

.result-icon.unanswered {
  color: #909399;
}

.question-content {
  padding: 20px;
}

.question-text {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 15px;
  color: #333;
}

.answer-comparison {
  margin-bottom: 15px;
}

.answer-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 10px;
}

.answer-label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
  flex-shrink: 0;
}

.user-answer.correct {
  color: #67c23a;
  font-weight: 600;
}

.user-answer.incorrect {
  color: #f56c6c;
  font-weight: 600;
}

.correct-answer {
  color: #67c23a;
  font-weight: 600;
}

.question-analysis {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.analysis-label {
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.analysis-content {
  color: #666;
  line-height: 1.6;
}

:deep(.el-button) {
  border-radius: 6px;
}

:deep(.el-card__header) {
  background: #fafafa;
}
</style>

<script setup lang="ts">
import type { Exam, ExamQuestion } from "./apis/exam"
import { Check, Close, Minus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { useRoute, useRouter } from "vue-router"
import { getExamResult } from "./apis/exam"

const route = useRoute()
const router = useRouter()

// 考试数据
const exam = ref<Exam | null>(null)
const examRecord = ref<any>(null)
const questions = ref<any[]>([])
const statistics = ref<any>({})
const showDetails = ref(true)
const showTypeStats = ref(false)

// 计算属性
const scoreClass = computed(() => {
  if (statistics.value.isPassed) {
    return "pass"
  }
  return "fail"
})

const statusClass = computed(() => {
  return scoreClass.value
})

const scoreStatus = computed(() => {
  if (statistics.value.isPassed) {
    return "合格"
  }
  return "不合格"
})

const accuracyRate = computed(() => {
  if (statistics.value.totalQuestions === 0) return 0
  return Math.round((statistics.value.correctCount / statistics.value.totalQuestions) * 100)
})

const usedTime = computed(() => {
  if (examRecord.value?.used_time) {
    return Math.round(examRecord.value.used_time / 60) // 转换为分钟
  }
  return 0
})

// 获取题目类型名称
function getQuestionTypeName(type?: string): string {
  const typeMap: Record<string, string> = {
    single_choice: "单选",
    multiple_choice: "多选",
    true_false: "判断",
    fill_blank: "填空",
    short_answer: "简答"
  }
  return typeMap[type || ""] || "未知"
}

// 检查题目是否正确
function isQuestionCorrect(question: any): boolean {
  return question.isCorrect === true
}

// 获取题目结果样式类
function getQuestionResultClass(question: any): string {
  if (question.isCorrect === true) return "correct"
  if (question.isCorrect === false) return "incorrect"
  return "unanswered"
}

// 格式化答案显示
function formatAnswer(answer: string, options?: any[]): string {
  if (!answer) return ""

  if (!options) return answer

  // 如果是选择题，将字母答案转换为具体内容
  const letters = answer.split(",").map(a => a.trim())
  const contents = letters.map((letter) => {
    const index = letter.charCodeAt(0) - 65 // A=0, B=1, C=2...
    if (index >= 0 && index < options.length) {
      const option = options[index]
      return `${letter}. ${option.content || option}`
    }
    return letter
  })

  return contents.join("; ")
}

// 切换详情显示
function toggleDetails() {
  showDetails.value = !showDetails.value
}

// 返回主页
function returnToMain() {
  router.push("/skill")
}

// 再答一次
// function reviewAnswers() {
//   router.push({
//     name: "ExamTaking",
//     params: {
//       examId: route.params.examId
//     }
//   })
// }

// // 查看答案
// function viewAnswers() {
//   showDetails.value = true
//   // 滚动到详情区域
//   setTimeout(() => {
//     const detailsElement = document.querySelector(".result-details")
//     if (detailsElement) {
//       detailsElement.scrollIntoView({ behavior: "smooth" })
//     }
//   }, 100)
// }

// 加载考试数据和结果
async function loadExamResult() {
  try {
    const examId = Number(route.params.examId)
    if (!examId) {
      ElMessage.error("考试ID无效")
      return
    }

    // 从接口获取考试结果
    const response = await getExamResult(examId)
    if (response.code === 0) {
      // 设置考试信息
      exam.value = response.data.exam
      examRecord.value = response.data.examRecord
      questions.value = response.data.questions || []
      statistics.value = response.data.statistics || {}

      console.log("考试结果数据:", response.data)
    } else {
      ElMessage.error(response.message || "获取考试结果失败")
    }
  } catch (error) {
    console.error("加载考试结果失败:", error)
    ElMessage.error("加载考试结果失败")
  }
}

onMounted(() => {
  loadExamResult()
})
</script>

<template>
  <div class="exam-result-container">
    <!-- 结果头部 -->
    <div class="result-header">
      <div class="header-buttons">
        <el-button @click="returnToMain" type="primary">返回主页</el-button>
        <!-- <el-button @click="reviewAnswers" type="info">再答一次</el-button>
        <el-button @click="viewAnswers" type="success">查看答案</el-button> -->
      </div>
    </div>

    <!-- 得分显示 -->
    <div class="score-display">
      <div class="score-card">
        <div class="score-title">本次答题得分</div>
        <div class="score-value" :class="scoreClass">{{ statistics.score || 0 }}分</div>
        <div class="score-status" :class="statusClass">{{ scoreStatus }}</div>

        <div class="score-details">
          <div class="detail-item">
            <span class="label">本次答题用时</span>
            <span class="value">{{ usedTime }}分钟</span>
          </div>
          <div class="detail-item">
            <span class="label">答题数量</span>
            <span class="value">{{ statistics.totalQuestions || 0 }}</span>
          </div>
          <div class="detail-item">
            <span class="label">满分</span>
            <span class="value">{{ statistics.maxScore || 0 }}分</span>
          </div>
          <div class="detail-item">
            <span class="label">及格分</span>
            <span class="value">{{ statistics.passScore || 60 }}分</span>
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
            <el-button @click="toggleDetails" type="text">{{ showDetails ? "收起" : "展开" }}</el-button>
          </div>
        </template>

        <div class="statistics">
          <div class="stat-item">
            <div class="stat-label">正确题数</div>
            <div class="stat-value correct">{{ statistics.correctCount || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">错误题数</div>
            <div class="stat-value incorrect">{{ statistics.incorrectCount || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">未答题数</div>
            <div class="stat-value unanswered">{{ statistics.pendingCount || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">正确率</div>
            <div class="stat-value accuracy">{{ accuracyRate }}%</div>
          </div>
        </div>

        <!-- 题目类型统计 -->
        <div v-if="showTypeStats && statistics.typeStats" class="type-stats">
          <div class="stats-title">题目类型统计</div>
          <div class="type-stats-grid">
            <div v-for="(stat, type) in statistics.typeStats" :key="type" class="type-stat-item">
              <div class="type-name">{{ getQuestionTypeName(type.toString()) }}</div>
              <div class="type-details">
                <span class="type-correct">答对: {{ stat.correct }}</span>
                <span class="type-total">总数: {{ stat.total }}</span>
                <span class="type-rate">正确率: {{ stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0 }}%</span>
              </div>
            </div>
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
            :class="getQuestionResultClass(question)"
          >
            <div class="question-header">
              <span class="question-number">第{{ index + 1 }}题</span>
              <span class="question-type">{{ getQuestionTypeName(question.question_type) }}</span>
              <span class="question-score">{{ question.score }}分</span>
              <span class="result-icon" :class="getQuestionResultClass(question)">
                <el-icon v-if="isQuestionCorrect(question)"><Check /></el-icon>
                <el-icon v-else-if="question.userAnswer"><Close /></el-icon>
                <el-icon v-else><Minus /></el-icon>
              </span>
            </div>

            <div class="question-content">
              <div class="question-text">{{ question.question_text }}</div>

              <div class="answer-comparison" v-if="question.options">
                <div class="answer-row">
                  <span class="answer-label">您的答案：</span>
                  <span class="user-answer" :class="{ correct: isQuestionCorrect(question), incorrect: question.userAnswer && !isQuestionCorrect(question) }">
                    {{ formatAnswer(question.userAnswer) || "未作答" }}
                  </span>
                </div>
                <div class="answer-row">
                  <span class="answer-label">正确答案：</span>
                  <span class="correct-answer">
                    {{ formatAnswer(question.answer || "", question.options) }}
                  </span>
                </div>
              </div>

              <div class="answer-comparison" v-else>
                <div class="answer-row">
                  <span class="answer-label">您的答案：</span>
                  <span class="user-answer" :class="{ correct: isQuestionCorrect(question), incorrect: question.userAnswer && !isQuestionCorrect(question) }">
                    {{ question.userAnswer || "未作答" }}
                  </span>
                </div>
                <div class="answer-row">
                  <span class="answer-label">正确答案：</span>
                  <span class="correct-answer">{{ question.answer }}</span>
                </div>
              </div>

              <div class="question-analysis" v-if="question.explanation">
                <div class="analysis-label">解析：</div>
                <div class="analysis-content">{{ question.explanation }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

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

/* 题目类型统计样式 */
.type-stats {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.type-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.type-stat-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #4a90e2;
}

.type-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.type-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.type-correct {
  color: #28a745;
}

.type-total {
  color: #6c757d;
}

.type-rate {
  color: #007bff;
  font-weight: 500;
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

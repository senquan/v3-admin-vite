<script setup lang="ts">
// @ts-expect-error - Ignore type checking for html2pdf.js module
import html2pdf from "html2pdf.js"
import { getExamDetailByRecord, getUserPaper, publishExam } from "../../skill/apis/exam"

const emit = defineEmits(["regenerate"])

const loading = ref(false)
const visible = ref(false)

const examPreviewData = ref<any>(null)
const examQuestions = ref<any>([])
const examAnswers = ref<any>([])
const currentExamId = ref(0)
const userId = ref(0)
const myScore = ref(0)

function open(options = {
  id: 0 as number,
  userId: 0 as number
}) {
  loading.value = true
  try {
    userId.value = options.userId
    getExamDetailByRecord(options.id, options.userId).then((response) => {
      if (response.code === 0) {
        examPreviewData.value = response.data.exam
        examQuestions.value = response.data.exam.examQuestions || []
        currentExamId.value = response.data.exam._id || 0

        if (currentExamId.value > 0 && options.userId > 0) {
          getUserPaper(currentExamId.value, options.userId).then((response) => {
            if (response.code === 0) {
              examAnswers.value = response.data.examAnswers || []
              for (let i = 0; i < examQuestions.value.length; i++) {
                const userAnswer = examAnswers.value.find((answer: any) => answer.question_id === examQuestions.value[i].question_id)
                if (userAnswer) {
                  examQuestions.value[i].userAnswer = userAnswer
                }
              }
              myScore.value = response.data.examRecord.score
            }
          })
        }
      } else {
        ElMessage.error(response.message || "获取试卷详情失败")
      }
    })
  } catch (error) {
    console.error("获取试卷详情失败:", error)
    ElMessage.error("获取试卷详情失败")
  } finally {
    loading.value = false
  }
  visible.value = true
}

function handlePublishExam() {
  publishExam(examPreviewData.value._id).then((res) => {
    if (res.code === 0) {
      ElMessage({
        type: "success",
        message: "发布试卷成功"
      })
      examPreviewData.value.status = true
    }
  }).catch((error) => {
    console.error("发布试卷失败:", error)
    ElMessage.error("发布试卷失败")
  })
}

function handleRegenerate() {
  visible.value = false
  emit("regenerate", currentExamId.value)
}

// 获取题目类型显示名称
function getQuestionTypeName(type: string) {
  const typeMap: Record<string, string> = {
    单选: "单选题",
    多选: "多选题",
    判断: "判断题",
    填空: "填空题",
    简答: "简答题"
  }
  return typeMap[type] || type
}

async function handleDownloadExam() {
  if (!examPreviewData.value) {
    ElMessage.warning("没有试卷数据可供下载")
    return
  }

  // 创建一个新的HTML元素，用于生成PDF
  const element = document.createElement("div")
  element.className = "exam-pdf-container"

  // 添加试卷标题和基本信息
  let content = `
    <div class="exam-pdf-header">
      <h1>${examPreviewData.value.title}</h1>
      <div class="exam-pdf-info">
        <p>总分：${examPreviewData.value.total_score}分</p>
        <p>及格分：${examPreviewData.value.pass_score}分</p>
        <p>考试时长：${examPreviewData.value.duration}分钟</p>
        <p>题目数量：${examQuestions.value.length}题</p>
      </div>
    </div>
  `

  // 添加试题内容
  content += "<div class='exam-pdf-questions'>"
  examQuestions.value.forEach((question: any, index: number) => {
    content += `
      <div class="question-pdf-item">
        <div class="question-pdf-header">
          <span class="question-pdf-number">${index + 1}</span>
          <span class="question-pdf-type">${getQuestionTypeName(question.questionEntity.question_type)}</span>
          <span class="question-pdf-score">${question.question_score}分</span>
        </div>
        <div class="question-pdf-content">${question.questionEntity.content}</div>
    `

    // 添加选项（如果有）
    if (question.questionEntity.options && question.questionEntity.options.length > 0) {
      content += "<div class='question-pdf-options'>"
      question.questionEntity.options
        .sort((a: any, b: any) => a.option_label.localeCompare(b.option_label))
        .forEach((option: any) => {
          content += `
            <div class="option-pdf-item">
              <span class="option-pdf-label">${option.option_label}</span>
              <span class="option-pdf-content">${option.option_content}</span>
            </div>
          `
        })
      content += "</div>"
    }

    content += "</div>"
  })
  content += "</div>"

  // 将内容添加到元素中
  element.innerHTML = content
  document.body.appendChild(element)

  // 添加PDF样式
  const style = document.createElement("style")
  style.textContent = `
    .exam-pdf-container {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    .exam-pdf-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }
    .exam-pdf-header h1 {
      margin-bottom: 15px;
    }
    .exam-pdf-info {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
    }
    .exam-pdf-info p {
      margin: 5px 10px;
    }
    .exam-pdf-questions {
      padding: 10px 0;
    }
    .question-pdf-item {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 5px;
    }
    .question-pdf-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .question-pdf-number {
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      background-color: #409eff;
      color: white;
      border-radius: 50%;
      margin-right: 10px;
    }
    .question-pdf-type {
      background-color: #f0f9eb;
      color: #67c23a;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 10px;
    }
    .question-pdf-score {
      color: #f56c6c;
      font-weight: bold;
    }
    .question-pdf-content {
      margin-bottom: 15px;
      line-height: 1.6;
    }
    .question-pdf-options {
      padding-left: 20px;
    }
    .option-pdf-item {
      margin-bottom: 10px;
      display: flex;
    }
    .option-pdf-label {
      width: 30px;
      flex-shrink: 0;
    }
  `
  document.head.appendChild(style)

  // 配置PDF选项
  const opt = {
    margin: 10,
    filename: `${examPreviewData.value.title}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }

  try {
    // 生成PDF并下载
    await html2pdf().from(element).set(opt).save()
    ElMessage.success("试卷下载成功")
  } catch (error) {
    console.error("PDF生成失败:", error)
    ElMessage.error("PDF生成失败")
  } finally {
    // 清理临时元素
    document.body.removeChild(element)
    document.head.removeChild(style)
  }
}

function getMyAnswer(question: any) {
  if (question.userAnswer.user_answer === "" || question.userAnswer.user_answer === null) {
    return "未作答"
  } else {
    return question.questionEntity.question_type === "判断" ? (question.userAnswer.user_answer ? "正确" : "错误") : question.userAnswer.user_answer
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="试卷预览"
    width="80%"
    :destroy-on-close="true"
    :close-on-click-modal="false"
    top="10vh"
  >
    <div v-loading="loading" class="exam-preview-container">
      <template v-if="examPreviewData">
        <div class="exam-header">
          <h2>{{ examPreviewData.title }}</h2>
          <div class="exam-info">
            <div class="info-item">
              <span class="label">总分：</span>
              <span class="value">{{ examPreviewData.total_score }}分</span>
            </div>
            <div class="info-item">
              <span class="label">及格分：</span>
              <span class="value">{{ examPreviewData.pass_score }}分</span>
            </div>
            <div class="info-item">
              <span class="label">考试时长：</span>
              <span class="value">{{ examPreviewData.duration }}分钟</span>
            </div>
            <div class="info-item">
              <span class="label">题目数量：</span>
              <span class="value">{{ examQuestions.length }}题</span>
            </div>
            <div class="info-item">
              <el-button v-if="examPreviewData.status === false && userId === 0" type="primary" @click="handleRegenerate">重新生成</el-button>
              <el-button v-if="examPreviewData.status === false && userId === 0" type="success" @click="handlePublishExam">发布试卷</el-button>
              <el-button v-else type="success" @click="handleDownloadExam">下载试卷</el-button>
            </div>
          </div>
        </div>

        <el-scrollbar height="calc(80vh - 200px)">
          <div class="exam-questions">
            <div
              v-for="(question, index) in examQuestions"
              :key="question._id"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">{{ index + 1 }}</span>
                <span class="question-type">{{ getQuestionTypeName(question.questionEntity.question_type) }}</span>
                <span class="question-score">{{ question.question_score }}分</span>
              </div>
              <div class="question-content" v-html="question.questionEntity.content" />

              <!-- 选项区域 -->
              <div class="question-options" v-if="question.questionEntity.options && question.questionEntity.options.length > 0">
                <div
                  v-for="option in question.questionEntity.options.sort((a: any, b: any) => a.option_label.localeCompare(b.option_label))"
                  :key="option._id"
                  class="option-item"
                >
                  <span class="option-label">{{ option.option_label }}</span>
                  <span class="option-content">{{ option.option_content }}</span>
                </div>
              </div>

              <!-- 答案区域 -->
              <div class="question-answer" v-if="userId > 0 && question.userAnswer">
                <span class="answer-label">我的答案：</span>
                <span class="answer-content">{{ getMyAnswer(question) }}</span>
                <span class="answer-correct-answer">参考答案：{{ question.questionEntity.answer }}</span>
                <span class="answer-is-correct">是否正确：<b :color="question.userAnswer.is_correct ? 'green' : 'red'">{{ question.userAnswer.is_correct ? '正确' : '错误' }}</b></span>
                <span class="answer-score">本题得分：{{ question.userAnswer.score }}</span>
              </div>
            </div>
          </div>

          <div class="exam-score" v-if="userId > 0">
            <span class="total-score">阅卷得分：{{ myScore }}</span>
          </div>
        </el-scrollbar>
      </template>
      <el-empty v-else description="暂无试卷数据" :image-size="100" />
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>
.exam-preview-container {
  padding: 0 20px;
}

.exam-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.exam-header h2 {
  text-align: center;
  margin-bottom: 15px;
}

.exam-info {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.info-item {
  margin: 5px 10px;
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: bold;
  margin-right: 5px;
}

.exam-questions {
  padding: 10px 0;
}

.question-item {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 5px;
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.question-number {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  margin-right: 10px;
}

.question-type {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}

.question-score {
  color: #f56c6c;
  font-weight: bold;
}

.question-content {
  margin-bottom: 15px;
  line-height: 1.6;
}

.question-options {
  padding-left: 20px;
}

.option-item {
  margin-bottom: 10px;
  display: flex;
}

.option-label {
  width: 30px;
  flex-shrink: 0;
}

.question-answer {
  display: flex;
  margin-top: 15px;
}

.question-answer span {
  margin-right: 15px;
}

.exam-score {
  text-align: center;
  font-size: 28px;
  margin-top: 15px;
  margin-bottom: 20px;
}
</style>

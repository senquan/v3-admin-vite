<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { getCascaderOptions } from "@/common/utils/helper"
// @ts-expect-error - Ignore type checking for html2pdf.js module
import html2pdf from "html2pdf.js"
import { fetchCategoryListOpt } from "../../setting/apis"
import { generateExam, getExamDetailByRecord, publishExam, regenerateExam } from "../../skill/apis/exam"
import DetailForm from "./_detail.vue"
import { fetchList as fetchListByBranch, fetchListGroup } from "./apis"

const loading = ref(false)
const listQuery = reactive({
  keyword: "",
  page: 1,
  pageSize: 20
})
const tableData = ref<any>([])
const totalRecord = ref(0)
const totalPages = computed(() => Math.ceil(totalRecord.value / listQuery.pageSize))
const recordDrawer = ref(false)
const recordData = ref<any>([])
const categories = reactive([
  { label: "制度学习", value: 1 },
  { label: "会议传达", value: 2 },
  { label: "安全技术培训", value: 3 },
  { label: "三级教育", value: 4 }
])
const branchName = ref("")
const recordFormRef = ref<any>([])
const recordFormVisibility = ref(false)

const categoryOptions = ref<number[]>([])
const examCategories = ref<any>([])
const generationLoading = ref(false)
const examSettingsDialogVisible = ref(false)
const currentExamId = ref(0)
const examSettingsForm = reactive({
  totalScore: 100,
  passScore: 60,
  questionCount: 50,
  level: 2,
  duration: 120,
  categories: [] as number[]
})
const examSettingsFormRef = ref()
const examSettingsRules = {
  totalScore: [{ required: true, message: "请输入总分", trigger: "blur" }],
  level: [{ required: true, message: "请选择难度级别", trigger: "change" }],
  categories: [{ required: true, message: "请选择考试分类", trigger: "change" }]
}
const isRegenerateExam = ref(false)
const currentRecordId = ref(0)

function fetchList() {
  loading.value = true
  fetchListGroup(listQuery).then((res) => {
    loading.value = false
    totalRecord.value = res.data.total
    tableData.value = res.data.records
  })
}

function handleFilter() {
  fetchList()
}

function handleDetail(id: number, name: string) {
  recordDrawer.value = true
  branchName.value = name
  currentRecordId.value = id
  loadDetail(id)
}

function loadDetail(id: number) {
  fetchListByBranch({ branch: id }).then((res: any) => {
    if (res.data && res.data.records) {
      recordData.value = res.data.records
    } else {
      recordData.value = []
    }
  })
}

function handleRecordDetail(data: any) {
  openDetail(data.row)
}

function openDetail(row: any) {
  recordFormRef.value?.open({
    data: row
  })
  recordFormVisibility.value = true
}

function handleCreateExam(id: number) {
  examSettingsDialogVisible.value = true
  currentExamId.value = id
  isRegenerateExam.value = false
}

// 添加响应式变量
const previewDialogVisible = ref(false)
const examPreviewData = ref<any>(null)
const examQuestions = ref<any>([])

function handleCategoryChange(value: number[]) {
  if (!value || value.length === 0) return
  examSettingsForm.categories = value.map((item: any) => Number(item[item.length - 1]))
}

function handleCategoryClear() {
  categoryOptions.value = []
  examSettingsForm.categories = []
}

function handlePublish(id: number) {
  console.log(`课件发布${id}`)
}

function handleRegenerateExam() {
  previewDialogVisible.value = false
  isRegenerateExam.value = true
  examSettingsDialogVisible.value = true
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

async function handlePreviewExam(id: number) {
  previewDialogVisible.value = true
  loading.value = true
  try {
    const response = await getExamDetailByRecord(id)
    if (response.code === 0) {
      examPreviewData.value = response.data.exam
      examQuestions.value = response.data.exam.examQuestions || []
      currentExamId.value = response.data.exam._id || 0
    } else {
      ElMessage.error(response.message || "获取试卷详情失败")
    }
  } catch (error) {
    console.error("获取试卷详情失败:", error)
    ElMessage.error("获取试卷详情失败")
  } finally {
    loading.value = false
  }
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

// 生成试卷
async function handleGenerateExam() {
  ElMessageBox.confirm(
    "确定要生成试卷吗？",
    "生成试卷",
    {
      confirmButtonText: "是的",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await examSettingsFormRef.value.validate()

      generationLoading.value = true
      const request = isRegenerateExam.value
        ? regenerateExam(currentExamId.value, examSettingsForm)
        : generateExam({ recordId: currentRecordId.value, settings: examSettingsForm })
      request.then((res) => {
        if (res.code === 0) {
          ElMessage({
            type: "success",
            message: "生成试卷成功"
          })
          resetExamSettingsForm()
          loadDetail(currentRecordId.value)
        }
      }).catch((error) => {
        console.error("生成考卷失败:", error)
        ElMessage.error("生成考卷失败")
      }).finally(() => {
        generationLoading.value = false
      })
    } finally {
      examSettingsDialogVisible.value = false
    }
  }).catch(() => {})
}

function resetExamSettingsForm() {
  examSettingsForm.totalScore = 100
  examSettingsForm.passScore = 60
  examSettingsForm.questionCount = 50
  examSettingsForm.level = 2
  examSettingsForm.duration = 120
  handleCategoryClear()
}

function loadExamCategories() {
  if (examCategories.value.length > 0) return
  fetchCategoryListOpt(1).then((res) => {
    const categoryOptData: Array<any> = []
    if (res.data) {
      for (const item of res.data.categories) {
        const parent = item.parentId || 0
        if (categoryOptData[parent] === undefined) {
          categoryOptData[parent] = []
        }
        categoryOptData[parent].push(item)
      }
      examCategories.value = getCascaderOptions(categoryOptData, 0, 0, 3)
    }
  })
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

onMounted(() => {
  handleFilter()
  loadExamCategories()
})
</script>

<template>
  <div class="main-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="关键字" class="filter-item" style="width: 200px;" @keyup.enter="handleFilter" />
      <el-button type="primary" @click="handleFilter">搜索</el-button>
    </div>
    <div class="grid-grouping">
      <vxe-table :data="tableData">
        <vxe-column field="name" title="培训层级" min-width="300" />
        <vxe-column field="total" title="培训计划数" width="150" align="center" />
        <vxe-column field="finished" title="已完成数" width="150" align="center" />
        <vxe-column field="incomplete" title="未完成数" width="150" align="center" />
        <vxe-column field="planned" title="计划参培人数" width="150" align="center" />
        <vxe-column field="actual" title="实际参培人数" width="150" align="center" />
        <vxe-column field="actions" title="操作" width="180">
          <template #default="data">
            <el-button type="primary" @click="handleDetail(data.row.id, data.row.name)">培训记录</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-if="totalPages > 1"
        v-model:current-page="listQuery.page"
        v-model:page-size="listQuery.pageSize"
        :total="totalRecord"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 18, 36]"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-drawer v-model="recordDrawer" :title="`${branchName}培训记录`" size="58%" direction="rtl">
      <vxe-table
        :data="recordData"
      >
        <vxe-column title="培训计划名称" min-width="180" align="left">
          <template #default="data">
            <el-text>{{ data.row.name }}</el-text>
          </template>
        </vxe-column>
        <vxe-column title="培训时间" width="150" align="center">
          <template #default="data">
            <el-text truncated>{{ formatDateTime(data.row.actual_time) }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="trainer" title="教培人员" width="80" />
        <vxe-column title="培训分类" width="120">
          <template #default="data">
            <el-text>{{ categories.find((item) => item.value === data.row.training_category)?.label }}</el-text>
          </template>
        </vxe-column>
        <vxe-column field="actual_participants" title="实际参培人数" width="110" />
        <vxe-column field="passed" title="合格人数" width="80" />
        <vxe-column title="操作" width="300">
          <template #default="data">
            <el-button type="success" @click="handleRecordDetail(data)">详情</el-button>
            <el-button v-if="data.row.assessment_method === 1 && data.row.exam_status === 0" type="primary" @click="handleCreateExam(data.row.id)">试卷生成</el-button>
            <el-button v-if="data.row.assessment_method === 1 && data.row.exam_status === 1" type="success" @click="handlePreviewExam(data.row.id)">试卷预览</el-button>
            <el-button type="primary" @click="handlePublish(data.row.id)">课件发布</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </el-drawer>

    <DetailForm
      ref="recordFormRef"
      @refresh="loadDetail(currentRecordId)"
      @close="recordFormVisibility = false"
    />

    <!-- 编辑设置对话框 -->
    <el-dialog v-model="examSettingsDialogVisible" title="编辑考卷设置" width="600px">
      <el-form :model="examSettingsForm" :rules="examSettingsRules" ref="examSettingsFormRef" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="考卷分类" prop="categories">
              <el-cascader
                v-model="categoryOptions"
                multiple
                placeholder="选择考题分类"
                filterable
                clearable
                :options="examCategories"
                :props="{ expandTrigger: 'hover', multiple: true, checkStrictly: true }"
                :debounce="500"
                @change="(value: any) => handleCategoryChange(value as number[])"
                @clear="handleCategoryClear"
                class="filter-item"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="难度级别" prop="level">
              <el-select v-model="examSettingsForm.level" placeholder="请选择难度" style="width: 100%">
                <el-option label="很简单" :value="1" />
                <el-option label="简单" :value="2" />
                <el-option label="中等" :value="3" />
                <el-option label="困难" :value="4" />
                <el-option label="很困难" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="总分" prop="totalScore">
              <el-input-number v-model="examSettingsForm.totalScore" :min="1" :max="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合格分" prop="passScore">
              <el-input-number v-model="examSettingsForm.passScore" :min="1" :max="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="题量" prop="questionCount">
              <el-input-number v-model="examSettingsForm.questionCount" :min="1" :max="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试时长" prop="duration">
              <el-input-number v-model="examSettingsForm.duration" :min="1" :max="360" style="width: 80%" />&nbsp;分钟
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="examSettingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGenerateExam" :loading="generationLoading">
            生成试卷
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 试卷预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
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
                <el-button v-if="examPreviewData.status === false" type="primary" @click="handleRegenerateExam">重新生成</el-button>
                <el-button v-if="examPreviewData.status === false" type="success" @click="handlePublishExam">发布试卷</el-button>
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
              </div>
            </div>
          </el-scrollbar>
        </template>
        <el-empty v-else description="暂无试卷数据" :image-size="100" />
      </div>
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
.fr {
  float: right;
}
.pagination-container {
  padding: 10px;
  background: #fff;
}
.color-block {
  display: inline-block;
  width: 60px;
  height: 20px;
  border-radius: 10%;
  vertical-align: middle;
}
/* 试卷预览样式 */
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

.loading-more,
.no-more {
  text-align: center;
  padding: 10px 0;
  color: #909399;
  font-size: 14px;
}
</style>

<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { getCascaderOptions } from "@/common/utils/helper"
import { fetchCategoryListOpt } from "../../setting/apis"
import { generateExam, getExamSettingsByRecord, regenerateExam } from "../../skill/apis/exam"
import DetailForm from "./_detail.vue"
import ExamPreview from "./_preview.vue"
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
  { label: "三级教育", value: 4 },
  { label: "专业技能", value: 5 },
  { label: "管理培训", value: 6 },
  { label: "知识竞赛", value: 7 }
])
const questionTypes = reactive([
  { label: "全部", value: "" },
  { label: "单选题", value: "单选" },
  { label: "多选题", value: "多选" },
  { label: "判断题", value: "判断" },
  { label: "填空题", value: "填空" },
  { label: "简答题", value: "简答" }
])
const examCheckList = ref<string[]>(["ar", "sq"])
const branchName = ref("")
const recordFormRef = ref<any>([])
const examPreviewRef = ref<any>([])
const examCategories = ref<any>([])
const generationLoading = ref(false)
const examSettingsDialogVisible = ref(false)
const currentExamId = ref(0)
const examSettingsForm = reactive({
  totalScore: 100,
  passScore: 60,
  questionCount: 50,
  questionCountDetail: [] as string[],
  difficulty: 2,
  duration: 120,
  dynamicGeneration: false,
  allowRetry: true,
  shuffleQuestion: true,
  categories: [] as number[]
})
const examSettingsFormRef = ref()
const examSettingsRules = {
  totalScore: [{ required: true, message: "请输入总分", trigger: "blur" }],
  difficulty: [{ required: true, message: "请选择难度级别", trigger: "change" }],
  categories: [{ required: true, message: "请选择考试分类", trigger: "change" }]
}
const isRegenerateExam = ref(false)
const currentRecordId = ref(0)
const currentBranchId = ref(0)
const currentCount = ref(50)
const currentQuestionType = ref("")
const questionTypesAmounts = reactive<any>({})

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
  currentBranchId.value = id
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
}

function handleCreateExam(id: number) {
  loadSettings(id)
  currentRecordId.value = id
  isRegenerateExam.value = false
}

function handleCategoryChange(value: number[]) {
  if (!value || value.length === 0) return
  examSettingsForm.categories = value.map((item: any) => Number(item[item.length - 1]))
}

// function handlePublish(id: number) {
//   console.log(`课件发布${id}`)
// }

async function handlePreviewExam(id: number) {
  resetExamSettingsForm()
  if (id > 0) examPreviewRef.value?.open({ id })
}

// 生成试卷
async function handleGenerateExam() {
  ElMessageBox.confirm(
    `确定要保存设置${examCheckList.value.includes("dq") ? "" : "并生成试卷"}吗？`,
    "保存设置",
    {
      confirmButtonText: "是的",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      if (Object.keys(questionTypesAmounts).length > 0) {
        examSettingsForm.questionCountDetail = []
        for (const key in questionTypesAmounts) {
          examSettingsForm.questionCountDetail.push(`${key}:${questionTypesAmounts[key]}`)
        }
      }
      await examSettingsFormRef.value.validate()
      examSettingsForm.dynamicGeneration = examCheckList.value.includes("dq")
      examSettingsForm.allowRetry = examCheckList.value.includes("ar")
      examSettingsForm.shuffleQuestion = examCheckList.value.includes("sq")

      generationLoading.value = true
      const request = isRegenerateExam.value
        ? regenerateExam(currentExamId.value, examSettingsForm)
        : generateExam({ recordId: currentRecordId.value, settings: examSettingsForm })
      request.then((res) => {
        if (res.code === 0) {
          ElMessage({
            type: "success",
            message: "保存设置成功"
          })
          resetExamSettingsForm()
          loadDetail(currentBranchId.value)
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
  }).catch((error) => {
    console.error("生成考卷失败:", error)
  })
}

function resetExamSettingsForm() {
  examSettingsForm.totalScore = 100
  examSettingsForm.passScore = 60
  examSettingsForm.questionCount = 50
  examSettingsForm.questionCountDetail = []
  examSettingsForm.difficulty = 2
  examSettingsForm.dynamicGeneration = false
  examSettingsForm.allowRetry = true
  examSettingsForm.shuffleQuestion = true

  examSettingsForm.duration = 120
  examCheckList.value = ["ar", "sq"]
  // 清空题目类型数量
  questionTypesAmounts.value = {}
  const keys = Object.keys(questionTypesAmounts)
  keys.forEach((key: string) => {
    delete questionTypesAmounts[key]
  })
  handleCategoryClear()
}

function handleCategoryClear() {
  examSettingsForm.categories = []
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

async function loadSettings(id: number) {
  try {
    const response = await getExamSettingsByRecord(id)
    if (response.code === 0) {
      if (response.data.settings && response.data.settings.categories) {
        examSettingsForm.totalScore = response.data.settings.total_score
        examSettingsForm.passScore = response.data.settings.pass_score
        examSettingsForm.questionCount = response.data.settings.question_count
        examSettingsForm.questionCountDetail = response.data.settings.question_count_detail
        examSettingsForm.difficulty = response.data.settings.difficulty
        examSettingsForm.dynamicGeneration = response.data.settings.dynamic_generation
        examSettingsForm.allowRetry = response.data.settings.allow_retry
        examSettingsForm.shuffleQuestion = response.data.settings.shuffle_question
        examSettingsForm.duration = response.data.settings.duration
        examSettingsForm.categories = response.data.settings.categories

        if (examSettingsForm.dynamicGeneration) {
          examCheckList.value.push("dq")
        }
        if (examSettingsForm.allowRetry) {
          examCheckList.value.push("ar")
        }
        if (examSettingsForm.shuffleQuestion) {
          examCheckList.value.push("sq")
        }
        if (examSettingsForm.questionCountDetail.length > 0) {
          for (const item of examSettingsForm.questionCountDetail) {
            const [type, count] = item.split(":")
            questionTypesAmounts[type] = Number(count)
          }
          if (Object.keys(questionTypesAmounts).length > 0) {
            examCheckList.value.push("qc")
          }
        }
      }
      examSettingsDialogVisible.value = true
    }
  } catch (error) {
    console.error("获取试卷设置失败:", error)
    ElMessage.error("获取试卷设置失败")
  }
}

function handleTypeAmount() {
  if (currentQuestionType.value === "") {
    examSettingsForm.questionCount = currentCount.value
    return
  }

  questionTypesAmounts[currentQuestionType.value] = currentCount.value
  examSettingsForm.questionCount = sumArray(questionTypesAmounts)
}

function handleQuestionAmountRemove(type: any) {
  delete questionTypesAmounts[type]
  examSettingsForm.questionCount = sumArray(questionTypesAmounts)
}

function handleRegenerateExam(id: number) {
  currentExamId.value = id
  isRegenerateExam.value = true
  examSettingsDialogVisible.value = true
}

function sumArray(arr: any[]) {
  return Number(Object.values(arr).reduce((acc, cur) => Number(acc) + Number(cur), 0))
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
        <vxe-column title="操作" width="200">
          <template #default="data">
            <el-button type="primary" @click="handleRecordDetail(data)">详情</el-button>
            <el-button v-if="data.row.assessment_method === 1 && (data.row.exam_status === 0 || data.row.exam_dynamic === true)" type="primary" @click="handleCreateExam(data.row.id)">试卷设置</el-button>
            <el-button v-if="data.row.assessment_method === 1 && data.row.exam_dynamic !== true && data.row.exam_status === 1" type="success" @click="handlePreviewExam(data.row.id)">试卷预览</el-button>
            <!-- <el-button type="primary" @click="handlePublish(data.row.id)">课件发布</el-button> -->
          </template>
        </vxe-column>
      </vxe-table>
    </el-drawer>

    <DetailForm
      ref="recordFormRef"
      @refresh="loadDetail(currentRecordId)"
    />

    <!-- 编辑设置对话框 -->
    <el-dialog v-model="examSettingsDialogVisible" title="编辑考卷设置" width="600px">
      <el-form :model="examSettingsForm" :rules="examSettingsRules" ref="examSettingsFormRef" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="考卷分类" prop="categories">
              <el-cascader
                v-model="examSettingsForm.categories"
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
            <el-form-item label="难度级别" prop="difficulty">
              <el-select v-model="examSettingsForm.difficulty" placeholder="请选择难度" style="width: 100%">
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
            <el-form-item label="考试时长" prop="duration">
              <el-input-number v-model="examSettingsForm.duration" :min="1" :max="360" style="width: 80%" />&nbsp;分钟
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总题量" prop="questionCount">
              <el-input v-model="examSettingsForm.questionCount" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="考试选项">
              <el-checkbox-group v-model="examCheckList">
                <el-checkbox label="指定题型题量" value="qc" />
                <el-checkbox label="动态出题" value="dq" />
                <el-checkbox label="允许重考" value="ar" />
                <el-checkbox label="打乱题目" value="sq" />
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="examCheckList.includes('qc')">
          <el-col :span="24">
            <el-form-item label="题量设置">
              <el-select v-model="currentQuestionType" placeholder="全部" style="width: 20%">
                <el-option v-for="item in questionTypes" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-form-item label="题量" prop="currentCount">
                <el-input-number v-model="currentCount" :min="1" :max="500" style="width: 150px; margin-right: 20px;" />
              </el-form-item>
              <el-button type="primary" @click="handleTypeAmount">添加</el-button>
            </el-form-item>
          </el-col>
          <el-tag
            v-for="(value, key) in questionTypesAmounts"
            :key="key"
            status="primary"
            size="large"
            closable
            @close="handleQuestionAmountRemove(key)"
            class="question-amount-items"
          >
            {{ key }}：{{ value }}
          </el-tag>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="examSettingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGenerateExam" :loading="generationLoading">
            保存设置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 试卷预览对话框 -->
    <ExamPreview ref="examPreviewRef" @regenerate="handleRegenerateExam" />
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

.question-amount-items {
  width: 50%;
  margin-left: 100px;
  margin-bottom: 10px;
  justify-content: space-between;
}
</style>

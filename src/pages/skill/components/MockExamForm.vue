<script lang="ts" setup>
import type { ExamSettings, GenerateExamParams } from "../apis/exam"
import { generateMockExam } from "../apis/study"

const emit = defineEmits(["success", "close"])

const dialogVisible = ref(false)
const loading = ref(false)
const categoryOptions = ref<number[]>([])
const examCategories = ref<any>([])
const examSettings = reactive<Partial<ExamSettings>>({
  totalScore: 100,
  difficulty: 2,
  knowledgeCoverage: 80,
  fairnessIndex: 5,
  questionCount: 20,
  questionTypes: [],
  categories: [] as number[],
  passScore: 60,
  duration: 60
})
const formData = reactive<GenerateExamParams>({
  recordId: 0,
  title: "",
  description: "",
  examType: 2
})

const rules = {
  categories: [
    {
      required: true,
      message: "请选择考卷分类",
      trigger: "change",
      validator: (rule: any, value: any, callback: any) => {
        if (!categoryOptions.value || categoryOptions.value.length === 0) {
          callback(new Error("请选择考卷分类"))
        } else {
          callback()
        }
      }
    }
  ]
}

const formRef = ref<any>(null)

const difficultyOptions = [
  { label: "简单", value: 1 },
  { label: "中等", value: 2 },
  { label: "困难", value: 3 }
]

const questionTypeOptions = [
  { label: "单选题", value: "单选" },
  { label: "多选题", value: "多选" },
  { label: "判断题", value: "判断" },
  { label: "填空题", value: "填空" },
  { label: "简答题", value: "简答" }
]

function open(options: any) {
  formData.recordId = options.planId
  formData.title = options.planTitle
  dialogVisible.value = true
  examCategories.value = options.categories
  resetForm()
}

function resetForm() {
  Object.assign(formData, {
    recordId: formData.recordId,
    settings: {
      totalScore: 100,
      examCategory: 1,
      level: 2,
      coverage: 80,
      difficulty: 5,
      fairness: 5,
      questionCount: 20,
      questionTypes: ["single_choice", "multiple_choice"],
      categories: [] as number[],
      duration: 60
    }
  })
  formRef.value?.clearValidate()
}

function handleCategoryClear() {
  categoryOptions.value = []
  if (formData.settings) formData.settings.categories = []
}

function handleCategoryChange(value: number[]) {
  if (!value || value.length === 0) return
  examSettings.categories = value.map((item: any) => Number(item[item.length - 1]))
}

function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      loading.value = true
      formData.settings = examSettings
      const res = await generateMockExam(formData)
      if (res.code === 0) {
        emit("success")
        handleClose()
      }
    } catch (error) {
      console.error("生成试卷失败:", error)
      ElMessage.error("生成试卷失败")
    } finally {
      loading.value = false
    }
  })
}

function handleClose() {
  dialogVisible.value = false
  emit("close")
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="生成模拟试卷"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
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
        <el-col :span="12">
          <el-form-item label="题目数量" prop="questionCount">
            <el-input-number
              v-model="examSettings.questionCount"
              :min="5"
              :max="100"
              placeholder="请输入题目数量"
              style="width: 130px"
            />
            <span style="margin-left: 8px;">题</span>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="考试时长" prop="duration">
            <el-input-number
              v-model="examSettings.duration"
              :min="10"
              :max="300"
              placeholder="请输入考试时长"
              style="width: 130px"
            />
            <span style="margin-left: 8px;">分钟</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="总分" prop="totalScore">
            <el-input-number v-model="examSettings.totalScore" :min="1" :max="1000" style="width: 90%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合格分" prop="passScore">
            <el-input-number v-model="examSettings.passScore" :min="1" :max="1000" style="width: 90%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="难度等级" prop="difficulty">
            <el-select v-model="examSettings.difficulty" placeholder="请选择难度等级" style="width: 30%">
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

      <el-row>
        <el-col :span="24">
          <el-form-item label="题目类型" prop="questionTypes">
            <el-checkbox-group v-model="examSettings.questionTypes">
              <el-checkbox
                v-for="item in questionTypeOptions"
                :key="item.value"
                :label="item.value"
              >
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-alert
        title="提示"
        type="info"
        :closable="false"
        style="margin-top: 20px"
      >
        <p>• 建议选择多种题型以全面检验学习效果</p>
        <p>• 考试时长建议根据题目数量合理设置</p>
      </el-alert>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          生成试卷
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  text-align: right;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.el-checkbox {
  margin-right: 0;
}
</style>

<script lang="ts" setup>
import { request } from "@/http/axios"
import { reportScore } from "../../skill/apis/exam"
import { loadParticipants } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  name: "",
  training_category: 0,
  training_mode: 0,
  trainer: "",
  hours: 0
})

const categoryOptions = ref([
  { label: "制度学习", value: 1 },
  { label: "会议传达", value: 2 },
  { label: "安全技术培训", value: 3 },
  { label: "三级教育", value: 4 }
])
const visible = ref(false)
const recordData = ref<any>([])
const scoreReportDialogVisible = ref(false)
const fileList = ref([])
const scoreFormRef = ref()
const scoreForm = reactive({
  exam_record_id: 0,
  paper_path: [] as { name: string, url: string }[],
  score: 0
})
const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.name = ""
  formData.training_category = 0
  formData.training_mode = 0
  formData.trainer = ""
  formData.hours = 0
}

function open(options = {
  data: {} as any
}) {
  resetForm()
  formData.name = options.data?.name
  formData.training_category = options.data?.training_category
  formData.training_mode = options.data?.training_mode
  formData.trainer = options.data?.trainer
  formData.hours = options.data?.training_hours

  loadParticipants(options.data?.id).then((res) => {
    if (res.code === 0) {
      recordData.value = res.data
    } else {
      ElMessage.error(res.message)
      recordData.value = []
    }
  })
  visible.value = true
}

function close() {
  visible.value = false
  emit("close")
}

function resetScoreForm() {
  fileList.value = []
  scoreForm.score = 0
}

function handleReport(row: any) {
  scoreForm.exam_record_id = row.examRecordId
  resetScoreForm()
  scoreReportDialogVisible.value = true
}

function handleSubmit() {
  scoreFormRef.value.validate((valid: any) => {
    if (!valid) return
    btnSubmit.loading = true
    scoreForm.paper_path = fileList.value.map((item: any) => {
      return {
        name: item.name,
        url: item.response.data.url
      }
    }).filter((item: any) => item.url !== "")
    reportScore(scoreForm).then((response) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: "成绩成功上报！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || "创建培训记录失败",
          type: "error",
          offset: 0
        })
      }
    }).catch(() => {
      ElMessage({
        message: "系统错误，请稍后重试",
        type: "error",
        offset: 0
      })
    }).finally(() => {
      btnSubmit.loading = false
      scoreReportDialogVisible.value = false
    })
  })
}

function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append("file", file)
  return request({
    url: "upload/file",
    method: "POST",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        onProgress({ percent })
      }
    }
  }).then((response: any) => {
    onSuccess(response)
    return response
  }).catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

function getTrainingCategory(value: number) {
  return categoryOptions.value.find(item => item.value === value)?.label || "其他"
}

function handleExamView(row: any) {
  if (row.paperUrl) {
    const paper = JSON.parse(row.paperUrl)
    if (paper && paper.length > 0) {
      window.open(paper[0].url)
    }
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="培训结果"
    width="60%"
    :before-close="close"
  >
    <el-descriptions
      class="margin"
      :column="3"
      border
    >
      <el-descriptions-item width="150px" :span="3">
        <template #label>
          <div class="cell-item">
            培训名称
          </div>
        </template>
        {{ formData.name }}
      </el-descriptions-item>
      <el-descriptions-item width="150px">
        <template #label>
          <div class="cell-item">
            培训模式
          </div>
        </template>
        {{ formData.training_mode === 1 ? "内部培训" : "外部培训" }}
      </el-descriptions-item>
      <el-descriptions-item width="150px">
        <template #label>
          <div class="cell-item">
            培训分类
          </div>
        </template>
        {{ getTrainingCategory(formData.training_category) }}
      </el-descriptions-item>
      <el-descriptions-item width="150px">
        <template #label>
          <div class="cell-item">
            教培人员
          </div>
        </template>
        {{ formData.trainer }}
      </el-descriptions-item>
    </el-descriptions>
    <el-table :data="recordData" style="margin-top: 20px;">
      <el-table-column property="id" label="序号" width="60" align="center" />
      <el-table-column property="name" label="姓名" width="120" align="center" />
      <el-table-column property="gender" label="性别" width="60" align="center">
        <template #default="scope">
          {{ scope.row.gender === true ? "男" : (scope.row.gender === false ? "女" : "未知") }}
        </template>
      </el-table-column>
      <el-table-column property="age" label="年龄" width="60" align="center" />
      <el-table-column property="organization" label="所属单位" min-width="120" />
      <el-table-column property="idcard" label="身份证号码" width="120" align="center" />
      <el-table-column label="学时" width="60">
        <template #default>
          {{ formData.hours }}
        </template>
      </el-table-column>
      <el-table-column property="passed" label="是否合格" width="80" align="center">
        <template #default="scope">
          {{ scope.row.passed ? "合格" : "不合格" }}
        </template>
      </el-table-column>
      <el-table-column property="score" label="成绩" width="60" />
      <el-table-column label="操作" width="180" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleReport(scope.row)">成绩上报</el-button>
          <el-button v-if="scope.row.score" type="primary" size="small" @click="handleExamView(scope.row)">考卷查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <!-- 成绩上报对话框 -->
  <el-dialog v-model="scoreReportDialogVisible" title="编辑考卷设置" width="600px">
    <el-form :model="scoreForm" ref="scoreFormRef" label-width="120px">
      <el-row>
        <el-col :span="24">
          <el-form-item label="线下考卷" prop="categories">
            <el-upload
              v-model:file-list="fileList"
              class="uploader"
              :http-request="customUploadRequest"
              style="width: 380px; margin-top: 20px;"
            >
              <el-button type="primary">上传考卷</el-button>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="成绩" prop="score">
            <el-input v-model="scoreForm.score" style="width: 50%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="scoreReportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          提交成绩
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
.cell-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

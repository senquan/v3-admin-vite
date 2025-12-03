<script lang="ts" setup>
import { request } from "@/http/axios"
import { formatDate, getTimeDiff } from "@/utils/date"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import { reportScore } from "../../skill/apis/exam"
import ExamPreview from "./_preview.vue"
import { generateQRCode, loadParticipants } from "./apis"

const emit = defineEmits(["success", "close", "refresh"])

const formData = reactive({
  name: "",
  qr_code_path: "",
  training_category: 0,
  training_mode: 0,
  trainer: "",
  actual_time: "",
  hours: 0,
  exam_dynamic: false
})

const categoryOptions = ref([
  { label: "制度学习", value: 1 },
  { label: "会议传达", value: 2 },
  { label: "安全技术培训", value: 3 },
  { label: "三级教育", value: 4 },
  { label: "专业技能", value: 5 },
  { label: "管理培训", value: 6 },
  { label: "知识竞赛", value: 7 }
])
const visible = ref(false)
const recordData = ref<any>([])
const scoreReportDialogVisible = ref(false)
const fileList = ref([])
const examPreviewRef = ref<any>([])
const scoreFormRef = ref()
const scoreForm = reactive({
  exam_record_id: 0,
  paper_path: [] as { name: string, url: string }[],
  score: 0
})
const btnSubmit = reactive({
  loading: false
})
const qrCordPath = computed(() => {
  return formData.qr_code_path ? formData.qr_code_path : "/uploads/qrcode/default.jpg"
})
const recordId = ref(0)

function resetForm() {
  formData.name = ""
  formData.training_category = 0
  formData.training_mode = 0
  formData.trainer = ""
  formData.hours = 0
  formData.exam_dynamic = false
}

function open(options = {
  data: {} as any
}) {
  resetForm()
  recordId.value = options.data?.id
  formData.name = options.data?.name
  formData.training_category = options.data?.training_category
  formData.training_mode = options.data?.training_mode
  formData.trainer = options.data?.trainer
  formData.hours = options.data?.training_hours
  formData.actual_time = options.data?.actual_time
  formData.qr_code_path = options.data?.qr_code_path
  formData.exam_dynamic = options.data?.exam_dynamic

  loadParticipants(options.data?.id).then((res) => {
    if (res.code === 0) {
      recordData.value = res.data.participants
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
  } else if (formData.exam_dynamic) {
    // 动态考卷
    examPreviewRef.value?.open({ id: recordId.value, userId: row.userId })
  }
}

function handleRegenerate() {
  generateQRCode(recordId.value).then((res) => {
    if (res.code === 0) {
      formData.qr_code_path = res.data
      emit("refresh")
      ElMessage.success("二维码重新生成成功")
    } else {
      ElMessage.error(res.message)
    }
  })
}

async function exportData() {
  try {
    // 获取所有数据（不分页）
    const res = await loadParticipants(recordId.value)

    if (res.data) {
      // 准备导出数据
      const exportData = res.data.participants.map((item: any) => {
        return {
          编号: item.id || "",
          姓名: item.name || "",
          年龄: item.age || "",
          单位: item.organization || "",
          身份证号码: item.idcard || "",
          学时: item.hours || "",
          是否合格: item.passed ? "合格" : "不合格",
          分数: item.score || "",
          考试开始时间: item.examStartTime || "",
          考试结束时间: item.examEndTime || "",
          总用时: getTimeDiff(item.examStartTime, item.examEndTime)
        }
      })

      // 创建工作簿和工作表
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "培训人员详情")

      // 设置列宽
      const colWidth = [
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 }
      ]
      worksheet["!cols"] = colWidth

      // 生成Excel文件并下载
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      // 生成文件名（包含当前日期）
      const now = new Date()
      const fileName = `培训人员详情${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}.xlsx`

      FileSaver.saveAs(blob, fileName)
      ElMessage.success("导出成功")
    } else {
      ElMessage.warning("没有数据可导出")
    }
  } catch (error) {
    console.error("导出失败:", error)
    ElMessage.error("导出失败，请稍后重试")
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
      <el-descriptions-item width="150px" :span="2">
        <template #label>
          <div class="cell-item">
            培训名称
          </div>
        </template>
        {{ formData.name }}
      </el-descriptions-item>
      <el-descriptions-item width="150px" :rowspan="3" align="center">
        <template #label>
          <div class="cell-item">
            小程序二维码
          </div>
        </template>
        <el-image
          :src="qrCordPath"
          :preview-src-list="[qrCordPath]"
          alt="小程序二维码"
          style="width: 100px; height: 100px;"
          fit="contain"
        />
        <el-button
          type="default"
          size="small"
          @click="handleRegenerate"
        >
          重新生成
        </el-button>
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
      <el-descriptions-item>
        <template #label>
          <div class="cell-item">
            开始时间
          </div>
        </template>
        {{ formatDate(formData.actual_time) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-button type="success" @click="exportData" style="margin: 8px 0;">导出Excel</el-button>
    <el-table :data="recordData" height="450">
      <el-table-column property="id" label="序号" width="60" align="center" />
      <el-table-column property="name" label="姓名" width="120" align="center" />
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
          {{ scope.row.score === null ? "未考试" : (scope.row.passed ? "合格" : "不合格") }}
        </template>
      </el-table-column>
      <el-table-column property="score" label="成绩" width="80" />
      <el-table-column label="操作" width="220" align="center">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleReport(scope.row)">成绩上报</el-button>
          <el-button v-if="scope.row.score && (scope.row.paperUrl || formData.exam_dynamic)" type="primary" size="small" @click="handleExamView(scope.row)">考卷查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <!-- 成绩上报对话框 -->
  <el-dialog v-model="scoreReportDialogVisible" title="编辑考卷设置" width="600px">
    <el-form :model="scoreForm" ref="scoreFormRef" label-width="120px">
      <el-row>
        <el-col :span="24">
          <el-form-item label="线下考卷" prop="categories" style="align-items: center;">
            <el-upload
              v-model:file-list="fileList"
              class="uploader"
              :http-request="customUploadRequest"
              style="width: 380px; margin-top: 10px;"
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

  <!-- 试卷预览对话框 -->
  <ExamPreview ref="examPreviewRef" />
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

<script lang="ts" setup>
import { createPlan, fetchPlan, updatePlan } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  training_scope: [],
  trainer: "",
  training_mode: 0,
  training_category: 0,
  planned_participants: 0,
  planned_time: "",
  training_hours: 0,
  assessment_method: 0,
  exam_method: 0
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const scopeOptions = ref<any>([])

const rules = {
  name: [{ required: true, message: "请输入培训计划名称", trigger: "blur" }],
  training_scope: [{ required: true, message: "请选择培训范围", trigger: "blur" }],
  training_mode: [{ required: true, message: "请选择培训模式", trigger: "blur" }],
  training_category: [{ required: true, message: "请选择培训类别", trigger: "blur" }],
  planned_participants: [{ required: true, min: 1, message: "培训人数不能为 0", trigger: "blur" }],
  planned_time: [{ required: true, message: "请选择培训预计时间", trigger: "blur" }],
  training_hours: [{ required: true, min: 1, message: "培训学时不能为 0", trigger: "blur" }],
  assessment_method: [{ required: true, message: "请选择考核方式", trigger: "blur" }],
  trainer: [{ required: true, message: "请输入教培人员", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.id = 0
  formData.name = ""
  formData.training_scope = []
  formData.trainer = ""
  formData.training_mode = 0
  formData.training_category = 0
  formData.planned_participants = 0
  formData.planned_time = ""
  formData.training_hours = 0
  formData.assessment_method = 0
}

function open(options = {
  scopes: [],
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0

  scopeOptions.value = options.scopes

  if (isEdit.value) {
    isEdit.value = true
    fetchPlan(options.id).then((response) => {
      if (response.code === 0) {
        const data = response.data
        Object.keys(data).forEach((key) => {
          if (key in formData) {
            if (key in data && key in formData) {
              (formData[key as keyof typeof formData] as any) = data[key as keyof typeof data]
            }
          }
        })
      } else {
        ElMessage({
          message: response.message || "获取培训计划详情失败",
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
    })
  } else {
    isEdit.value = false
    resetForm()
    resetOptions()
  }
}

function close() {
  visible.value = false
  emit("close")
}

function resetOptions() {
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return
    btnSubmit.loading = true
    const request = isEdit.value
      ? updatePlan(formData.id, formData)
      : createPlan(formData)

    request.then((response) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? "培训计划已成功更新！" : "培训计划已成功创建！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? "更新培训计划失败" : "创建培训计划失败"),
          type: "error",
          offset: 0
        })
      }
    }).catch((error) => {
      btnSubmit.loading = false
      console.log(error)
      ElMessage({
        message: "系统错误，请稍后重试",
        type: "error",
        offset: 0
      })
    })
  })
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑培训计划' : '新增培训计划'"
    width="680px"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="24">
          <el-form-item label="计划名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入培训计划名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="培训范围" prop="training_scope">
            <el-tree-select
              v-model="formData.training_scope"
              :data="scopeOptions"
              multiple
              :render-after-expand="false"
              show-checkbox
              check-strictly
              check-on-click-node
              style="width: 240px"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="教培人员" prop="trainer">
            <el-input v-model="formData.trainer" placeholder="请输入教培人员" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="培训模式" prop="training_mode">
            <el-select v-model="formData.training_mode" placeholder="请选择培训模式" :empty-values="[0]" :value-on-clear="0">
              <el-option :key="1" label="内部培训" :value="1" />
              <el-option :key="2" label="外部培训" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="培训分类" prop="training_category">
            <el-select v-model="formData.training_category" placeholder="请选择培训分类" :empty-values="[0]" :value-on-clear="0">
              <el-option :key="1" label="制度学习" :value="1" />
              <el-option :key="2" label="会议传达" :value="2" />
              <el-option :key="3" label="安全技术培训" :value="3" />
              <el-option :key="4" label="三级教育" :value="4" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="培训人数" prop="planned_participants">
            <el-input v-model="formData.planned_participants" placeholder="请输入培训人数" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="预计时间" prop="planned_time">
            <el-date-picker v-model="formData.planned_time" type="datetime" placeholder="选择培训预计时间" class="filter-item" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="培训学时" prop="training_hours">
            <el-input type="number" v-model="formData.training_hours" placeholder="请输入培训学时" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="考核方式" prop="assessment_method">
            <el-select v-model="formData.assessment_method" placeholder="请选择考核方式" :empty-values="[0]" :value-on-clear="0">
              <el-option :key="1" label="考试" :value="1" />
              <el-option :key="2" label="学习记录" :value="2" />
              <el-option :key="3" label="检查" :value="3" />
              <el-option :key="4" label="抽查" :value="4" />
              <el-option :key="5" label="不考核" :value="5" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="handleSubmit">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
.image-uploader .image-previews {
  width: 80px;
  height: 80px;
  display: block;
}
:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}
:deep(.el-upload-list--picture-card) {
  --el-upload-list-picture-card-size: 80px;
}
:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: cover;
}
</style>

<style>
.image-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.image-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}
</style>

<script lang="ts" setup>
import { fetchList as fetchTrainer } from "../trainer/apis"
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
  planned_end_time: "",
  training_hours: 0,
  assessment_method: 0,
  exam_method: 0,
  objectives: "",
  description: ""
})

const newObjective = ref("")
const objectiveItems = ref([] as string[])

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const scopeOptions = ref<any>([])
const trainerOptions = ref<any>([])
const searchLoading = ref(false)

const rules = {
  name: [{ required: true, message: "请输入培训计划名称", trigger: "blur" }],
  training_scope: [{ required: true, message: "请选择培训范围", trigger: "blur" }],
  training_mode: [{ required: true, message: "请选择培训模式", trigger: "blur" }],
  training_category: [{ required: true, message: "请选择培训类别", trigger: "blur" }],
  planned_participants: [{ required: true, type: "number" as const, min: 1, message: "培训人数不能为 0", trigger: "blur" }],
  planned_time: [{ required: true, message: "请选择培训预计时间", trigger: "blur" }],
  training_hours: [{ required: true, message: "培训学时不能为空", trigger: "blur" }],
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
  formData.planned_end_time = ""
  formData.training_hours = 0
  formData.assessment_method = 0
  formData.objectives = ""
  formData.description = ""
  objectiveItems.value = []
  newObjective.value = ""
  trainerOptions.value = []
}

function open(options = {
  scopes: [],
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0

  resetForm()
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
        if (data.objectives) {
          objectiveItems.value = data.objectives.split(",,").filter((item: string) => item.trim())
        }
        if (data.trainer) {
          formData.trainer = String(data.trainer.id)
          trainerOptions.value = [{
            value: String(data.trainer.id),
            label: data.trainer.name
          }]
        }
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
    resetOptions()
  }
}

function addObjective() {
  if (newObjective.value.trim()) {
    objectiveItems.value.push(newObjective.value.trim())
    newObjective.value = ""
  }
}

function removeObjective(index: number) {
  objectiveItems.value.splice(index, 1)
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
    formData.objectives = objectiveItems.value.join(",,")

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

function handleSearchTrainer(query: string) {
  if (trainerOptions.value.length > 0 && (!query || query.trim().length < 1)) return
  searchLoading.value = true
  fetchTrainer({ keyword: query }).then((response: any) => {
    if (response.code === 0 && response.data.trainers && response.data.trainers.length > 0) {
      trainerOptions.value = response.data.trainers.map((trainer: any) => ({
        value: trainer.id,
        label: trainer.name
      }))
      searchLoading.value = false
    } else {
      ElMessage.error(`获取用户列表失败: ${response.message}`)
    }
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
    :close-on-click-modal="false"
    :close-on-press-escape="false"
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
            <el-select
              v-model="formData.trainer"
              filterable
              remote
              placeholder="请输入关键词搜索"
              :remote-method="handleSearchTrainer"
              :loading="searchLoading"
            >
              <el-option
                v-for="item in trainerOptions"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </el-select>
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
              <el-option :key="5" label="专业技能" :value="5" />
              <el-option :key="6" label="管理培训" :value="6" />
              <el-option :key="7" label="知识竞赛" :value="7" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="培训人数" prop="planned_participants">
            <el-input-number v-model="formData.planned_participants" placeholder="请输入培训人数" :min="1" :max="9999" controls-position="right" style="width: 50%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="planned_time">
            <el-date-picker v-model="formData.planned_time" type="datetime" placeholder="选择培训预计开始时间" class="filter-item" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="planned_end_time">
            <el-date-picker v-model="formData.planned_end_time" type="datetime" placeholder="选择培训预计结束时间" class="filter-item" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
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
        <el-col :span="12">
          <el-form-item label="培训学时" prop="training_hours">
            <el-input type="number" v-model="formData.training_hours" placeholder="请输入培训学时" style="width: 50%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="培训详情" prop="description">
            <el-input
              type="textarea"
              v-model="formData.description"
              placeholder="请输入培训详情"
              :rows="3"
              maxlength="800"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="培训目标" prop="objectives">
            <div class="objective-container">
              <!-- 已添加的目标列表 -->
              <div v-if="objectiveItems.length > 0" class="objective-list">
                <div v-for="(item, index) in objectiveItems" :key="index" class="objective-item">
                  <span class="objective-text">{{ item }}</span>
                  <el-button type="danger" size="small" circle @click="removeObjective(index)">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              <!-- 输入新目标 -->
              <div class="objective-input">
                <el-input
                  v-model="newObjective"
                  type="text"
                  placeholder="请输入培训目标"
                  @keyup.enter="addObjective"
                />
                <div class="add-objective" @click="addObjective">
                  <el-icon><CirclePlus /></el-icon>
                </div>
              </div>
            </div>
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

.objective-container {
  width: 60%;
  display: flex;
  flex-direction: column;
}

.objective-list {
  margin-bottom: 10px;
}

.objective-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.objective-text {
  padding-right: 10px;
  flex: 1;
  color: #606266;
}

.objective-input {
  display: flex;
  align-items: center;
}

.add-objective {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  margin-left: 10px;
  transition: background-color 0.3s;
}

.add-objective:hover {
  background-color: #f5f7fa;
}

.add-objective .el-icon {
  font-size: 26px;
  color: #409eff;
}
</style>

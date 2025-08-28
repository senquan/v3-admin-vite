<script lang="ts" setup>
import type { StudyPlanCreateData } from "../apis/study"
import { createStudyPlan, getStudyPlanDetail, updateStudyPlan } from "../apis/study"
import { fetchList as fetchCoursewares } from "./../../knowledge/courseware/apis"

const emit = defineEmits(["success", "close"])

const dialogVisible = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const currentId = ref(0)

const formData = reactive<StudyPlanCreateData>({
  title: "",
  description: "",
  category: 1,
  level: 1,
  study_hours: 0,
  target_score: 60,
  coursewares: []
})

const rules = {
  title: [{ required: true, message: "请输入计划名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择学习类别", trigger: "change" }],
  level: [{ required: true, message: "请选择难度等级", trigger: "change" }],
  study_hours: [
    { required: true, message: "请输入学习时长", trigger: "blur" }
  ],
  target_score: [{ required: true, message: "请输入目标分数", trigger: "blur" }]
}

const formRef = ref<any>(null)
const searchLoading = ref(false)
const coursewareOptions = ref<any>([])

const categoryOptions = [
  { label: "制度学习", value: 1 },
  { label: "会议传达", value: 2 },
  { label: "安全技术培训", value: 3 },
  { label: "三级教育", value: 4 },
  { label: "专业技能", value: 5 },
  { label: "管理培训", value: 6 }
]

const levelOptions = [
  { label: "初级", value: 1 },
  { label: "中级", value: 2 },
  { label: "高级", value: 3 },
  { label: "专家级", value: 4 }
]

function open(options: { id?: number }) {
  currentId.value = options.id || 0
  isEdit.value = currentId.value > 0
  dialogVisible.value = true

  if (isEdit.value) {
    loadPlanDetail()
  } else {
    resetForm()
  }
}

function resetForm() {
  Object.assign(formData, {
    title: "",
    description: "",
    category: 1,
    level: 1,
    study_hours: 0,
    target_score: 60,
    coursewares: []
  })
  coursewareOptions.value = []
  formRef.value?.clearValidate()
}

async function loadPlanDetail() {
  try {
    loading.value = true
    const res = await getStudyPlanDetail(currentId.value)
    if (res.data) {
      const plan = res.data
      Object.assign(formData, {
        title: plan.title || "",
        description: plan.description || "",
        category: plan.category || 1,
        level: plan.level || 1,
        study_hours: Number(plan.study_hours) || 0,
        target_score: plan.target_score || 60,
        coursewares: plan.coursewares.map((item: any) => item.courseware_id) || []
      })
      coursewareOptions.value = plan.coursewares
        ? plan.coursewares.map((item: any) => ({
            title: item.courseware?.title || "",
            id: item.courseware?._id || 0
          }))
        : []

      console.log("coursewares", plan.coursewares)
    }
  } catch (error) {
    console.error("加载计划详情失败:", error)
    ElMessage.error("加载计划详情失败")
  } finally {
    loading.value = false
  }
}

function handleSearchCoursewares(value: string) {
  if (value === "" && coursewareOptions.value.length > 0) return
  searchLoading.value = true
  fetchCoursewares({ keyword: value, status: 1 }).then((response) => {
    if (response.code === 0) {
      coursewareOptions.value = response.data.coursewares
      searchLoading.value = false
    } else {
      ElMessage.error(`获取课件列表失败: ${response.message}`)
    }
  })
}

function handleSubmit() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    if (formData.coursewares.length === 0) {
      ElMessage.error("请选择课件")
      return
    }

    try {
      loading.value = true
      if (isEdit.value) {
        await updateStudyPlan(currentId.value, formData)
        ElMessage.success("更新成功")
      } else {
        await createStudyPlan(formData)
        ElMessage.success("创建成功")
      }
      emit("success")
      handleClose()
    } catch (error) {
      console.error("保存失败:", error)
      ElMessage.error("保存失败")
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
    :title="isEdit ? '编辑自学计划' : '新增自学计划'"
    width="800px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="计划名称" prop="title">
            <el-input v-model="formData.title" placeholder="请输入计划名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学习类别" prop="category">
            <el-select v-model="formData.category" placeholder="请选择学习类别" style="width: 100%">
              <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="难度等级" prop="level">
            <el-select v-model="formData.level" placeholder="请选择难度等级" style="width: 100%">
              <el-option
                v-for="item in levelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学习时长" prop="study_hours">
            <el-input-number
              v-model="formData.study_hours"
              :min="0"
              :max="1000"
              placeholder="请输入学习时长"
              style="width: 50%"
            />
            <span style="margin-left: 8px;">小时</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="目标分数" prop="target_score">
        <el-input-number
          v-model="formData.target_score"
          :min="0"
          :max="100"
          placeholder="请输入目标分数"
          style="width: 200px"
        />
        <span style="margin-left: 8px;">分</span>
      </el-form-item>

      <el-form-item label="计划描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入计划描述"
        />
      </el-form-item>

      <el-form-item label="学习课件">
        <el-select
          v-model="formData.coursewares"
          multiple
          filterable
          remote
          default-first-option
          placeholder="请输入或选择课件"
          :remote-method="handleSearchCoursewares"
          :loading="searchLoading"
          style="width: 380px"
        >
          <el-option
            v-for="co in coursewareOptions"
            :key="co.id"
            :label="co.title"
            :value="co.id"
          >
            <span>{{ co.title }}</span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  text-align: right;
}

.el-table {
  margin-top: 10px;
}
</style>

<script lang="ts" setup>
const emit = defineEmits(["success", "close"])

const formData = reactive({
  name: "",
  training_category: 0,
  training_mode: 0,
  trainer: ""
})

const categoryOptions = ref([
  { label: "制度学习", value: 1 },
  { label: "会议传达", value: 2 },
  { label: "安全技术培训", value: 3 },
  { label: "三级教育", value: 4 }
])
const formRef = ref()
const visible = ref(false)
const recordData = ref([])

const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.name = ""
  formData.training_category = 0
  formData.training_mode = 0
  formData.trainer = ""
}

function open(options = {
  data: {} as any
}) {
  resetForm()
  formData.name = options.data?.name
  formData.training_category = options.data?.training_category
  formData.training_mode = options.data?.training_mode
  formData.trainer = options.data?.trainer

  visible.value = true
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return
    btnSubmit.loading = true
  })
}

function getTrainingCategory(value: number) {
  return categoryOptions.value.find(item => item.value === value)?.label || "其他"
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
      <el-table-column property="id" label="序号" width="60" />
      <el-table-column property="name" label="姓名" width="120" />
      <el-table-column property="name" label="性别" width="120" />
      <el-table-column property="name" label="年龄" width="120" />
      <el-table-column property="name" label="所属单位" min-width="120" />
      <el-table-column property="name" label="身份证号码" width="120" />
      <el-table-column property="name" label="学时" width="120" />
      <el-table-column property="name" label="是否合格" width="80" />
      <el-table-column property="name" label="成绩" width="60" />
      <el-table-column property="name" label="试卷上传" width="120" />
      <el-table-column property="name" label="试卷预览" width="120" />
    </el-table>
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
.cell-item {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script lang="ts" setup>
import { createRecord } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  participants: [],
  participants_outer: [],
  contents: "",
  contents_select: [] as { name: string, url: string }[],
  contents_matrix: [] as number[],
  coursewares: []
})

const formRef = ref()
const visible = ref(false)
const scopeOptions = ref<any>([])
const recordData = reactive<any>({})
const fileList = ref([])
const cascaderOptions = ref({
  matrix: [] as number[]
})

const btnSubmit = reactive({
  loading: false
})
const treeSelectKey = ref(0)

function resetForm() {
  formData.id = 0
  formData.participants = []
  formData.participants_outer = []
  formData.contents = ""
  formData.contents_select = []
  formData.contents_matrix = []
  formData.coursewares = []
  fileList.value = []
  scopeOptions.value = []
  handleMatrixClear()
  treeSelectKey.value++
}

function open(options = {
  data: {} as any
}) {
  console.log(options)
  visible.value = true
  resetForm()
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return
    if (formData.participants.length === 0 && formData.participants_outer.length === 0) {
      ElMessage({
        message: "请选择参与人员",
        type: "error",
        offset: 0
      })
      return
    }
    btnSubmit.loading = true
    createRecord(formData).then((response) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: "培训记录已成功创建！",
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

function handleMatrixClear() {
  formData.contents_matrix = []
  cascaderOptions.value.matrix = []
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="培训结果"
    width="50%"
    :before-close="close"
  >
    <el-table :data="recordData">
      <el-table-column property="date" label="Date" width="150" />
      <el-table-column property="name" label="Name" width="200" />
      <el-table-column property="address" label="Address" />
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
</style>

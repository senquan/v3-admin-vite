<script lang="ts" setup>
import { getCascaderOptions } from "@/common/utils/helper"
import { request } from "@/http/axios"
import { fetchCategoryListOpt } from "../../setting/apis"
import { fetchList as fetchCoursewares } from "./../../knowledge/courseware/apis"
import { createRecord, fetchStaff } from "./apis"

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
const props = ref({
  label: "label",
  value: "value",
  isLeaf: "isLeaf"
})
const planData = reactive<any>({})
const dicts = ref({
  categories: [] as any,
  methods: [] as any
})
const fileList = ref([])
const searchLoading = ref(false)
const coursewareOptions = ref<any>([])
const cascaderOptions = ref({
  matrix: [] as number[]
})
const matrix = ref<any>([])

const rules = {
}

const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.id = 0
  formData.participants = []
  formData.participants_outer = []
  formData.contents = ""
  formData.contents_select = []
  formData.contents_matrix = []
  formData.coursewares = []
  fileList.value = []
  handleMatrixClear()
}

function open(options = {
  scopes: [],
  data: {} as any,
  dicts: {} as any
}) {
  console.log(options)
  Object.assign(planData, options.data)
  dicts.value = options.dicts
  visible.value = true
  resetForm()
  formData.id = planData.id
  scopeOptions.value = options.scopes
  if (planData.training_category === 3 || planData.training_category === 4) {
    loadMatrix()
  }
}

function close() {
  visible.value = false
  emit("close")
}

function loadOuterParticipants(node: any, resolve: any) {
  loadParticipants(node, resolve, "outer")
}

function loadParticipants(node: any, resolve: any, type: string = "inner") {
  if (node.level === 0) return resolve(scopeOptions.value)
  if (node.isLeaf || node.level > 1) return resolve([])
  fetchStaff({ id: node.data.value, type }).then((res) => {
    if (res.code === 0) {
      return resolve(res.data.users.map((item: any) => {
        return {
          value: item.id,
          label: item.realname,
          isLeaf: true
        }
      }))
    } else {
      ElMessage({
        message: "获取人员失败",
        type: "error",
        offset: 0
      })
      return resolve([])
    }
  })
}

function loadMatrix() {
  if (matrix.value.length > 0) return
  fetchCategoryListOpt().then((res) => {
    const categoryOptData: Array<any> = []
    if (res.data) {
      for (const item of res.data.categories) {
        const parent = item.parentId || 0
        if (categoryOptData[parent] === undefined) {
          categoryOptData[parent] = []
        }
        categoryOptData[parent].push(item)
      }
      matrix.value = getCascaderOptions(categoryOptData, 0, 0, 3)
    }
  })
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
    if (planData.training_category === 1 || planData.training_category === 2) {
      formData.contents_select = fileList.value.map((item: any) => {
        return {
          name: item.name,
          url: item.response.data.url
        }
      }).filter((item: any) => item.url !== "")
    }
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

function getTrainingCategory(value: number) {
  return dicts.value.categories.find((item: any) => item.value === value)?.label || "其他"
}

function handlePreview(file: any) {
  console.log(file)
}

function handleRemove(file: any, fileList: any) {
  console.log(file, fileList)
}

function beforeRemove(file: any, fileList: any): boolean {
  console.log(file, fileList)
  return true
}

function beforeUpload(file: any) {
  console.log(file)
}

function handleExceed(files: any, fileList: any) {
  console.log(files, fileList)
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

function handleSearchCoursewares(value: string) {
  if (value === "" && coursewareOptions.value.length > 0) return
  searchLoading.value = true
  fetchCoursewares({ keyword: value }).then((response) => {
    if (response.code === 0) {
      coursewareOptions.value = response.data.coursewares
      console.log(coursewareOptions.value)
      searchLoading.value = false
    } else {
      ElMessage.error(`获取课件列表失败: ${response.message}`)
    }
  })
}

function handleMatrixClear() {
  formData.contents_matrix = []
  cascaderOptions.value.matrix = []
}

function handleMatrixChange(value: any[]) {
  formData.contents_matrix = value.map((item: any) => item[item.length - 1])
  console.log(formData.contents_matrix)
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="新增培训记录"
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
          <el-form-item label="人员选择" prop="participants">
            <div>
              <el-text>本单位人员</el-text>
              <el-tree-select
                v-model="formData.participants"
                lazy
                :load="loadParticipants"
                :props="props"
                multiple
                filterable
                :render-after-expand="false"
                show-checkbox
                style="margin-left: 20px; width: 380px;"
              />
            </div>
            <div style="margin-top: 20px;">
              <el-text>外单位人员</el-text>
              <el-tree-select
                v-model="formData.participants_outer"
                lazy
                :load="loadOuterParticipants"
                :props="props"
                multiple
                filterable
                :render-after-expand="false"
                show-checkbox
                style="margin-left: 20px; width: 380px;"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="培训内容" prop="contents">
            <el-text>请填写 [{{ getTrainingCategory(planData.training_category) }}] 内容</el-text>
            <div v-if="planData.training_category === 1 || planData.training_category === 2">
              <el-input v-model="formData.contents" type="textarea" :rows="3" style="width: 500px" />
              <el-upload
                v-model:file-list="fileList"
                class="uploader"
                multiple
                :on-preview="handlePreview"
                :on-remove="handleRemove"
                :before-remove="beforeRemove"
                :before-upload="beforeUpload"
                :on-exceed="handleExceed"
                :http-request="customUploadRequest"
                style="width: 380px; margin-top: 20px;"
              >
                <el-button type="primary">上传相关文件</el-button>
              </el-upload>
            </div>
            <div v-if="planData.training_category === 3 || planData.training_category === 4">
              <el-cascader
                v-model="cascaderOptions.matrix"
                multiple
                placeholder="选择培训内容"
                filterable
                clearable
                :options="matrix"
                :props="{ expandTrigger: 'hover', multiple: true, checkStrictly: true }"
                :debounce="500"
                @change="(value: any) => handleMatrixChange(value as number[])"
                @clear="handleMatrixClear()"
                class="filter-item"
                style="width: 380px; margin-top: 20px;"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="培训课件" prop="coursewares">
            <el-select
              v-model="formData.coursewares"
              multiple
              filterable
              remote
              default-first-option
              placeholder="请输入或选择标签"
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

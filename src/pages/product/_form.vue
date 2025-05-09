<script lang="ts" setup>
import { request } from "@/http/axios"
import { findCascaderPath } from "@/common/utils/helper"
import { ElMessage, UploadProps } from "element-plus"
import { fetchTagsList } from "../tags/apis"
import { createProduct, fetchModels, fetchProduct, updateProduct } from "./apis"

export type CascaderNodeValue = string | number
export type CascaderNodePathValue = CascaderNodeValue[]
export type CascaderValue = CascaderNodeValue | CascaderNodePathValue | (CascaderNodeValue | CascaderNodePathValue)[]

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  materialId: "",
  barCode: "",
  modelType: 0,
  seriesId: 0,
  colorId: "",
  basePrice: 0,
  projectPrice: 0,
  factoryPrice: 0,
  imageUrl: "",
  remark: "",
  tags: []
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const colors = ref<any>([])
const series = ref<any>([])
const cascaderOptions = ref({
  serie: [] as number[]
})
const modelLoading = ref(false)
const modelOptions = ref<any>([])
const tagOptions = ref<any>([])
const selectedTags = ref<any>([])
const tagsLoading = ref(false)
const imagePreview = ref<string>('')

const rules = {
  name: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  materialId: [{ required: true, message: "请输入物料编号", trigger: "blur" }],
  basePrice: [{ required: true, message: "请输入日常价金额", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.id = 0
  formData.name = ""
  formData.materialId = ""
  formData.barCode = ""
  formData.modelType = 0
  formData.seriesId = 0
  formData.colorId = ""
  formData.basePrice = 0
  formData.projectPrice = 0
  formData.factoryPrice = 0
  formData.imageUrl = ""
  formData.remark = ""
  formData.tags = []
  modelOptions.value = []
  imagePreview.value = ''
}

function open(options = {
  colors: Array<{ label: string, value: number }>,
  series: Array<{ label: string, value: number }>,
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0

  // 先加载选项数据
  if (options.colors) colors.value = options.colors
  if (options.series) series.value = options.series

  if (isEdit.value) {
    isEdit.value = true
    fetchProduct(options.id).then((response) => {
      if (response.code === 0) {
        const data = response.data
        Object.keys(data).forEach((key) => {
          if (key in formData) {
            if (key in data && key in formData) {
              (formData[key as keyof typeof formData] as any) = data[key as keyof typeof data]
            }
          }
        })
        cascaderOptions.value.serie = findCascaderPath(series.value, data.series.id) || [data.series.id]
        if (data.modelType) {
          modelOptions.value = [{
            id: data.modelType.id,
            name: data.modelType.name
          }]
          formData.modelType = data.modelType.id
        }
        // 加载标签
        tagOptions.value = []
        selectedTags.value = []
        if (data.tags) {
          data.tags.forEach((tag: any) => {
            if (tag.id) {
              tagOptions.value.push({
                id: tag.id,
                name: tag.name,
                color: tag.color
              })
              selectedTags.value.push(tag.id)
            }
          })
        }
        if (data.imageUrl) {
          imagePreview.value = `${data.imageUrl}`
        }
      } else {
        ElMessage({
          message: response.message || "获取商品详情失败",
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

function handleSeriesChange(value: CascaderValue) {
  if (Array.isArray(value) && value.length > 0) {
    formData.seriesId = value[value.length - 1] as number
  } else {
    formData.seriesId = 0
  }
}

function handleSearchModel(query: string) {
  if (query === "" && query.length < 2) return
  modelLoading.value = true
  fetchModels({ keyword: query }).then((response) => {
    if (response.code === 0) {
      modelOptions.value = response.data.models.map((item: any) => ({
        id: item.id,
        name: item.name
      }))
      modelLoading.value = false
    } else {
      ElMessage.error(`获取型号列表失败: ${response.message}`)
    }
  })
}

function handleSearchTags(value: string) {
  if (value === "" && tagOptions.value.length > 0) return
  tagsLoading.value = true
  fetchTagsList({ keyword: value }).then((response) => {
    if (response.code === 0) {
      tagOptions.value = response.data.tags
      tagsLoading.value = false
    } else {
      ElMessage.error(`获取标签列表失败: ${response.message}`)
    }
  })
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return
    formData.tags = selectedTags.value
    btnSubmit.loading = true
    const request = isEdit.value
      ? updateProduct(formData.id, formData)
      : createProduct(formData)

    request.then((response) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? "商品已成功更新！" : "商品已成功创建！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? "更新商品失败" : "创建商品失败"),
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

function beforeImageUpload(file: any) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

function customUploadRequest(options: any) {
  const { file, onSuccess, onError, onProgress } = options
  const data = new FormData()
  data.append('image', file)
  return request({
    url: 'upload/image',
    method: 'POST',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: any) => {
      if (progressEvent.total) {
        const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
        console.log(`Upload progress: ${percent}%`)
        onProgress({ percent })
      }
    }
  })
  .then((response: any) => {
    onSuccess(response)
    return response
  })
  .catch((error: any) => {
    onError(error)
    return Promise.reject(error)
  })
}

const handleImageSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile
) => {
  console.log('处理上传成功回调:', response)
  imagePreview.value = URL.createObjectURL(uploadFile.raw!)
  formData.imageUrl = response.data.url
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑商品' : '新增商品'"
    width="500px"
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
          <el-form-item label="商品名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入商品名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="物料编号" prop="materialId">
            <el-input v-model="formData.materialId" placeholder="请输入物料编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="条形码" prop="barCode">
            <el-input v-model="formData.barCode" placeholder="请输入条形码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="型号" prop="modelType">
            <el-select
              v-model="formData.modelType"
              filterable
              remote
              allow-create
              default-first-option
              placeholder="请输入或选择型号"
              :remote-method="handleSearchModel"
              :loading="modelLoading"
            >
              <el-option
                v-for="model in modelOptions"
                :key="model.id"
                :label="model.name"
                :value="model.id || model.name"
              >
                {{ model.name }}
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="系列" prop="seriesId">
            <el-cascader v-model="cascaderOptions.serie" placeholder="选择系列" :options="series" :props="{ expandTrigger: 'hover' }" filterable @change="handleSeriesChange" :debounce="500" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="颜色" prop="colorId">
            <el-select v-model="formData.colorId" placeholder="请选择颜色">
              <el-option
                v-for="co in colors"
                :key="co.value"
                :label="co.label"
                :value="co.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="日常价" prop="basePrice">
            <el-input type="number" v-model="formData.basePrice" placeholder="请输入金额" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="工程价" prop="projectPrice">
            <el-input type="number" v-model="formData.projectPrice" placeholder="请输入金额" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出厂价" prop="factoryPrice">
            <el-input type="number" v-model="formData.factoryPrice" placeholder="请输入金额" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="产品主图" prop="image">
            <el-upload
              class="image-uploader"
              :show-file-list="false"
              :on-success="handleImageSuccess"
              :before-upload="beforeImageUpload"
              :http-request="customUploadRequest"
            >
              <el-image v-if="formData.imageUrl" class="image-previews" :src="imagePreview" fit="contain" />
              <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="标签" prop="tags">
            <el-select
              v-model="selectedTags"
              multiple
              filterable
              remote
              placeholder="请输入或选择标签"
              :remote-method="handleSearchTags"
              :loading="tagsLoading"
            >
              <el-option
                v-for="tag in tagOptions"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              >
                <span :style="{ color: tag.color }">{{ tag.name }}</span>
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
.image-uploader .image-previews{
  width: 100px;
  height: 100px;
  display: block;
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

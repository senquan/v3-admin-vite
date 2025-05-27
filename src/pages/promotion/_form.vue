<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { ElMessage } from "element-plus"
import { createPromotion, fetchList, fetchPromotion, updatePromotion } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  platformId: 0,
  type: 1,
  startTime: "",
  endTime: "",
  status: 0,
  isStackable: false,
  description: "",
  copyFrom: ""
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const platformOptions = ref<any>([])
const typeOptions = ref<any>([])
const promotionOptions = ref<any>([])
const timeRange = ref<any[]>([])
const defaultTime: [Date, Date] = [
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59)
]

const rules = {
  name: [{ required: true, message: "请输入活动名称", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.id = 0
  formData.name = ""
  formData.platformId = 0
  formData.type = 1
  formData.startTime = ""
  formData.endTime = ""
  formData.status = 0
  formData.description = ""
  formData.isStackable = false
  formData.copyFrom = ""
  timeRange.value = []
}

function open(options = {
  platforms: Array<{ label: string, value: string }>,
  types: Array<{ label: string, value: string }>,
  promotions: Array<{ label: string, value: string }>,
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0

  // 先加载选项数据
  if (options.platforms) platformOptions.value = options.platforms
  if (options.types) typeOptions.value = options.types
  if (options.promotions) promotionOptions.value = options.promotions
  if (isEdit.value) {
    fetchPromotion(options.id).then((response) => {
      if (response.code === 0) {
        const data = response.data.promotion
        Object.keys(data).forEach((key) => {
          if (key in formData) {
            if (key in data && key in formData) {
              (formData[key as keyof typeof formData] as any) = data[key as keyof typeof data]
            }
          }
        })
        timeRange.value = [formatDateTime(formData.startTime), formatDateTime(formData.endTime)]
      } else {
        ElMessage({
          message: response.message || "获取活动详情失败",
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
  }
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return

    btnSubmit.loading = true
    const request = isEdit.value
      ? updatePromotion(formData.id, formData)
      : createPromotion(formData)

    request.then((response) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? "活动已成功更新！" : "活动已成功创建！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? "更新活动失败" : "创建活动失败"),
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

function handleTimeChange(value: any) {
  if (value) {
    formData.startTime = value[0]
    formData.endTime = value[1]
    console.log(value)
  }
}

function handleSearchPromotion(query: string) {
  if (query.length < 2) return
  fetchList({ keyword: query }).then((response: any) => {
    if (response.code === 0) {
      promotionOptions.value = response.data.promotions.map((promotion: any) => ({
        value: promotion.id,
        label: promotion.name
      }))
    } else {
      ElMessage.error(`获取促销活动列表失败: ${response.message}`)
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
    :title="isEdit ? '编辑活动' : '新增活动'"
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
          <el-form-item label="活动名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入活动名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择活动类型">
              <el-option
                v-for="tp in typeOptions"
                :key="tp.value"
                :label="tp.label"
                :value="tp.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="平台" prop="platformId">
            <el-select v-model="formData.platformId" placeholder="请选择平台">
              <el-option
                v-for="pf in platformOptions"
                :key="pf.value"
                :label="pf.label"
                :value="pf.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="起始时间" prop="materialId">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="To"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :default-time="defaultTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleTimeChange"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="说明" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入活动说明" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="!isEdit">
        <el-col :span="24">
          <el-form-item label="复制自" prop="copyFrom">
            <el-select
              v-model="formData.copyFrom"
              filterable
              clearable
              remote
              :remote-method="handleSearchPromotion"
              placeholder="请选择要复制的活动"
            >
              <el-option
                v-for="po in promotionOptions"
                :key="po.value"
                :label="po.label"
                :value="po.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="isEdit">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-switch
              :model-value="formData.status > 0"
              @update:model-value="(val) => formData.status = val ? 2 : 0"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="可叠加" prop="isStackable">
            <el-switch
              :model-value="formData.isStackable"
              @update:model-value="(val) => formData.isStackable = val ? true : false"
            />
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
</style>

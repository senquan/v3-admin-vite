<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createCoupon, fetchCoupon, updateCoupon } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  type: 1, // 1-满减券 2-折扣券 3-无门槛券
  amount: 0, // 金额（满减券和无门槛券）
  discount: 0, // 折扣（折扣券）
  minAmount: 0, // 使用门槛
  startTime: "",
  endTime: "",
  totalCount: 0, // 发放总量
  perLimit: 1, // 每人限领
  status: 1, // 1-启用 0-禁用
  description: "", // 描述
  platformId: 0, // 平台ID
  useRules: "", // 使用规则
  productIds: [] // 适用商品ID
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const loading = ref(false)
const platformOptions = ref<any>([])

const rules = {
  name: [{ required: true, message: "请输入优惠券名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择优惠券类型", trigger: "change" }],
  startTime: [{ required: true, message: "请选择开始时间", trigger: "change" }],
  endTime: [{ required: true, message: "请选择结束时间", trigger: "change" }],
  totalCount: [{ required: true, message: "请输入发放总量", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

// 计算属性：是否为满减券
const isFullReduction = computed(() => {
  return formData.type === 5
})

// 计算属性：是否为折扣券
const isDiscount = computed(() => {
  return formData.type === 1
})

// 计算属性：是否为无门槛券
const isNoThreshold = computed(() => {
  return formData.type === 2
})

async function open(options: any) {
  resetForm()
  visible.value = true
  if (options.platformOptions) platformOptions.value = options.platformOptions
  console.log(platformOptions.value)
  if (options.id > 0) {
    isEdit.value = true
    loading.value = true
    try {
      fetchCoupon(options.id).then((response) => {
        if (response.code === 0 && response.data) {
          const data = response.data
          Object.keys(data).forEach((key) => {
            if (key in formData) {
              (formData[key as keyof typeof formData] as any) = data[key as keyof typeof data]
            }
          })
        } else {
          ElMessage.error("获取优惠券信息失败")
        }
      })
    } catch (error) {
      console.error("获取优惠券信息失败:", error)
      ElMessage.error("获取优惠券信息失败，请重试")
    } finally {
      loading.value = false
    }
  } else {
    isEdit.value = false
  }
}

function resetForm() {
  Object.assign(formData, {
    id: 0,
    name: "",
    type: 1,
    amount: 0,
    discount: 0,
    minAmount: 0,
    startTime: "",
    endTime: "",
    totalCount: 0,
    perLimit: 1,
    status: 1,
    description: "",
    platformId: 0,
    useRules: "",
    productIds: []
  })
}

function close() {
  visible.value = false
  emit("close")
}

function handleSubmit() {
  if (!formRef.value) {
    ElMessage.error("表单未正确初始化")
    return
  }

  formRef.value.validate((valid: any) => {
    if (!valid) return

    // 验证时间
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      ElMessage.error("结束时间必须晚于开始时间")
      return
    }

    // 验证金额
    if (isFullReduction.value && formData.amount <= 0) {
      ElMessage.error("满减券金额必须大于0")
      return
    }

    // 验证折扣
    if (isDiscount.value && (formData.discount <= 0 || formData.discount >= 1)) {
      ElMessage.error("折扣必须在0-1之间")
      return
    }

    // 验证无门槛券金额
    if (isNoThreshold.value && formData.amount <= 0) {
      ElMessage.error("无门槛券金额必须大于0")
      return
    }

    btnSubmit.loading = true
    const request = isEdit.value ? updateCoupon(formData.id, formData) : createCoupon(formData)
    request.then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? `优惠券已成功更新！` : `优惠券已成功创建！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? `更新优惠券失败` : `创建优惠券失败`),
          type: "error",
          offset: 0
        })
      }
    }).catch(() => {
      btnSubmit.loading = false
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
    :title="`${isEdit ? '编辑' : '创建'}优惠券`"
    width="60%"
    :before-close="close"
    :close-on-click-modal="false"
  >
    <el-skeleton :loading="loading" animated>
      <template #default>
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="120px"
        >
          <el-row>
            <el-col :span="12">
              <el-form-item label="优惠券名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入优惠券名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="优惠券类型" prop="type">
                <el-select v-model="formData.type" placeholder="请选择优惠券类型">
                  <el-option label="折扣券" :value="1" />
                  <el-option label="无门槛券" :value="2" />
                  <el-option label="满减券" :value="5" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12" v-if="isFullReduction || isNoThreshold">
              <el-form-item :label="isFullReduction ? '优惠金额' : '券面额'" prop="amount">
                <el-input-number v-model="formData.amount" :min="0" :precision="2" :step="10" />
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="isDiscount">
              <el-form-item label="折扣比例" prop="discount">
                <el-input-number v-model="formData.discount" :min="0" :max="0.99" :precision="2" :step="0.1" />
                <span class="ml-2">折</span>
              </el-form-item>
            </el-col>
            <el-col :span="12" v-if="isFullReduction || isDiscount">
              <el-form-item label="使用门槛" prop="minAmount">
                <el-input-number v-model="formData.minAmount" :min="0" :precision="2" :step="10" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="开始时间" prop="startTime">
                <el-date-picker
                  v-model="formData.startTime"
                  type="datetime"
                  placeholder="选择开始时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束时间" prop="endTime">
                <el-date-picker
                  v-model="formData.endTime"
                  type="datetime"
                  placeholder="选择结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="发放总量" prop="totalCount">
                <el-input-number v-model="formData.totalCount" :min="0" :step="100" />
                <span class="ml-2">张</span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="每人限领" prop="perLimit">
                <el-input-number v-model="formData.perLimit" :min="1" :step="1" />
                <span class="ml-2">张</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="formData.status">
                  <el-radio :value="1">启用</el-radio>
                  <el-radio :value="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="平台" prop="platformId">
                <el-select v-model="formData.platformId" placeholder="请选择平台">
                  <el-option
                    v-for="pf in platformOptions"
                    :key="pf.value"
                    :label="pf.label"
                    :value="Number(pf.value)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="24">
              <el-form-item label="使用规则" prop="useRules">
                <el-input v-model="formData.useRules" type="textarea" :rows="3" placeholder="请输入使用规则" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="24">
              <el-form-item label="描述" prop="description">
                <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入优惠券描述" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
    </el-skeleton>
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
.ml-2 {
  margin-left: 8px;
}
</style>

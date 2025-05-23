<script lang="ts" setup>
import { useUserStore } from "@/pinia/stores/user"
import { batchUpdateProduct } from "./apis"

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedIds: {
    type: Array<number>,
    default: () => []
  },
  allCounts: {
    type: Number,
    default: 0
  },
  searchParams: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(["close", "success"])

const userStore = useUserStore()
const isAdmin = userStore.roles.includes("ADMIN")

const formRef = ref()
const loading = ref(false)
const form = reactive({
  scope: "selected", // "selected" 或 "all"
  adjustType: "percent", // "percent" 或 "fixed"
  values: [] as number[]
})

const rules = {
  scope: [{ required: true, message: "请选择调整范围", trigger: "change" }],
  adjustType: [{ required: true, message: "请选择调整方式", trigger: "change" }]
}

const scopeOptions = [
  { label: "选中的商品", value: "selected" },
  { label: "所有搜索结果", value: "all" }
]

const priceTypeOptions = [
  { label: "日常价", value: "basePrice" },
  { label: "工程价", value: "projectPrice" },
  { label: "出厂价", value: "factoryPrice" }
]

if (!isAdmin) {
  priceTypeOptions.splice(2, 1)
}

const adjustTypeOptions = [
  { label: "按百分比调整", value: "percent" },
  { label: "设置为固定价格", value: "fixed" }
]

function close() {
  formRef.value.resetFields()
  emit("close")
}

function submit() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      // 确定要调整的商品ID
      const productIds = props.selectedIds

      if (form.scope === "selected" && productIds.length === 0) {
        ElMessage.warning("没有选择任何商品")
        loading.value = false
        return
      }

      // 构建请求数据
      const requestData = {
        ids: productIds,
        adjustType: form.adjustType,
        values: form.values,
        searchParams: form.scope === "all" ? props.searchParams : undefined
      }

      // 发送请求
      const response = await batchUpdateProduct(requestData)
      if (response.code === 0) {
        ElMessage.success("调整价格成功")
        emit("success")
        close()
      } else {
        ElMessage.error(response.message || "调整价格失败")
      }
    } catch (error: any) {
      console.error("批量调整价格失败:", error)
      ElMessage.error(error.message || "调整价格失败，请稍后重试")
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <el-dialog
    title="批量调整价格"
    :model-value="props.visible"
    width="500px"
    @close="close"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="调整范围" prop="scope">
        <el-radio-group v-model="form.scope">
          <el-radio
            v-for="option in scopeOptions"
            :key="option.value"
            :value="option.value"
            :disabled="option.value === 'selected' && props.selectedIds.length === 0"
          >
            {{ option.label }}
            <span v-if="option.value === 'selected'">
              ({{ props.selectedIds.length }}个)
            </span>
            <span v-if="option.value === 'all'">
              ({{ props.allCounts }}个)
            </span>
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="调整方式" prop="adjustType">
        <el-radio-group v-model="form.adjustType">
          <el-radio
            v-for="option in adjustTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-for="(option, index) in priceTypeOptions"
        :key="option.value"
        :label="option.label"
        :prop="`value[${index}]`"
      >
        <el-input-number
          v-model="form.values[index]"
          :precision="form.adjustType === 'percent' ? 2 : 2"
          :min="form.adjustType === 'percent' ? -100 : 0"
          :max="form.adjustType === 'percent' ? 1000 : 999999"
          :step="form.adjustType === 'percent' ? 5 : 10"
          style="width: 180px"
        />
        <span style="margin-left: 10px">
          {{ form.adjustType === "percent" ? "%" : "元" }}
        </span>
      </el-form-item>
      <div class="form-tip" v-if="form.adjustType === 'percent'">
        正数表示上调, 负数表示下调， 如: 10% 表示上调 10%
      </div>
    </el-form>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-align: center;
}
</style>

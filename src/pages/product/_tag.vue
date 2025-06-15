<script lang="ts" setup>
// import { useUserStore } from "@/pinia/stores/user"
import { fetchTagsList } from "../tags/apis"
import { batchUpdateTags } from "./apis"

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

// const userStore = useUserStore()
// const isAdmin = userStore.roles.includes("ADMIN")

const formRef = ref()
const loading = ref(false)
const form = reactive({
  scope: "selected", // "selected" 或 "all"
  adjustType: "add",
  values: [] as number[]
})
const confirmDelete = ref("")
const tagsLoading = ref(false)
const tagOptions = ref<any>([])

const rules = {
  scope: [{ required: true, message: "请选择调整范围", trigger: "change" }],
  adjustType: [{ required: true, message: "请选择调整方式", trigger: "change" }]
}

const scopeOptions = [
  { label: "选中的商品", value: "selected" },
  { label: "所有搜索结果", value: "all" }
]

const adjustTypeOptions = [
  { label: "增加标签", value: "add" },
  { label: "清除所有标签", value: "clear" }
]

function close() {
  formRef.value.resetFields()
  form.values = []
  confirmDelete.value = ""
  emit("close")
}

function submit() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    if (form.adjustType === "clear" && confirmDelete.value !== "确认清除标签") {
      ElMessage.warning("请输入正确的确认删除内容")
      return
    }

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
        scope: form.scope,
        adjustType: form.adjustType,
        values: form.values,
        searchParams: form.scope === "all" ? props.searchParams : undefined
      }

      // 发送请求
      const response = await batchUpdateTags(requestData)
      if (response.code === 0) {
        ElMessage.success("调整标签成功")
        emit("success")
        close()
      } else {
        ElMessage.error(response.message || "调整标签失败")
      }
    } catch (error: any) {
      console.error("批量调整标签失败:", error)
      ElMessage.error(error.message || "调整标签失败，请稍后重试")
    } finally {
      loading.value = false
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
</script>

<template>
  <el-dialog
    title="批量调整标签"
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

      <el-form-item label="标签" prop="tags" v-if="form.adjustType === 'add'">
        <el-select
          v-model="form.values"
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

      <el-form-item label="确认删除" v-if="form.adjustType === 'clear'">
        <el-input placeholder="请确认删除标签" v-model="confirmDelete" />
        <el-text size="small" color="red">
          <el-icon>
            <InfoFilled />
          </el-icon>
          清除所有标签不能恢复, 确认请在输入框填入‘确认清除标签'
        </el-text>
      </el-form-item>
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

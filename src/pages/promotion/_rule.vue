<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createRule, fetchRule, updateRule } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  type: 1,
  promotionId: 0,
  discountValue: 0,
  condition: ""
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const typeOptions = ref<any>([])

const rules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

function resetForm() {
  formData.id = 0
  formData.name = ""
  formData.type = 1
  formData.discountValue = 0
  formData.condition = ""
}

function open(options = {
  types: Array<{ label: string, value: string }>,
  promotionId: 0,
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0
  formData.promotionId = options.promotionId
  if (!formData.promotionId) {
    ElMessage({
      message: "请先选择促销活动",
      type: "error",
      offset: 0
    })
    close()
    return
  }

  // 先加载选项数据
  if (options.types) typeOptions.value = options.types
  if (isEdit.value) {
    isEdit.value = true
    fetchRule(options.id).then((response) => {
      if (response.code === 0) {
        const data = response.data
        Object.keys(data).forEach((key) => {
          if (key in formData) {
            if (key in data && key in formData) {
              if (key === "condition" && data[key]) {
                // 将JSON对象转换为格式化的文本
                formData[key] = JSON.stringify(data[key], null, 2)
              } else {
                (formData[key as keyof typeof formData] as any) = data[key as keyof typeof data]
              }
            }
          }
        })
      } else {
        ElMessage({
          message: response.message || "获取规则详情失败",
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
    // 处理提交的数据
    const submitData = { ...formData }
    if (submitData.condition) {
      try {
        // 将文本转换回JSON对象
        submitData.condition = JSON.parse(submitData.condition)
      } catch (e) {
        ElMessage({
          message: `条件内容必须是有效的JSON格式: ${e}`,
          type: "error",
          offset: 0
        })
        btnSubmit.loading = false
        return
      }
    }

    const request = isEdit.value
      ? updateRule(formData.id, submitData)
      : createRule(submitData)

    request.then((response) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? "规则已成功更新！" : "规则已成功创建！",
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? "更新规则失败" : "创建规则失败"),
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

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑规则' : '新增规则'"
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
          <el-form-item label="规则名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择类型">
              <el-option
                v-for="pf in typeOptions"
                :key="pf.value"
                :label="pf.label"
                :value="pf.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="折扣值" prop="discountValue">
            <el-input v-model="formData.discountValue" placeholder="请输入折扣值" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="条件" prop="description">
            <el-input v-model="formData.condition" type="textarea" :rows="10" placeholder="请输入条件内容, JSON格式" />
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

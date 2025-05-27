<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { createRule, fetchRule, updateRule } from "./apis"

// 更具体的类型定义
interface ConditionItem {
  [key: string]: any
}

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  name: "",
  type: 1,
  promotionId: 0,
  discountValue: 0,
  condition: ""
})

const addRule = reactive({
  attr: "",
  condition: "",
  value: ""
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const typeOptions = ref<any>([])
const attrOptions = ref<any>([
  { label: "型号", value: "modelType" },
  { label: "序列", value: "series" },
  { label: "颜色", value: "color" },
  { label: "名称", value: "name" },
  { label: "日常价", value: "basePrice" },
  { label: "工程价", value: "projectPrice" },
  { label: "数量", value: "quantity" },
  { label: "日常总价", value: "totalBasePrice" },
  { label: "工程总价", value: "totalProjectPrice" }
])
const conditionOptions = ref<any>([
  { label: "等于", value: "equal" },
  { label: "不等于", value: "notEqual" },
  { label: "大于或等于", value: "greaterThanOrEqual" },
  { label: "小于或等于", value: "lessThanOrEqual" },
  { label: "小于", value: "lessThan" },
  { label: "大于", value: "greaterThan" },
  { label: "包含", value: "in" },
  { label: "不包含", value: "notIn" },
  { label: "匹配", value: "contains" }
])

const rules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  discountValue: [
    { required: true, message: "请输入折扣值", trigger: "blur" },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!/^-?\d+(\.\d+)?$/.test(String(value))) {
          callback(new Error("折扣值必须为数字"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  condition: [{ required: true, message: "请输入规则条件内容", trigger: "blur" }]
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

function handleAddRule() {
  if (!addRule.attr || !addRule.condition || !addRule.value) {
    ElMessage({
      message: "请填写完整的条件信息",
      type: "error",
      offset: 0
    })
    return
  }

  // 处理多个值（用逗号分隔）
  let valueToUse = null
  if (["in", "notIn", "contains"].includes(addRule.condition)) {
    // 对于数组类型的条件，将逗号分隔的值转换为数组
    valueToUse = addRule.value.split(",").map((item: string) => item.trim())
  } else {
    if (!["modelType", "series", "color", "name"].includes(addRule.attr)) {
      // 对于数值类型的条件，将值转换为数字
      if (!Number.isNaN(Number(addRule.value))) {
        valueToUse = Number(addRule.value)
      }
    } else {
      valueToUse = addRule.value
    }
  }

  // 解析现有的条件
  let currentCondition: ConditionItem = {}
  if (formData.condition) {
    try {
      currentCondition = typeof formData.condition === "string" ? JSON.parse(formData.condition) : formData.condition
    } catch (e) {
      console.error("Error parsing condition:", e)
      currentCondition = {}
    }
  }

  // 更新条件
  if (!currentCondition[addRule.attr]) {
    currentCondition[addRule.attr] = {}
  }

  // 设置新的条件
  currentCondition[addRule.attr][addRule.condition] = valueToUse

  // 更新 formData.condition
  formData.condition = JSON.stringify(currentCondition, null, 2)

  // 清空添加条件的表单
  addRule.attr = ""
  addRule.condition = ""
  addRule.value = ""

  ElMessage({
    message: "条件已添加",
    type: "success",
    offset: 0
  })
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return

    btnSubmit.loading = true
    // 处理提交的数据
    const submitData = { ...formData }
    if (!submitData.condition || submitData.condition.trim() === "\"\"") {
      ElMessage({
        message: "条件内容不能为空",
        type: "error",
        offset: 0
      })
      btnSubmit.loading = false
      return
    } else {
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
    width="600px"
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

      <el-row>
        <el-col :span="24">
          <el-form-item label="增加条件">
            <el-select v-model="addRule.attr" placeholder="产品属性" class="form-item" style="width: 100px;">
              <el-option
                v-for="ao in attrOptions"
                :key="ao.value"
                :label="ao.label"
                :value="ao.value"
              />
            </el-select>
            <el-select v-model="addRule.condition" placeholder="条件" class="form-item" style="width: 100px;">
              <el-option
                v-for="co in conditionOptions"
                :key="co.value"
                :label="co.label"
                :value="co.value"
              />
            </el-select>
            <el-input v-model="addRule.value" placeholder="值(逗号分割多个值)" class="form-item" style="width: 150px;" />
            <el-button type="primary" @click="handleAddRule">增加</el-button>
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
.form-item {
  display: inline-block;
  align-items: center;
  margin-right: 5px;
}
</style>

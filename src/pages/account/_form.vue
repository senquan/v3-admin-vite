<script lang="ts" setup>
import { createAccount, updateAccount } from "./apis"
import { ElMessage } from 'element-plus'

const emit = defineEmits(['success', 'close'])

const formData = reactive({
  id: 0,
  type: 2,
  subtype: 0,
  name: '',
  liquidity: 0,
  currency: 1,
  tagcode: '',
  remark: '',
  isDefault: false,
  isHidden: false,
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const types = ref<any>([])
const liquidity = ref<any>([])
const currency = ref<any>([])

const rules = {
  name: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择账户类型', trigger: 'change' }],
  liquidity: [{ required: true, message: '请选择流动性', trigger: 'change' }],
  currency: [{ required: true, message: '请选择货币', trigger: 'change' }]
}

const btnSubmit = reactive({
  loading: false,
})

function resetForm() {
  formData.id = 0
  formData.type = 0
  formData.name = ''
  formData.subtype = 0
  formData.tagcode = ''
  formData.currency = 0
  formData.remark = ''
  formData.isDefault = true
  formData.isHidden = false
}

function open(options = {
  types: Array<{ label: string, value: number }>,
  liquidity: Array<{ label: string, value: number }>,
  currency: Array<{ label: string, value: number }>,
  editData: null
}) {
  visible.value = true
  resetForm()

  // 先加载选项数据
  if (options.types) types.value = options.types
  if (options.liquidity) liquidity.value = options.liquidity
  if (options.currency) currency.value = options.currency

  if (options.editData) {
    isEdit.value = true
    Object.keys(options.editData).forEach(key => {
      if (key in formData) {
        (formData[key as keyof typeof formData] as any) = options.editData?.[key];
      }
    })
  } else {
    isEdit.value = false
    if (types.value.length > 0) {
      formData.type = types.value[0].value
    }
    if (liquidity.value.length > 0) {
      formData.liquidity = liquidity.value[0].value
    }
    if (currency.value.length > 0) {
      formData.currency = currency.value[0].value
    }
  }
}

function close() {
  visible.value = false
  emit('close')
}

function handleSubmit() {
  formRef.value.validate((valid: any) => {
    if (!valid) return

    btnSubmit.loading = true
    const request = isEdit.value
      ? updateAccount(formData.id, formData)
      : createAccount(formData)

    request.then(response => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? '账户已成功更新！' : '账户已成功创建！',
          type: 'success',
          offset: 0
        })
        emit('success')
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? '更新账户失败' : '创建账户失败'),
          type: 'error',
          offset: 0
        })
      }
    }).catch(error => {
      btnSubmit.loading = false
      ElMessage({
        message: '系统错误，请稍后重试',
        type: 'error',
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
    :title="isEdit ? '编辑账户' : '新增账户'"
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
          <el-form-item label="账户名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入账户名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="账户类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择账户类型">
              <el-option
                v-for="tp in types"
                :key="tp.value"
                :label="tp.label"
                :value="tp.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="流动性" prop="liquidity">
            <el-select v-model="formData.liquidity" placeholder="请选择流动性">
              <el-option
                v-for="lq in liquidity"
                :key="lq.value"
                :label="lq.label"
                :value="lq.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="货币类型" prop="currency">
            <el-select v-model="formData.currency" placeholder="请选择货币类型">
              <el-option
                v-for="cu in currency"
                :key="cu.value"
                :label="cu.label"
                :value="cu.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="账户标记" prop="tagcode">
            <el-input v-model="formData.tagcode"  placeholder="请输入账户标记" />
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
        <el-col :span="12">
          <el-form-item label="默认账户" prop="isDefault">
            <el-switch v-model="formData.isDefault" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否隐藏" prop="isHidden">
            <el-switch v-model="formData.isHidden" />
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="handleSubmit">
          提交
        </el-button>
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
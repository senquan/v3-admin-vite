<script lang="ts" setup>
import areaData from "china-area-data"
import { ElMessage } from "element-plus"
import { createCustomer, updateCustomer } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = ref({
  id: 0,
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  cityId: 0,
  provinceId: 0,
  districtId: 0,
  postalCode: "",
  country: "中国",
  contactPerson: "",
  contactPhone: "",
  contactPosition: "",
  type: 1,
  level: 1,
  companyName: "",
  taxNumber: "",
  remark: "",
  salesRepId: null,
  isActive: 1
})

// 地区选择相关
const selectedArea = ref<any>([]) // 存储选中的省市区编码
const areaOptions = ref<any>([]) // 省市区选项数据

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)

const rules = {
  name: [{ required: true, message: "请输入客户名称", trigger: "blur" }],
  phone: [{ required: true, message: "请输入联系电话", trigger: "blur" }],
  email: [{ required: true, message: "请输入邮箱", trigger: "blur" }]
}

const btnSubmit = reactive({
  loading: false
})

// 初始化省市区数据
function initAreaData() {
  const provinces = areaData["86"]
  areaOptions.value = Object.keys(provinces).map((provinceId) => {
    const cities = areaData[provinceId]
    return {
      value: provinceId,
      label: provinces[provinceId],
      children: cities
        ? Object.keys(cities).map((cityId) => {
            const districts = areaData[cityId]
            return {
              value: cityId,
              label: cities[cityId],
              children: districts
                ? Object.keys(districts).map((districtId) => {
                    return {
                      value: districtId,
                      label: districts[districtId]
                    }
                  })
                : []
            }
          })
        : []
    }
  })
}

function handleAreaChange(value: any) {
  if (value && value.length > 0) {
    const numValue = value.map((item: any) => Number(item))
    formData.value.provinceId = numValue[0] || ""
    formData.value.cityId = numValue[1] || ""
    formData.value.districtId = numValue[2] || ""
  } else {
    formData.value.provinceId = 0
    formData.value.cityId = 0
    formData.value.districtId = 0
  }
}

function open(options = {
  id: 0,
  editData: null
}) {
  visible.value = true
  resetForm()
  if (options.editData) {
    isEdit.value = true
    Object.keys(options.editData).forEach((key) => {
      if (key in formData.value) {
        (formData.value as any)[key] = (options.editData as any)[key]
      }
    })
    // 如果有省市区编码，设置级联选择器的值
    if (formData.value.provinceId) {
      const areaValues = []
      if (formData.value.provinceId) areaValues.push(`${formData.value.provinceId}`)
      if (formData.value.cityId) areaValues.push(`${formData.value.cityId}`)
      if (formData.value.districtId) areaValues.push(`${formData.value.districtId}`)
      selectedArea.value = areaValues
    }
  } else {
    isEdit.value = false
  }
}

function resetForm() {
  formData.value = {
    id: 0,
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    cityId: 0,
    provinceId: 0,
    districtId: 0,
    postalCode: "",
    country: "中国",
    contactPerson: "",
    contactPhone: "",
    contactPosition: "",
    type: 1,
    level: 1,
    companyName: "",
    taxNumber: "",
    remark: "",
    salesRepId: null,
    isActive: 1
  }
  selectedArea.value = []
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

    btnSubmit.loading = true
    const request = isEdit.value ? updateCustomer(formData.value.id, formData.value) : createCustomer(formData.value)
    request.then((response: any) => {
      btnSubmit.loading = false
      if (response.code === 0) {
        visible.value = false
        ElMessage({
          message: isEdit.value ? `客户已成功更新！` : `客户已成功创建！`,
          type: "success",
          offset: 0
        })
        emit("success")
      } else {
        ElMessage({
          message: response.message || (isEdit.value ? `更新客户失败` : `创建客户失败`),
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

onMounted(() => {
  initAreaData()
})

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`${isEdit ? '编辑' : '创建'}客户`"
    width="50%"
    :before-close="close"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入客户名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入客户编号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="客户类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择客户类型">
              <el-option label="个人客户" :value="1" />
              <el-option label="企业客户" :value="2" />
              <el-option label="经销商" :value="3" />
              <el-option label="合作伙伴" :value="4" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户等级" prop="level">
            <el-select v-model="formData.level" placeholder="请选择客户等级">
              <el-option label="普通客户" :value="1" />
              <el-option label="银牌客户" :value="2" />
              <el-option label="金牌客户" :value="3" />
              <el-option label="白金客户" :value="4" />
              <el-option label="VIP客户" :value="5" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type === 2 || formData.type === 3 || formData.type === 4">
        <el-col :span="12">
          <el-form-item label="公司名称" prop="companyName">
            <el-input v-model="formData.companyName" placeholder="请输入公司名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="税号" prop="taxNumber">
            <el-input v-model="formData.taxNumber" placeholder="请输入税号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type === 2 || formData.type === 3 || formData.type === 4">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系人电话" prop="contactPhone">
            <el-input v-model="formData.contactPhone" placeholder="请输入联系人电话" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="formData.type === 2 || formData.type === 3 || formData.type === 4">
        <el-col :span="12">
          <el-form-item label="联系人职位" prop="contactPosition">
            <el-input v-model="formData.contactPosition" placeholder="请输入联系人职位" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="8">
          <el-form-item label="所在地区" prop="area">
            <el-cascader
              v-model="selectedArea"
              :options="areaOptions"
              :props="{ expandTrigger: 'hover' }"
              @change="handleAreaChange"
              placeholder="请选择省/市/区"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="邮政编码" prop="postalCode">
            <el-input v-model="formData.postalCode" placeholder="请输入邮政编码" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="国家" prop="country">
            <el-input v-model="formData.country" placeholder="请输入国家" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="联系地址" prop="address">
            <el-input v-model="formData.address" placeholder="请输入联系地址" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12" v-if="isEdit">
          <el-form-item label="状态" prop="isActive">
            <el-radio-group v-model="formData.isActive">
              <el-radio :value="1">启用</el-radio>
              <el-radio :value="0">禁用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="5" placeholder="请输入备注信息" />
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

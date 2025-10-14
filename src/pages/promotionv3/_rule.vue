<script lang="ts" setup>
import type { PromotionRule } from "@@/utils/pricing-types"
import { RuleBuilder } from "@@/utils/rule-builder"
import { ElMessage } from "element-plus"
import { fetchList as fetchProducts } from "../product/apis"
import { createRule, fetchRule, updateRule } from "./apis"

const emit = defineEmits(["success", "close"])

// 表单数据结构
const formData = reactive<any>({
  id: 0,
  name: "",
  promotionId: 0,
  description: "",
  scope: "product",
  priority: 100,
  exclusive: false,
  contents: {}
})

// 折扣策略
const discountStrategy = reactive<{
  type: "percentage" | "fixed" | "specialPrice" | "tieredReduction" | "buyXGetY" | "bundle"
  value: number
  tieredConfig?: {
    tiers: Array<{ threshold: number, discount: number }>
  }
  buyXGetYConfig?: {
    buyQuantity: number
    getQuantity: number
    getProductIds: number[]
  }
  bundleConfig?: {
    requiredProducts: { productId: number, productName: string, quantity: number }[]
    discountType: "percentage" | "fixed"
    discountValue: number
  }
}>({
  type: "percentage",
  value: 0
})

// 商品条件
const productConditions = reactive<Record<string, Record<string, string>>>({})

// 订单条件
const orderConditions = reactive<Record<string, Record<string, string>>>({})

// 添加条件的临时数据
const addCondition = reactive({
  type: "product", // product | order
  attr: "",
  operator: "",
  value: ""
})

// 阶梯配置
const tieredTiers = ref<Array<{ threshold: number, discount: number, subjectType?: "amount" | "quantity", discountType?: "fixed" | "percentage" | "every" }>>([])
const newTier = reactive({ threshold: 0, discount: 0, every: 0, subjectType: "amount" as "amount" | "quantity", discountType: "fixed" as "fixed" | "percentage" | "every" })

// 买X送Y配置
const buyXGetYConfig = reactive({
  buyQuantity: 2,
  getQuantity: 1,
  getProductIds: [] as number[]
})

// 套装配置
const bundleProducts = ref<Array<{ productId: number, productName: string, quantity: number }>>([])
const newBundleProduct = reactive({ productId: 0, productName: "", quantity: 1 })
const bundleDiscountConfig = reactive({
  discountType: "fixed" as "percentage" | "fixed",
  discountValue: 0
})

const formRef = ref()
const visible = ref(false)
const isEdit = ref(false)
const productLoading = ref(false)
const productOptions = ref<any>([])
const loading = ref(false)

// 选项配置
const scopeOptions = [
  { label: "商品级", value: "product" },
  { label: "订单级", value: "order" },
  { label: "全局级", value: "global" }
]

const discountTypeOptions = [
  { label: "百分比折扣", value: "percentage" },
  { label: "固定金额折扣", value: "fixed" },
  { label: "特价", value: "specialPrice" },
  { label: "阶梯满减", value: "tieredReduction" },
  { label: "买X送Y", value: "buyXGetY" },
  { label: "套装优惠", value: "bundle" }
]

const productAttrOptions = [
  { label: "商品名", value: "name" },
  { label: "系列", value: "series" },
  { label: "颜色", value: "color" },
  { label: "型号", value: "modelType" },
  { label: "基础价格", value: "basePrice" },
  { label: "工程价格", value: "projectPrice" },
  { label: "数量", value: "quantity" }
]

const orderAttrOptions = [
  { label: "订单总金额", value: "totalAmount" },
  { label: "订单总数量", value: "totalQuantity" },
  { label: "商品种类数", value: "productCount" }
]

const numberOperatorOptions = [
  { label: "等于", value: "equal" },
  { label: "不等于", value: "notEqual" },
  { label: "大于", value: "greaterThan" },
  { label: "大于等于", value: "greaterThanOrEqual" },
  { label: "小于", value: "lessThan" },
  { label: "小于等于", value: "lessThanOrEqual" }
]

const stringOperatorOptions = [
  { label: "等于", value: "equal" },
  { label: "不等于", value: "notEqual" },
  { label: "包含", value: "in" },
  { label: "不包含", value: "notIn" },
  { label: "包含文本", value: "contains" },
  { label: "不包含文本", value: "notContains" },
  { label: "模糊匹配", value: "like" }
]

const operatorOptions = ref<{ label: string, value: string }[]>([])

const rules = {
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  priority: [
    { required: true, message: "请输入优先级", trigger: "blur" },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!/^\d+$/.test(String(value)) || value < 1 || value > 1000) {
          callback(new Error("优先级必须为1-1000的整数"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ]
}

const btnSubmit = reactive({
  loading: false
})

// 重置表单
function resetForm() {
  formData.id = 0
  formData.name = ""
  formData.description = ""
  formData.scope = "product"
  formData.priority = 100
  formData.exclusive = false
  formData.startTime = ""
  formData.endTime = ""
  formData.contents = {}

  // 重置配置数据
  discountStrategy.type = "percentage"
  discountStrategy.value = 0
  tieredTiers.value = []
  bundleProducts.value = []
  for (const key in productConditions) {
    delete productConditions[key]
  }
  for (const key in orderConditions) {
    delete orderConditions[key]
  }
  Object.assign(buyXGetYConfig, { buyQuantity: 2, getQuantity: 1, getProductIds: [] })
  Object.assign(bundleDiscountConfig, { discountType: "percentage", discountValue: 0 })
}

function open(options = {
  promotionId: 0,
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0
  resetForm()
  if (isEdit.value) {
    loading.value = true
    fetchRule(options.id).then((response) => {
      if (response.code === 0) {
        const data = response.data
        // 映射数据到新的结构
        Object.assign(formData, {
          id: data.id || 0,
          name: data.name || "",
          promotionId: data.promotionId || 0,
          description: data.description || "",
          priority: data.priority || 100,
          exclusive: data.exclusive === 1,
          contents: data.contents || {} as PromotionRule
        })

        // console.log("formData", formData)

        // 如果有contents字段，解析JSON并填充表单
        if (formData.contents) {
          loadFromRuleData(formData.contents)
        }
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
    }).finally(() => {
      loading.value = false
    })
  } else {
    formData.promotionId = options.promotionId
  }
}

function close() {
  visible.value = false
  emit("close")
}

// 从规则数据加载表单
function loadFromRuleData(ruleData: PromotionRule) {
  // console.log("ruleData", ruleData)
  // 更新基本信息
  if (ruleData.scope) formData.scope = ruleData.scope
  if (ruleData.startTime) formData.startTime = ruleData.startTime
  if (ruleData.endTime) formData.endTime = ruleData.endTime

  // 更新商品条件
  if (ruleData.productConditions) {
    Object.assign(productConditions, ruleData.productConditions)
  }

  // 更新订单条件
  if (ruleData.orderConditions) {
    Object.assign(orderConditions, ruleData.orderConditions)
  }

  // 更新折扣策略
  if (ruleData.discountStrategy) {
    Object.assign(discountStrategy, ruleData.discountStrategy)
    loadDiscountConfig()
  }

  // 更新标签和元数据
  if (ruleData.tags) {
    formData.tags = [...ruleData.tags]
  }
  if (ruleData.metadata) {
    formData.metadata = { ...ruleData.metadata }
  }
}

// 加载折扣配置
function loadDiscountConfig() {
  if (discountStrategy.type === "tieredReduction" && discountStrategy.tieredConfig) {
    tieredTiers.value = discountStrategy.tieredConfig.tiers || []
  } else if (discountStrategy.type === "buyXGetY" && discountStrategy.buyXGetYConfig) {
    Object.assign(buyXGetYConfig, discountStrategy.buyXGetYConfig)
  } else if (discountStrategy.type === "bundle" && discountStrategy.bundleConfig) {
    bundleProducts.value = discountStrategy.bundleConfig.requiredProducts || []
    Object.assign(bundleDiscountConfig, {
      discountType: discountStrategy.bundleConfig.discountType,
      discountValue: discountStrategy.bundleConfig.discountValue
    })
  }
}

// 添加商品条件
function handleAddProductCondition() {
  if (!addCondition.attr || !addCondition.operator || addCondition.value === "") {
    ElMessage({ message: "请完整填写条件信息", type: "warning" })
    return
  }

  if (!productConditions[addCondition.attr]) {
    productConditions[addCondition.attr] = {}
  }

  productConditions[addCondition.attr][addCondition.operator] = addCondition.value

  // 重置添加条件表单
  addCondition.attr = ""
  addCondition.operator = ""
  addCondition.value = ""
}

// 删除商品条件
function handleRemoveProductCondition(attr: string, operator: string) {
  if (productConditions[attr]) {
    delete productConditions[attr][operator]
    if (Object.keys(productConditions[attr]).length === 0) {
      delete productConditions[attr]
    }
  }
}

// 添加订单条件
function handleAddOrderCondition() {
  if (!addCondition.attr || !addCondition.operator || addCondition.value === "") {
    ElMessage({ message: "请完整填写条件信息", type: "warning" })
    return
  }

  if (!orderConditions[addCondition.attr]) {
    orderConditions[addCondition.attr] = {}
  }

  orderConditions[addCondition.attr][addCondition.operator] = addCondition.value

  // 重置添加条件表单
  addCondition.attr = ""
  addCondition.operator = ""
  addCondition.value = ""
}

// 删除订单条件
function handleRemoveOrderCondition(attr: string, operator: string) {
  if (orderConditions && orderConditions[attr]) {
    delete orderConditions[attr][operator]
    if (Object.keys(orderConditions[attr]).length === 0) {
      delete orderConditions[attr]
    }
  }
}

// 阶梯折扣管理
function handleAddTier() {
  if (!newTier.threshold || !newTier.discount) {
    ElMessage({ message: "请填写完整的阶梯信息", type: "warning" })
    return
  }

  if (newTier.discountType === "every") {
    if (tieredTiers.value.length > 0) {
      ElMessage({ message: "每单位折扣只能有一个阶梯，请先删除现有阶梯", type: "warning" })
      return
    }
  }

  tieredTiers.value.push({ ...newTier })
  newTier.threshold = 0
  newTier.discount = 0
  newTier.every = 0
  newTier.discountType = "fixed"
  newTier.subjectType = "amount"
  updateTieredConfig()
}

function handleDeleteTier(index: number) {
  tieredTiers.value.splice(index, 1)
  updateTieredConfig()
}

function updateTieredConfig() {
  if (discountStrategy.type === "tieredReduction") {
    tieredTiers.value.sort((a, b) => a.threshold - b.threshold)
    discountStrategy.tieredConfig = {
      tiers: tieredTiers.value
    }
  }
}

// 买X送Y配置管理
function updateBuyXGetYConfig() {
  if (discountStrategy.type === "buyXGetY") {
    discountStrategy.buyXGetYConfig = { ...buyXGetYConfig }
  }
}

// 套装折扣管理
function handleAddBundleProduct() {
  if (!newBundleProduct.productId || !newBundleProduct.quantity) {
    ElMessage({ message: "请填写完整的商品信息", type: "warning" })
    return
  }

  const product = productOptions.value.find((p: { id: number, name: string }) => p.id === newBundleProduct.productId)
  if (product) {
    newBundleProduct.productName = product.name
  }
  bundleProducts.value.push({ ...newBundleProduct })
  newBundleProduct.productId = 0
  newBundleProduct.productName = ""
  newBundleProduct.quantity = 1
  updateBundleConfig()
}

function handleDeleteBundleProduct(index: number) {
  bundleProducts.value.splice(index, 1)
  updateBundleConfig()
}

function updateBundleConfig() {
  if (discountStrategy.type === "bundle") {
    discountStrategy.bundleConfig = {
      requiredProducts: bundleProducts.value,
      discountType: bundleDiscountConfig.discountType,
      discountValue: bundleDiscountConfig.discountValue
    }
  }
}

function handleSubmit() {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      btnSubmit.loading = true

      // 验证时间范围
      if (formData.startTime && formData.endTime) {
        if (new Date(formData.startTime) >= new Date(formData.endTime)) {
          ElMessage({
            message: "开始时间必须早于结束时间",
            type: "error",
            offset: 0
          })
          btnSubmit.loading = false
          return
        }
      }

      // 验证折扣策略配置
      if (discountStrategy.type === "tieredReduction" && (!discountStrategy.tieredConfig || !discountStrategy.tieredConfig.tiers.length)) {
        ElMessage({
          message: "阶梯满减规则必须配置阶梯信息",
          type: "error",
          offset: 0
        })
        btnSubmit.loading = false
        return
      }

      if (discountStrategy.type === "buyXGetY" && (!discountStrategy.buyXGetYConfig || !discountStrategy.buyXGetYConfig.buyQuantity)) {
        ElMessage({
          message: "买X送Y规则必须配置购买数量",
          type: "error",
          offset: 0
        })
        btnSubmit.loading = false
        return
      }

      if (discountStrategy.type === "bundle" && (!discountStrategy.bundleConfig || !discountStrategy.bundleConfig.requiredProducts.length)) {
        ElMessage({
          message: "套装折扣规则必须配置套装商品",
          type: "error",
          offset: 0
        })
        btnSubmit.loading = false
        return
      }

      if (["percentage", "fixed", "specialPrice"].includes(discountStrategy.type)) {
        if (!discountStrategy.value || !/^-?\d+(\.\d+)?$/.test(String(discountStrategy.value))) {
          ElMessage({
            message: "折扣值必须是数字",
            type: "error",
            offset: 0
          })
          btnSubmit.loading = false
          return
        }
        if (discountStrategy.type === "percentage" && (discountStrategy.value > 100 || discountStrategy.value < -100)) {
          ElMessage({
            message: "百分比折扣值不能大于100%或者小于-100%",
            type: "error",
            offset: 0
          })
          btnSubmit.loading = false
          return
        }
      }

      // 使用RuleBuilder构建规则并生成JSON
      const ruleBuilder = new RuleBuilder()
        .setBasicInfo(formData.id || 0, formData.name, formData.description)
        .setPriority(formData.priority)
        .setScope(formData.scope)
        .setExclusive(formData.exclusive)

      // 设置时间范围
      if (formData.startTime && formData.endTime) {
        ruleBuilder.setTimeRange(formData.startTime, formData.endTime)
      }

      // 添加商品条件
      if (productConditions && Object.keys(productConditions).length > 0) {
        ruleBuilder.setProductConditions(productConditions)
      }

      // 添加订单条件
      if (orderConditions && Object.keys(orderConditions).length > 0) {
        ruleBuilder.setOrderConditions(orderConditions)
      }

      // 设置折扣策略
      switch (discountStrategy.type) {
        case "percentage":
          ruleBuilder.setPercentageDiscount(discountStrategy.value)
          break
        case "fixed":
          ruleBuilder.setFixedDiscount(discountStrategy.value)
          break
        case "specialPrice":
          ruleBuilder.setSpecialPrice(discountStrategy.value)
          break
        case "tieredReduction":
          if (discountStrategy.tieredConfig && discountStrategy.tieredConfig.tiers.length > 0) {
            ruleBuilder.setTieredReduction(discountStrategy.tieredConfig)
          }
          break
        case "buyXGetY":
          if (discountStrategy.buyXGetYConfig) {
            ruleBuilder.setBuyXGetY(discountStrategy.buyXGetYConfig)
          }
          break
        case "bundle":
          if (discountStrategy.bundleConfig && discountStrategy.bundleConfig.requiredProducts.length > 0) {
            ruleBuilder.setBundleDiscount(discountStrategy.bundleConfig)
          }
          break
      }

      // 生成规则JSON
      const ruleJSON = ruleBuilder.toJSON()
      console.log(ruleJSON)
      // 构建提交数据
      const submitData = {
        ...formData,
        contents: ruleJSON
      }

      const api = isEdit.value ? updateRule(formData.id, submitData) : createRule(submitData)
      api.then((response) => {
        if (response.code === 0) {
          ElMessage({
            message: isEdit.value ? "更新成功" : "创建成功",
            type: "success",
            offset: 0
          })
          close()
          emit("success")
        } else {
          ElMessage({
            message: response.message || (isEdit.value ? "更新失败" : "创建失败"),
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
      }).finally(() => {
        btnSubmit.loading = false
      })
    }
  })
}

// 折扣类型变更处理
function handleDiscountTypeChange() {
  // 清空之前的配置
  delete discountStrategy.tieredConfig
  delete discountStrategy.buyXGetYConfig
  delete discountStrategy.bundleConfig

  // 重置相关数据
  tieredTiers.value = []
  bundleProducts.value = []
  productOptions.value = []
  Object.assign(buyXGetYConfig, { buyQuantity: 2, getQuantity: 1, getProductIds: [] })
  Object.assign(bundleDiscountConfig, { discountType: "fixed", discountValue: 0 })
  Object.assign(newBundleProduct, { productId: 0, productName: "", quantity: 1 })
}

//
async function handleSearchProduct(value: string) {
  try {
    if (value.length < 2) return
    productLoading.value = true
    fetchProducts({ keyword: value }).then((response: any) => {
      if (response.code === 0) {
        const productData = response.data.products
        productData.forEach((product: any) => {
          productOptions.value.push({
            id: product.id,
            name: `${product.color?.name || "默认色"}:${product.name}`
          })
        })
        productLoading.value = false
      } else {
        ElMessage.error(`获取产品列表失败: ${response.message}`)
      }
    }).finally(() => {
      productLoading.value = false
    })
  } catch (error) {
    ElMessage.error(`获取产品信息失败，请重试：${error}`)
  }
}

// 属性变更处理
function handleAttrChange() {
  if (["basePrice", "projectPrice", "quantity", "totalAmount", "totalQuantity", "productCount"].includes(addCondition.attr)) {
    operatorOptions.value = numberOperatorOptions
  } else {
    operatorOptions.value = stringOperatorOptions
  }
}

// 作用范围变更处理
function handleScopeChange() {
  // 清空之前的条件
  productConditions.value = {}
  orderConditions.value = {}

  // 重置相关数据
  addCondition.attr = ""
  addCondition.operator = ""
  addCondition.value = ""
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑规则' : '新增规则'"
    width="800px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :loading="loading"
      label-width="120px"
      label-position="left"
    >
      <!-- 基本信息 -->
      <el-card class="form-card" header="基本信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排他性">
              <el-switch v-model="formData.exclusive" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="规则描述">
              <el-input v-model="formData.description" placeholder="请输入规则描述" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作用范围" prop="scope">
              <el-select
                v-model="formData.scope"
                placeholder="选择作用范围"
                @change="handleScopeChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in scopeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-input-number
                v-model="formData.priority"
                :min="1"
                :max="1000"
                placeholder="1-1000"
                style="width: 50%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 折扣策略 -->
      <el-card class="form-card" header="折扣策略">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折扣类型">
              <el-select
                v-model="discountStrategy.type"
                placeholder="选择折扣类型"
                style="width: 60%"
                @change="handleDiscountTypeChange"
              >
                <el-option
                  v-for="item in discountTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              v-if="['percentage', 'fixed', 'specialPrice'].includes(discountStrategy.type)"
              label="折扣值"
              prop="discountStrategy.value"
            >
              <el-input
                v-model="discountStrategy.value"
                :min="-100"
                :max="discountStrategy.type === 'percentage' ? 100 : 999999"
                placeholder="请输入折扣值"
                style="width: 50%"
              />
              <span v-if="discountStrategy.type === 'percentage'" style="margin-left: 8px">%</span>
              <span v-else style="margin-left: 8px">元</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 阶梯满减配置 -->
        <div v-if="discountStrategy.type === 'tieredReduction'">
          <el-divider content-position="left">阶梯配置</el-divider>
          <el-row :gutter="20" style="margin-bottom: 16px; align-items: center; display: flex;">
            <el-col :span="4">
              <el-select
                v-model="newTier.discountType"
                placeholder="选择类型"
                style="width: 100%"
              >
                <el-option :key="1" label="固定金额" value="fixed" />
                <el-option :key="2" label="百分比" value="percentage" />
                <el-option :key="3" label="每单位" value="every" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select
                v-model="newTier.subjectType"
                placeholder="选择减免对象"
                style="width: 100%"
              >
                <el-option :key="1" label="金额" value="amount" />
                <el-option :key="2" label="数量" value="quantity" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <span>门槛：</span>
              <el-input
                v-model="newTier.threshold"
                :min="0"
                style="width: 80px"
              />
            </el-col>
            <el-col :span="7">
              <span>减免：</span>
              <el-input
                v-model="newTier.discount"
                :min="0"
                style="width: 60px"
              />
              <span v-if="newTier.discountType === 'percentage'" style="margin-left: 8px">%</span>
              <span v-if="newTier.discountType === 'every'" style="margin-left: 8px">每</span>
              <el-input
                v-if="newTier.discountType === 'every'"
                v-model="newTier.every"
                :min="0"
                style="width: 60px; margin-left: 8px"
              />
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="handleAddTier">添加阶梯</el-button>
            </el-col>
          </el-row>
          <el-table :data="tieredTiers" border>
            <el-table-column prop="discountType" label="类型" width="150" align="center">
              <template #default="{ row }">
                {{ row.discountType === 'fixed' ? '固定金额' : (row.discountType === 'percentage' ? '百分比' : '每单位') }}
              </template>
            </el-table-column>
            <el-table-column prop="subjectType" label="对象" width="150" align="center">
              <template #default="{ row }">
                {{ row.subjectType === 'amount' ? '金额' : '数量' }}
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="门槛" width="120" align="center" />
            <el-table-column prop="discount" label="减免额" width="120" align="center">
              <template #default="{ row }">{{ row.discountType === 'percentage'
                ? `${row.discount} %`
                : row.discountType === 'every'
                  ? `${row.discount} / ${row.every}`
                  : row.discount
              }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="100" align="center">
              <template #default="{ $index }">
                <el-button type="danger" size="small" @click="handleDeleteTier($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 买X送Y配置 -->
        <div v-if="discountStrategy.type === 'buyXGetY'">
          <el-divider content-position="left">买X送Y配置</el-divider>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="购买数量">
                <el-input-number
                  v-model="buyXGetYConfig.buyQuantity"
                  :min="1"
                  style="width: 100%"
                  @change="updateBuyXGetYConfig"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="赠送数量" style="margin-left: -30px;">
                <el-input-number
                  v-model="buyXGetYConfig.getQuantity"
                  :min="1"
                  style="width: 100%"
                  @change="updateBuyXGetYConfig"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="赠送商品">
                <el-select
                  v-model="buyXGetYConfig.getProductIds"
                  multiple
                  filterable
                  remote
                  placeholder="可选择多个商品"
                  :reserve-keyword="false"
                  :remote-method="handleSearchProduct"
                  :loading="productLoading"
                  @change="updateBuyXGetYConfig"
                >
                  <el-option
                    v-for="p in productOptions"
                    :key="p.id"
                    :label="p.name"
                    :value="p.id"
                  >
                    {{ p.name }}
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 套装折扣配置 -->
        <div v-if="discountStrategy.type === 'bundle'">
          <el-divider content-position="left">套装商品配置</el-divider>
          <el-row :gutter="20" style="margin-bottom: 16px">
            <el-col :span="10">
              <el-select
                v-model="newBundleProduct.productId"
                filterable
                remote
                placeholder="选择商品"
                :empty-values="[0]"
                :value-on-clear="0"
                :reserve-keyword="false"
                :remote-method="handleSearchProduct"
                :loading="productLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="p in productOptions"
                  :key="p.id"
                  :label="p.name"
                  :value="p.id"
                >
                  {{ p.name }}
                </el-option>
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-input-number
                v-model="newBundleProduct.quantity"
                placeholder="数量"
                :min="1"
                style="width: 80%"
              />
            </el-col>
            <el-col :span="8">
              <el-button type="primary" @click="handleAddBundleProduct">添加商品</el-button>
            </el-col>
          </el-row>
          <el-table :data="bundleProducts" border>
            <el-table-column prop="productId" label="商品编号" width="100" align="center" />
            <el-table-column prop="productName" label="商品名称" min-width="200" />
            <el-table-column prop="quantity" label="数量" width="100" align="center" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ $index }">
                <el-button type="danger" size="small" @click="handleDeleteBundleProduct($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-divider content-position="left">套装折扣</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="折扣类型">
                <el-select
                  v-model="bundleDiscountConfig.discountType"
                  style="width: 100%"
                  @change="updateBundleConfig"
                >
                  <el-option label="固定金额" value="fixed" />
                  <el-option label="百分比" value="percentage" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="折扣值">
                <el-input-number
                  v-model="bundleDiscountConfig.discountValue"
                  :min="0"
                  :max="bundleDiscountConfig.discountType === 'percentage' ? 100 : 999999"
                  style="width: 60%"
                  @change="updateBundleConfig"
                />
                <span v-if="bundleDiscountConfig.discountType === 'percentage'" style="margin-left: 8px">%</span>
                <span v-else style="margin-left: 8px">元</span>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 商品条件 -->
      <el-card v-if="formData.scope === 'product'" class="form-card" header="商品条件 (可选)">
        <div style="margin-bottom: 16px">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-select
                v-model="addCondition.attr"
                placeholder="选择属性"
                @change="handleAttrChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in productAttrOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="addCondition.operator" placeholder="选择操作符" style="width: 100%">
                <el-option
                  v-for="item in operatorOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input v-model="addCondition.value" placeholder="输入值，多个值使用,分隔" />
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="handleAddProductCondition">添加</el-button>
            </el-col>
          </el-row>
        </div>
        <div v-for="(items, attr) in productConditions" :key="attr">
          <div v-for="(_, operator) in items" :key="operator">
            {{ attr }} {{ operator }}
            <el-input
              v-model="items[operator]"
              style="width: 65%; margin-bottom: 8px;"
            />
            <el-button type="danger" size="small" circle @click="handleRemoveProductCondition(attr, operator)" style="margin-left: 8px; margin-bottom: 8px;">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 订单条件 -->
      <el-card v-if="formData.scope === 'order'" class="form-card" header="订单条件 (可选)">
        <div style="margin-bottom: 16px">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-select
                v-model="addCondition.attr"
                placeholder="选择属性"
                @change="handleAttrChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in orderAttrOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="addCondition.operator" placeholder="选择操作符" style="width: 100%">
                <el-option
                  v-for="item in operatorOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input v-model="addCondition.value" placeholder="输入值" />
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="handleAddOrderCondition">添加</el-button>
            </el-col>
          </el-row>
        </div>
        <div v-for="(items, attr) in orderConditions" :key="attr">
          <div v-for="(_, operator) in items" :key="operator">
            {{ attr }} {{ operator }}
            <el-input
              v-model="items[operator]"
              style="width: 65%; margin-bottom: 8px;"
            />
            <el-button type="danger" size="small" circle @click="handleRemoveOrderCondition(attr, operator)" style="margin-left: 8px; margin-bottom: 8px;">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="btnSubmit.loading" @click="handleSubmit">
          {{ isEdit ? "更新" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-card {
  margin-bottom: 20px;
}

.form-card :deep(.el-card__header) {
  background-color: #f5f7fa;
  font-weight: 600;
}

.form-card :deep(.el-form-item__label) {
  justify-content: end;
}

.dialog-footer {
  text-align: right;
}

.el-tag {
  margin: 4px;
}

.el-divider {
  margin: 16px 0;
}

.el-table {
  margin-top: 16px;
}

.form-item {
  display: inline-block;
  align-items: center;
  margin-right: 10px;
}

:deep(.el-tag__content) {
  font-size: 14px;
  line-height: 20px;
  white-space: wrap;
}

.warning-border {
  --el-input-border-color: #e6a23c !important;
}
</style>

<script lang="ts" setup>
import { parseTime } from "@/common/utils/datetime"
import { findCascaderPath, getCascaderOptions } from "@/common/utils/helper"
import { Download } from "@element-plus/icons-vue"
import { fetchList as fetchEventList } from "../event/apis"
import { fetchList as fetchTags } from "../tag/apis"
import { fetchDetail as fetchTemplateDetail } from "../template/apis"
import { createRecord, fetchDetail, fetchList as fetchRecordList, updateRecord } from "./apis"

const emit = defineEmits(["success", "close"])

const formData = reactive({
  id: 0,
  templateId: 0,
  title: "",
  remark: "",
  amount: 0,
  amountIn: 0,
  logTime: "",
  categoryId: 0,
  accountFrom: 0,
  accountTo: 0,
  tags: [] as number[],
  events: [] as number[],
  options: [] as string[]
})
const cascaderOptions = ref({
  template: [] as number[],
  category: [] as number[],
  accountFrom: [] as number[],
  accountTo: [] as number[]
})
const isEdit = ref(false)
const tagsAccount = [70, 115, 130]

const visibleInit = {
  category_id: true,
  account_from: true,
  account_to: true,
  title: true,
  remark: true,
  amount: true,
  amountIn: false,
  log_time: true,
  events: false,
  options: false,
  tags: false
}
const formVisible = ref({ ...visibleInit })
const templates = ref<any>([])
const categories = ref<any>([])
const accounts = ref<any>([])
const accountInfo = ref<Map<number, any>>(new Map())
const visible = ref(false)
const tagsLoading = ref(false)
const templateDisabled = ref(false)

const btnSubmit = reactive({
  loading: false,
  text: {
    false: "提交",
    true: "提交中"
  }
})

const tagOptions = ref<any>([])
const selectedTags = ref<any>([])
const eventOptions = ref<any>([])
const selectedEvents = ref<any>([])

const rules = ref({
  templateId: [{
    required: true,
    message: "请选择记账模板",
    trigger: "change"
  }],
  categoryId: [{
    required: formVisible.value.category_id,
    message: "请选择分类",
    trigger: "change"
  }],
  accountFrom: [{
    required: formVisible.value.account_from,
    message: "请选择账户",
    trigger: "change"
  }],
  accountTo: [{
    required: formVisible.value.account_to,
    message: "请选择账户",
    trigger: "change"
  }],
  title: [
    { required: formVisible.value.title, message: "请输入事项", trigger: "blur" }
  ],
  amount: [
    { required: formVisible.value.amount, message: "请输入金额", trigger: "blur" }
  ],
  logTime: [
    { required: formVisible.value.log_time, message: "请选择交易时间", trigger: "change" }
  ]
})

// 在open方法中添加标签数据的接收
function open(options = {
  templates: [],
  categories: [],
  accounts: [],
  tags: [],
  events: [],
  id: 0
}) {
  visible.value = true
  isEdit.value = options.id > 0
  // 如果传入了数据，则使用传入的数据
  if (options.templates) templates.value = options.templates
  if (options.categories) categories.value = options.categories
  if (options.accounts) {
    accounts.value = getCascaderOptions(options.accounts, 0)
    accountInfo.value.clear()
    options.accounts.forEach((item: any, index: number) => {
      if (index > 0 && Array.isArray(item)) {
        item.forEach((i: any) => {
          accountInfo.value.set(i.id, i)
        })
      }
    })
  }
  if (options.tags) selectedTags.value = options.tags
  if (options.events) selectedEvents.value = options.events

  if (isEdit.value) {
    templateDisabled.value = true
    fetchDetail(options.id).then((response) => {
      if (response.code === 0) {
        const data = response.data
        Object.keys(data).forEach((key) => {
          if (key in formData) {
            if (key in data && key in formData) {
              (formData[key as keyof typeof formData] as any) = data[key as keyof typeof data]
            }
          }
        })
        cascaderOptions.value.template = findCascaderPath(templates.value, data.templateId) || [data.templateId]
        cascaderOptions.value.category = findCascaderPath(categories.value, data.categoryId) || [data.categoryId]
        cascaderOptions.value.accountFrom = findCascaderPath(accounts.value, data.accountFrom) || [data.accountFrom]
        cascaderOptions.value.accountTo = data.accountTo ? findCascaderPath(accounts.value, data.accountTo) || [data.accountTo] : []
        resetVisible()
        if (!data.accountTo) formVisible.value.account_to = false
        if (data.tags.length > 0) {
          formVisible.value.tags = true
          tagOptions.value = data.tagNames.map((tag: string, idx: number) => ({
            id: data.tags[idx],
            name: tag
          }))
          selectedTags.value = data.tags
        }
        if (!data.categoryId) formVisible.value.category_id = false
      }
    })
  } else {
    resetForm()
    selectedTags.value = []
    selectedEvents.value = []
    resetOptions()
    resetVisible()
  }
}

function resetForm() {
  // 重置表单数据
  Object.assign(formData, {
    id: 0,
    title: "",
    remark: "",
    amount: 0,
    amountIn: 0,
    logTime: parseTime(new Date(), "{y}-{m}-{d} {h}:{i}:00") || "",
    categoryId: 0,
    accountFrom: 0,
    accountTo: 0,
    templateId: 0,
    tags: [],
    events: [],
    options: []
  })
  templateDisabled.value = false
}

function close() {
  visible.value = false
  emit("close")
}

function handleSearchTags(value: string) {
  if (value === "" && tagOptions.value.length > 0) return
  tagsLoading.value = true
  fetchTags({ keyword: value }).then((response) => {
    if (response.code === 0) {
      tagOptions.value = response.data.tags
      tagsLoading.value = false
    } else {
      ElMessage.error(`获取标签列表失败: ${response.message}`)
    }
  })
}

function querySearchAsync(queryString: string, cb: any) {
  if (queryString === "" || queryString.length < 2) {
    cb([])
    return
  }
  fetchRecordList({ keyword: queryString, startDate: "1970-01-01" }).then((response) => {
    if (response.code === 0) {
      const resutl = response.data.records.map((item: any) => ({
        value: `${item.content}: ${item.remark}`,
        title: item.content,
        remark: item.remark
      }))
      cb(resutl)
    } else {
      ElMessage.error(`获取标签列表失败: ${response.message}`)
    }
  })
}

function handleRemarkSelect(item: Record<string, any>) {
  formData.remark = item.remark
  formData.title = item.title
}

// 在handleSubmit中处理标签数据
function handleSubmit() {
  formData.tags = selectedTags.value
  formData.events = selectedEvents.value

  btnSubmit.loading = true
  const message = isEdit.value ? "更新记账记录" : "添加记账记录"
  const request = isEdit.value
    ? updateRecord(formData.id, formData)
    : createRecord(formData)
  request.then((response: any) => {
    btnSubmit.loading = false
    if (response.code === 0) {
      visible.value = false
      ElNotification({
        title: "成功",
        message: `${message}成功！`,
        type: "success",
        offset: 0
      })
      emit("success")
    } else {
      ElNotification({
        title: "失败",
        message: response.message || `${message}失败！`,
        type: "error",
        offset: 0
      })
    }
  }).catch(() => {
    btnSubmit.loading = false
    ElNotification({
      title: "错误",
      message: "系统错误，请稍后重试",
      type: "error",
      offset: 0
    })
  })
}

function handleTemplateChange(value: any) {
  if (value.length === 0) return
  formData.templateId = value[value.length - 1]
  resetVisible()
  fetchTemplateDetail(value[value.length - 1]).then((response) => {
    if (response.code === 0) {
      const fields = response.data.defaultField ? response.data.defaultField.split(",") : []

      fields.forEach((field) => {
        if (field in formVisible.value) {
          formVisible.value[field as keyof typeof formVisible.value] = false
        }
      })
    } else {
      ElNotification({
        title: "失败",
        message: response.message || "获取模板详情失败",
        type: "error",
        offset: 0
      })
    }
  })
}

function handleCategoryChange(value: any) {
  if (value.length === 0) return
  formData.categoryId = value[value.length - 1]
}

function handleAccFromChange(value: any) {
  if (value.length === 0) return
  formData.accountFrom = value[value.length - 1]
  if (value[0] === "3") {
    formVisible.value.options = true
    fetchEventList({ aid: value[value.length - 1] }).then((response) => {
      if (response.code === 0) {
        const result = response.data.events.map(event => ({
          id: event.id,
          name: event.name
        }))
        if (result.length > 0) {
          formVisible.value.events = true
          eventOptions.value = result
        } else {
          formVisible.value.events = false
        }
      } else {
        formVisible.value.events = false
      }
    })
  } else {
    formVisible.value.options = false
  }
  visibleCurrencyField()
  visibleTagField()
}

function handleAccToChange(value: any) {
  if (value.length === 0) return
  formData.accountTo = value[value.length - 1]
  formVisible.value.options = value[0] === "3"
  visibleCurrencyField()
  visibleTagField()
}

function resetVisible() {
  Object.keys(visibleInit).forEach((key) => {
    formVisible.value[key as keyof typeof formVisible.value] = visibleInit[key as keyof typeof visibleInit]
  })
  visibleTagField()
}

function visibleTagField() {
  if (tagsAccount.includes(formData.accountFrom) || tagsAccount.includes(formData.accountTo)) {
    formVisible.value.tags = true
  } else {
    formVisible.value.tags = false
  }
}

function visibleCurrencyField() {
  const accFromInfo = accountInfo.value.get(formData.accountFrom)
  const accToInfo = accountInfo.value.get(formData.accountTo)
  const accFromVisible = accFromInfo && accFromInfo.currency !== 1
  const accToVisible = accToInfo && accToInfo.currency !== 1
  formVisible.value.amountIn = (accFromVisible || accToVisible) && !(accFromInfo && accToInfo && accFromInfo.currency === accToInfo.currency)
}

function resetOptions() {
  cascaderOptions.value = {
    template: [],
    category: [],
    accountFrom: [],
    accountTo: []
  }
}

function setDayEnd() {
  formData.logTime = `${parseTime(formData.logTime, "{y}-{m}-{d}")} 23:59:59`
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="新增记账"
    width="40%"
    :close-on-press-escape="false"
    :before-close="close"
  >
    <el-form :model="formData" :rules="rules" label-width="100px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="记账模板" prop="templateId">
            <el-cascader v-model="cascaderOptions.template" placeholder="选择记账模板" :options="templates" :props="{ expandTrigger: 'hover' }" @change="handleTemplateChange" filterable :disabled="templateDisabled" :debounce="800" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formVisible.category_id" label="分类" prop="categoryId">
            <el-cascader v-model="cascaderOptions.category" placeholder="选择分类" :options="categories" :props="{ expandTrigger: 'hover' }" @change="handleCategoryChange" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="formVisible.account_from" label="账户" prop="accountFrom">
            <el-cascader v-model="cascaderOptions.accountFrom" placeholder="选择账户" :options="accounts" :props="{ expandTrigger: 'hover' }" @change="handleAccFromChange" filterable :debounce="500" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formVisible.account_to" label="目的账户" prop="accountTo">
            <el-cascader v-model="cascaderOptions.accountTo" placeholder="选择账户" :options="accounts" :props="{ expandTrigger: 'hover' }" @change="handleAccToChange" filterable :debounce="500" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item v-if="formVisible.title" label="事项" prop="title">
        <el-input type="text" v-model="formData.title" placeholder="请输入事项" autocomplete="on" />
      </el-form-item>

      <el-form-item v-if="formVisible.remark" label="备注" prop="remark">
        <el-autocomplete
          v-model="formData.remark"
          placeholder="请输入备注"
          :fetch-suggestions="querySearchAsync"
          @select="handleRemarkSelect"
        />
      </el-form-item>

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="formVisible.amount" label="金额" prop="amount">
            <el-input type="number" v-model="formData.amount" placeholder="请输入金额" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formVisible.amountIn" label="进账金额" prop="amountIn">
            <el-input type="number" v-model="formData.amountIn" placeholder="请输入金额" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item v-if="formVisible.log_time" label="交易时间" prop="logTime">
            <el-date-picker v-model="formData.logTime" type="datetime" placeholder="选择交易时间" class="filter-item" style="width: 88%;" />
            <el-button @click="setDayEnd" :icon="Download" circle size="small" style="margin-left: 3px;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formVisible.tags" label="项目标签" prop="tags">
            <el-select
              v-model="selectedTags"
              multiple
              filterable
              remote
              allow-create
              default-first-option
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

      <el-form-item v-if="formVisible.events" label="计入活动" prop="events">
        <el-select
          v-model="selectedEvents"
          multiple
          placeholder="请选择记入任务的活动"
        >
          <el-option
            v-for="event in eventOptions"
            :key="event.id"
            :label="event.name"
            :value="event.id"
          >
            {{ event.name }}
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item v-if="formVisible.options" label="记账选项" prop="options">
        <el-checkbox-group v-model="formData.options">
          <el-checkbox label="记入还款" value="isPay" />
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">
        取消
      </el-button>
      <el-button type="primary" :loading="btnSubmit.loading" @click="handleSubmit">
        {{
          btnSubmit.loading ? '提交中' : '提交'
        }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.filter-item {
  width: 100%;
}
</style>

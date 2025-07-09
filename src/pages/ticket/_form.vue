<script lang="ts" setup>
import { formatDateTime } from "@/common/utils/datetime"
import { ElMessage } from "element-plus"
import { fetchList as fetchOrderList } from "../quotation/apis"
import { createTicket, fetchAssigneeList as fetchAssignableUserList, updateTicket } from "./apis"

const emit = defineEmits(["success", "close"])

// 工单表单
const formData = reactive({
  id: 0,
  title: "",
  content: "",
  ticketType: 1,
  priority: 2,
  productId: "",
  orderId: "",
  storeName: "",
  trackId: "",
  assigneeId: 0
})

// 需要关联订单号的工单类型
const orderRelatedTicketTypes = [1, 2, 3, 4, 6, 7, 8]
const highPriorityTicketTypes = [1, 2, 3, 4]

// 工单类型选项
const ticketTypeOptions = ref([
  { label: "订单缺货", value: 1, color: "danger" },
  { label: "订单售后", value: 2, color: "warning" },
  { label: "产品售后", value: 3, color: "warning" },
  { label: "物流售后", value: 4, color: "warning" },
  { label: "知识更新", value: 5, color: "success" },
  { label: "仓库缺货", value: 6, color: "danger" },
  { label: "咨询", value: 7, color: "success" },
  { label: "投诉", value: 8, color: "danger" },
  { label: "建议", value: 9, color: "success" }
])

// 优先级选项
const priorityOptions = ref([
  { label: "日常", value: 1, color: "info" },
  { label: "一般", value: 2, color: "primary" },
  { label: "紧急", value: 3, color: "warning" },
  { label: "加急", value: 4, color: "warning" },
  { label: "特急", value: 5, color: "danger" }
])

const visible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref("新增工单")
const orderOptions = ref<any>([])
const searchLoading = ref(false)
const userOptions = ref<any>([])
const isSubmitting = ref(false)

function handleTicketTypeChange() {
  if (orderRelatedTicketTypes.includes(formData.ticketType)) {
    formData.orderId = ""
  } else {
    formData.productId = ""
  }
  if (highPriorityTicketTypes.includes(formData.ticketType)) {
    formData.priority = 4
  } else {
    formData.priority = 3
  }
}

async function handelSearchOrder(query: string) {
  if (!query || query.length < 2) return
  searchLoading.value = true
  try {
    const res = await fetchOrderList({ keyword: query })
    if (res) {
      if (res.code === 0 && res.data.orders) {
        orderOptions.value = res.data.orders.map((item: any) => ({
          value: item.id,
          label: `[${formatDateTime(item.updatedAt)}] ${item.name}`
        }))
      } else {
        orderOptions.value = []
      }
    }
  } catch (error) {
    console.log(error)
    ElMessage.error("查询订单失败")
  } finally {
    searchLoading.value = false
  }
}

// 获取可指派的用户列表
async function initAssignableUsers() {
  try {
    const res = await fetchAssignableUserList()
    if (res) {
      if (res.code === 0 && res.data.assignees) {
        const groupMap = new Map()
        res.data.assignees.forEach((item: any) => {
          const role = getRoleName(item.role)
          if (!groupMap.has(role)) {
            groupMap.set(role, {
              label: role,
              options: []
            })
          }
          groupMap.get(role).options.push({
            value: item.id,
            label: item.name
          })
        })
        userOptions.value = Array.from(groupMap.values()).sort((a, b) => a.label.localeCompare(b.label))
      } else {
        userOptions.value = []
      }
    }
  } catch (error) {
    console.log(error)
    ElMessage.error("查询用户失败")
  }
}

function getRoleName(role: string) {
  let prefix = "其他角色"
  if (role.includes("CS")) {
    prefix = "客服"
  } else if (role.includes("WM")) {
    prefix = "仓管"
  } else if (role.includes("GD")) {
    prefix = "美工"
  } else if (role.includes("PM")) {
    prefix = "主管"
  } else if (role.includes("AS")) {
    prefix = "售后"
  } else if (role.includes("OP")) {
    prefix = "运营"
  } else if (role.includes("FI")) {
    prefix = "财务"
  } else if (role.includes("AD")) {
    prefix = "管理员"
  }
  let platform = "其他平台"
  if (role.includes("TIANMAO")) {
    platform = "天猫"
  } else if (role.includes("TAOBAO")) {
    platform = "淘宝"
  } else if (role.includes("PINDUODUO")) {
    platform = "拼多多"
  } else if (role.includes("DOUYIN")) {
    platform = "抖音"
  } else if (role.includes("XIANYU")) {
    platform = "闲鱼"
  }
  return `${prefix}-${platform}`
}

function close() {
  visible.value = false
  emit("close")
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
      if (key in formData) {
        (formData as any)[key] = (options.editData as any)[key]
      }
    })
    formData.storeName = (options.editData as any).related
    const orderId = (options.editData as any).orderId
    const orderName = (options.editData as any).orderName
    const orderUpdateAt = (options.editData as any).orderUpdateAt
    orderOptions.value = [
      {
        value: orderId,
        label: `[${formatDateTime(orderUpdateAt)}] ${orderName}`
      }
    ]
    formData.orderId = orderId
  } else {
    isEdit.value = false
  }

  initAssignableUsers()
}

function resetForm() {
  formData.id = 0
  formData.title = ""
  formData.content = ""
  formData.ticketType = 1
  formData.priority = 2
  formData.productId = ""
  formData.orderId = ""
  formData.trackId = ""
  formData.assigneeId = 0
  formData.storeName = ""
}

async function handleSubmit() {
  if (isSubmitting.value) {
    ElMessage.warning("正在提交中，请勿重复操作")
    return
  }

  if (!formData.title || !formData.content) {
    ElMessage.warning("请填写标题和内容")
    return
  }

  isSubmitting.value = true
  try {
    if (isEdit.value) {
      await updateTicket(formData.id, formData)
      ElMessage.success("更新成功")
    } else {
      await createTicket(formData)
      ElMessage.success("创建成功")
    }
    visible.value = false
    emit("success")
  } catch (error) {
    console.log(error)
    ElMessage.error(isEdit.value ? "更新失败" : "创建失败")
  } finally {
    isSubmitting.value = false
  }
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    :before-close="close"
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="标题" required>
        <el-input v-model="formData.title" placeholder="请输入工单标题" />
      </el-form-item>
      <el-form-item label="工单类型" required>
        <el-select v-model="formData.ticketType" placeholder="请选择工单类型" @change="handleTicketTypeChange" style="width: 100%;">
          <el-option
            v-for="type in ticketTypeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级">
        <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%;">
          <el-option
            v-for="priority in priorityOptions"
            :key="priority.value"
            :label="priority.label"
            :value="priority.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品编号" v-if="formData.ticketType === 3 || formData.ticketType === 6">
        <el-input v-model="formData.productId" placeholder="相关产品ID（可选）" />
      </el-form-item>
      <el-form-item label="订单编号" v-if="orderRelatedTicketTypes.includes(formData.ticketType)">
        <el-select
          v-model="formData.orderId"
          filterable
          remote
          placeholder="相关订单（可选，输入订单名称关键字搜索）"
          :remote-method="handelSearchOrder"
          :loading="searchLoading"
        >
          <el-option
            v-for="item in orderOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="店铺名" v-if="formData.ticketType === 1 || formData.ticketType === 2">
        <el-input v-model="formData.storeName" placeholder="相关店铺名称" />
      </el-form-item>
      <el-form-item label="物流编号" v-if="formData.ticketType === 4">
        <el-input v-model="formData.trackId" placeholder="相关物流编号" />
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="5"
          placeholder="请详细描述问题或需求"
        />
      </el-form-item>
      <el-form-item label="指派给" v-if="!isEdit">
        <el-select
          v-model="formData.assigneeId"
          :empty-values="[0]"
          :value-on-clear="0"
          filterable
          placeholder="请选择用户"
        >
          <el-option-group
            v-for="group in userOptions"
            :key="group.label"
            :label="group.label"
          >
            <el-option
              v-for="item in group.options"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </el-option-group>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting" :disabled="isSubmitting">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

<script lang="ts" setup>
import TicketItem from "./TicketItem.vue"

interface Ticket {
  id: number
  title: string
  type: number
  priority: number
  status: number
  updatedAt?: string
  [key: string]: any
}

const props = defineProps({
  data: {
    type: Array as () => Ticket[],
    default: () => []
  }
})

// 当前选中的过滤器
const activeFilter = ref<"all" | "active" | "completed">("all")

const filters = computed(() => ({
  all: props.data,
  active: props.data.filter((ticket: Ticket) => ticket.status <= 3),
  completed: props.data.filter((ticket: Ticket) => ticket.status > 3)
}))

// 当前过滤后的列表
const filteredTickets = computed(() => {
  return filters.value[activeFilter.value] || []
})
</script>

<template>
  <div style="height: 100%;">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <Edit style="width: 1.5em; height: 1.5em; margin-right: 5px" />
            <span>工单列表</span>
          </div>
          <el-radio-group v-model="activeFilter" size="small">
            <el-button type="primary" size="small" style="margin-right: 20px; padding: 12px;">新建工单</el-button>
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="active">未完成</el-radio-button>
            <el-radio-button value="completed">已完成</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-scrollbar>
        <div v-if="filteredTickets.length === 0" class="empty-tip">
          暂无待办事项
        </div>
        <div
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          class="ticketlist-item"
        >
          <TicketItem :ticket="ticket" />
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<style scoped>
.box-card {
  width: 100%;
  height: 100%;
  line-height: 2.2em;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}
:deep(.el-card__header) {
  padding: 10px;
}
.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}

.ticketlist-item {
  display: flex;
  align-items: center;
  padding: 3px;
  margin-bottom: 5px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  transition: all 0.3s;
}

.ticketlist-item.is-completed {
  background: #f5f7fa;
  color: #909399;
  text-decoration: line-through;
}

.ticket-text {
  margin-left: 10px;
  flex: 1;
}

.ticket-date {
  font-size: 12px;
  color: #909399;
}
</style>

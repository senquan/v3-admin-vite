<script lang="ts" setup>
import { formattedMoney } from "@@/utils"
import { dateDiff } from "@@/utils/datetime"
import { useUserStore } from "@/pinia/stores/user"
import { getBalanceStats, getExpiring, getLoanDepositStats } from "../../finance/apis"
import BalanceBarChart from "./BalanceBarChart.vue"
import Greeting from "./Greeting.vue"
import MultiplePieChart from "./MultiplePieChart.vue"

/** 即将到期的票据/定期数据结构 */
interface ExpiringItem {
  id: number
  type: number
  name: string
  amount: number
  expiryDate: string
  daysLeft: number
  company: string
}

const userStore = useUserStore()
const loading = ref(false)

const greetingMessage = computed(() => {
  const hour = (new Date()).getHours()
  const username = userStore.username || "访客"

  if (hour >= 5 && hour < 9) {
    return `早安，${username}！开始您一天的工作吧！`
  } else if (hour >= 9 && hour < 12) {
    return `上午好，${username}！工作状态满满`
  } else if (hour >= 12 && hour < 14) {
    return `中午好，${username}！记得休息一下`
  } else if (hour >= 14 && hour < 18) {
    return `下午好，${username}！继续加油`
  } else if (hour >= 18 && hour < 22) {
    return `晚上好，${username}！辛苦了一天`
  } else {
    return `夜深了，${username}！注意休息`
  }
})

/** 即将到期的项目 */
const expiringItems = ref<ExpiringItem[]>([])

const companyBalanceData = ref<any>({
  loan: [] as number[],
  balance: [] as number[],
  names: [] as string[]
})

const companyLoanDepositData = ref<any>({
  names: [] as string[],
  source: [] as any[]
})

/** 统计数据 */
const stats = ref({
  totalTodo: 0,
  highPriority: 0,
  mediumPriority: 0,
  lowPriority: 0,
  totalExpiring: 0,
  totalAmount: 0
})

/** 获取类型文本 */
function getTypeText(type: number) {
  const texts: Record<string, string> = {
    1: "票据",
    2: "定期"
  }
  return texts[type] || type
}

async function loadExpiringItems() {
  loading.value = true
  try {
    const params = {
      page: 1,
      size: 7
    }
    const response = await getExpiring(params)
    const result: any = response
    let count = 1
    expiringItems.value = result.data.records.map((item: any) => {
      const daysLeft = dateDiff(new Date(), item.expiryDate)
      if (Number.isInteger(daysLeft) && Number(daysLeft) <= 5)
        stats.value.totalExpiring++
      return {
        ...item,
        seq: count++,
        daysLeft
      }
    })
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

async function loadBalanceStats() {
  loading.value = true
  try {
    const params = {
      page: 1,
      size: 10000
    }
    const response = await getBalanceStats(params)
    const result: any = response
    companyBalanceData.value = result.data
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

async function loadLoanDepositData() {
  loading.value = true
  try {
    const params = {
      page: 1,
      size: 10000
    }
    const response = await getLoanDepositStats(params)
    const result: any = response
    companyLoanDepositData.value.source = result.data
    companyLoanDepositData.value.names = Array.from(new Set(result.data.map((item: any) => {
      return item[0]
    })))

    console.log(companyLoanDepositData.value)
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    loading.value = false
  }
}

/** 页面挂载时初始化 */
onMounted(() => {
  loadExpiringItems()
  loadBalanceStats()
  loadLoanDepositData()
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <Greeting
        :avatar="userStore.avatar"
      >
        <template #title>
          {{ greetingMessage }}
        </template>
        <template #description>
          今天是 {{ new Date().toLocaleDateString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) }}
        </template>
      </Greeting>
      <div class="banner-stats">
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalTodo }}</div>
          <div class="stat-label">待办事项</div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <div class="stat-value stat-highlight">{{ stats.highPriority }}</div>
          <div class="stat-label">高优先级</div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalExpiring }}</div>
          <div class="stat-label">即将到期</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="dashboard-content">
      <el-card>
        <el-row :gutter="10">
          <el-col :span="7">
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">
                  <el-icon size="30"><Clock /></el-icon>
                  最近到期
                </h2>
              </div>

              <div class="expiring-list">
                <div v-for="item in expiringItems" :key="item.id" class="expiring-item">
                  <div class="expiring-icon">
                    <el-icon v-if="item.type === 1"><Tickets /></el-icon>
                    <SvgIcon v-else name="cash" />
                  </div>
                  <div class="expiring-info">
                    <div class="expiring-name" style="margin-bottom: 5px;">
                      <span>{{ item.name }}</span>
                      <span class="expiring-date">{{ item.expiryDate }}</span>
                    </div>
                    <div class="expiring-meta">
                      <el-tag>{{ getTypeText(item.type) }}</el-tag>
                      <span class="expiring-amount">{{ formattedMoney(item.amount) }}</span>
                    </div>
                    <div class="expiring-footer">
                      <span class="expiring-unit">{{ item.company }}</span>
                      <el-tag :type="`${item.daysLeft > 5 ? 'success' : 'danger'}`">还剩 {{ item.daysLeft }} 天</el-tag>
                    </div>
                  </div>
                </div>

                <div v-if="expiringItems.length === 0" class="empty-state">
                  <div class="empty-icon">✨</div>
                  <p>暂无即将到期的定期或票据</p>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="17">
            <div class="right-column">
              <el-row>
                <el-col :span="24">
                  <!-- 饼图位置 -->
                  <div class="card chart-card">
                    <div class="card-header">
                      <h2 class="card-title">
                        <el-icon size="30"><DataLine /></el-icon>
                        资金分布
                      </h2>
                    </div>
                    <div class="chart-wrapper">
                      <BalanceBarChart :data="companyBalanceData" />
                    </div>
                  </div>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <div class="chart-wrapper">
                    <MultiplePieChart :data="companyLoanDepositData" />
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.admin-dashboard {
  padding: 10px;
  height: 100%;
}

/* 欢迎横幅 */
.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0;
  margin-bottom: 10px;
  box-shadow: 0 5px 32px rgba(0, 0, 0, 0.1);
}

.banner-content {
  flex: 1;
}

.banner-stats {
  display: flex;
  gap: 24px;
  align-items: center;
  padding-left: 32px;
  padding-right: 32px;
  border-left: 2px solid #e2e8f0;

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 4px;

      &.stat-highlight {
        color: #f56c6c;
      }
    }

    .stat-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .stat-divider {
    width: 1px;
    height: 48px;
    background: linear-gradient(180deg, transparent, #e2e8f0, transparent);
  }
}

/* 主内容区 */
.dashboard-content {
  height: calc(100vh - 230px - var(--v3-header-height));
}

:deep(.el-table .header-cell-fix) {
  text-align: center;
  background-color: #f5f7fa;
  height: 50px;
}

/* 卡片通用样式 */
.card {
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #2d3748;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;

      .title-icon {
        font-size: 20px;
      }
    }

    .card-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .add-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }
  }
}

/* 待办事项卡片 */
.todo-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
}

.add-todo-form {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  background: white;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.completed {
    opacity: 0.6;

    .todo-title {
      text-decoration: line-through;
      color: #a0aec0;
    }
  }

  .todo-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;

    :deep(.el-checkbox) {
      margin-top: 2px;
    }

    .todo-info {
      flex: 1;

      .todo-title {
        font-size: 14px;
        color: #2d3748;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .todo-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        .priority-tag {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
        }

        .deadline-tag {
          font-size: 11px;
          color: #718096;
        }
      }
    }
  }

  .delete-btn {
    background: transparent;
    border: none;
    color: #a0aec0;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    transition: all 0.3s ease;
    border-radius: 4px;

    &:hover {
      color: #f56c6c;
      background: rgba(245, 108, 108, 0.1);
    }
  }
}

/* 即将到期卡片 */
.expiring-card {
  margin-bottom: 24px;
}

.expiring-list {
  max-height: calc(100vh - 355px);
  overflow-y: auto;
  padding: 12px;
}

.expiring-item {
  display: flex;
  gap: 16px;
  padding: 5px;
  margin-bottom: 6px;
  background: white;
  border-radius: 5px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  align-items: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .expiring-icon {
    font-size: 32px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .expiring-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .expiring-name {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;

      .expiring-date {
        font-size: 12px;
        font-weight: normal;
        color: #718096;
      }
    }

    .expiring-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .expiring-amount {
        font-size: 17px;
        font-weight: 600;
        color: #48bb78;
      }
    }

    .expiring-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .expiring-unit {
        font-size: 12px;
        color: #718096;
      }

      .days-left {
        font-size: 12px;
        font-weight: 600;
        color: #48bb78;

        &.urgent {
          color: #f56c6c;
        }
      }
    }
  }
}

/* 图表区域 */
.chart-card {
  .chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 280px;
    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    border-radius: 12px;
    margin: 16px;

    .placeholder-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .placeholder-text {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 8px;
    }

    .placeholder-hint {
      font-size: 12px;
      color: #718096;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
    color: #a0aec0;
    margin: 0;
  }
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap)::-webkit-scrollbar {
  width: 6px;
}

:deep(.el-scrollbar__wrap)::-webkit-scrollbar-track {
  background: #f7fafc;
}

:deep(.el-scrollbar__wrap)::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

:deep(.el-scrollbar__wrap)::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .welcome-banner {
    flex-direction: column;
    gap: 10px;
    text-align: center;

    .banner-stats {
      padding-left: 0;
      border-left: none;
      border-top: 2px solid #e2e8f0;
      padding-top: 24px;
      width: 100%;
      justify-content: center;
    }
  }
}
</style>

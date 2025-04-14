<script lang="jsx" setup>
import { ref } from 'vue'
import { useUserStore } from "@/pinia/stores/user"
import { fetchIndex } from "./apis"
import { fetchRecentTop } from "../record/apis"
import TodoList from './components/TodoList.vue'
import TaskList from './components/TaskList.vue'
import DataGroup from './components/DataGroup.vue'
import MonthlyBarChart from './components/MonthlyBarChart.vue'
import AssetsPieChart from './components/AssetsPieChart.vue'
import CategoryPieChart from './components/CategoryPieChart.vue'
import RecentList from './components/RecentList.vue'
import { parseTime } from "@/common/utils/datetime"

const userStore = useUserStore()
const isAdmin = userStore.roles.includes("admin")

const todoListData = ref([])
const taskListData = ref([])
const monthlyChartData = ref([])
const assetsChartData = ref({})
const statisticData = ref({})
const categoryChartData = ref({})
const recentTransData = ref([])

const recentListRoading = ref(false)

const fetchDashboard = async () => {
  try {
    fetchIndex().then((res) => {
      const data = res.data
      if (data) {
        if (data.asset) {
          assetsChartData.value = data.asset;
          if (data.asset.sums) {
            statisticData.value = data.asset.sums || {}
          }
        } else {
          assetsChartData.value = {}
          statisticData.value = {}
        }

        if (data.category) {
          categoryChartData.value = data.category
        } else {
          categoryChartData.value = {}
        }

        if (data.monthly) {
          const monthlyData = {
            income: data.monthly.income || {},
            expense: data.monthly.expense || {},
            months: data.monthly.months || []
          }
          monthlyChartData.value = monthlyData
        } else {
          monthlyChartData.value = []
        }
        if (data.todo) {
          todoListData.value = data.todo
        } else {
          todoListData.value = []
        }
        if (data.task) {
          taskListData.value = data.task
        } else {
          taskListData.value = []
        }
      } else {
        ElMessage.error("获取统计数据失败，请稍后重试")
      }
    })
  } catch (error) {
    console.error("获取统计数据失败:", error)
    ElMessage.error("获取统计数据失败，请稍后重试")
  }
}

const fetchRecentTrans = async (type) => {
  try {
    recentListRoading.value = true
    fetchRecentTop({ format: 'recent-top-' + type }).then((res) => {
      if (res.data && res.data.records) {
        recentTransData.value = res.data.records.map(item => {
          const date = parseTime(item.time, '{m}-{d}') || ""
          return {
            date,
            name: item.content || "",
            amount: item.amount || 0
          }
        })
      } else {
        recentTransData.value = []
      }
    })
  } catch (error) {
    console.error("获取近期交易数据失败:", error)
    ElMessage.error("获取近期交易数据失败，请稍后重试")
  } finally {
    recentListRoading.value = false
  }
}

const changeCategoryType = (type) => {
  fetchRecentTrans(type)
}

onMounted(() => {
  fetchDashboard()
  fetchRecentTrans('expense')
})
</script>

<template>
  <div>
    <el-row :gutter="8">
      <el-col :xs="24" :sm="12" :md="12" :lg="8" :xl="8">
        <TodoList :data="todoListData" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="8" :xl="8">
        <TaskList :data="taskListData" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="8" :xl="8">
        <div class="chart-wrapper">
          <MonthlyBarChart :data="monthlyChartData" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="8" class="data-group">
      <DataGroup :data="statisticData" />
    </el-row>

    <el-row :gutter="8">
      <el-col :xs="24" :sm="12" :md="12" :lg="9" :xl="9">
        <div class="chart-wrapper">
          <AssetsPieChart :data="assetsChartData" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="9" :xl="9">
        <div class="chart-wrapper">
          <CategoryPieChart :data="categoryChartData" @changeType="changeCategoryType" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
        <RecentList :data="recentTransData" :loading="recentListRoading" />
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.el-row {
  margin-top: 10px;
}
.chart-wrapper {
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 12px;
}

.stat-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  height: 100px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin: 8px 0;
}

.stat-trend {
  font-size: 12px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}
</style>

<script lang="ts" setup>
import { useUserStore } from "@/pinia/stores/user"
import { fetchOrderReport } from "../quotation/apis"
import { fetchStats } from "./apis"
import Greeting from "./components/Greeting.vue"
import MySalesChart from "./components/MySalesChart.vue"
import StatGroup from "./components/StatGroup.vue"
import TicketList from "./components/TicketList.vue"

const userStore = useUserStore()
// const isAdmin = userStore.roles.includes("ADMIN")

const statData = ref<any>([])
const mySalesData = ref<any>([])
const currentTime = ref(new Date())

const greetingMessage = computed(() => {
  const hour = currentTime.value.getHours()
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

onMounted(() => {
  fetchOrderReport().then((res) => {
    mySalesData.value = res.data
  })
  fetchStats().then((res) => {
    statData.value = res.data
  })
})
</script>

<template>
  <div class="dashboard-container">
    <el-row :gutter="8" class="dashboard-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <Greeting
          :avatar="userStore.avatar"
        >
          <template #title>
            {{ greetingMessage }}
          </template>
        </Greeting>
        <div class="chart-wrapper">
          <StatGroup :data="statData" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <TicketList />
      </el-col>
    </el-row>

    <el-row :gutter="8" class="dashboard-row">
      <el-col :span="24">
        <div class="chart-wrapper">
          <MySalesChart :data="mySalesData" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-container {
  height: calc(100vh - 130px); /* 减去头部和页面边距的高度 */
  display: flex;
  flex-direction: column;
}

.dashboard-row {
  flex: 1;
  margin-bottom: 8px;
  min-height: 0; /* 防止flex子项溢出 */
}

.dashboard-row:last-child {
  margin-bottom: 0;
}

.chart-wrapper {
  height: 78.3%;
  background-color: #fff;
  padding: 12px;
  box-sizing: border-box;
}

.el-col {
  height: 100%;
}
</style>

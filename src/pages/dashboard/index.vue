<script lang="ts" setup>
// import { useUserStore } from "@/pinia/stores/user"
import { fetchOrderReport } from "../quotation/apis"
import { fetchStats, fetchTicketList } from "./apis"
import MySalesChart from "./components/MySalesChart.vue"
import StatGroup from "./components/StatGroup.vue"
import TicketList from "./components/TicketList.vue"

// const userStore = useUserStore()
// const isAdmin = userStore.roles.includes("ADMIN")

const ticketListData = ref<any>([])
const statData = ref<any>([])
const mySalesData = ref<any>([])

onMounted(() => {
  fetchTicketList({}).then((res) => {
    ticketListData.value = res.data.tickets
  })
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
        <div class="chart-wrapper">
          <StatGroup :data="statData" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <TicketList :data="ticketListData" />
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
  height: 100%;
  background-color: #fff;
  padding: 12px;
  box-sizing: border-box;
}

.el-col {
  height: 100%;
}
</style>

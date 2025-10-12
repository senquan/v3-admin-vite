<script lang="ts" setup>
import type { ContentData } from "@/common/components/ContentViewer/types"
import type { BulletinListData } from "@/pages/bulletin/apis/type"
import ContentViewer from "@/common/components/ContentViewer/index.vue"
import { useUserStore } from "@/pinia/stores/user"
import { fetchBulletinList } from "../bulletin/apis"
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
const bulletinList = ref<any>([])

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

// ContentViewer 相关状态
const contentViewerVisible = ref(false)
const contentData = ref<ContentData>()

function handleNoticeClick(notice: BulletinListData) {
  contentData.value = {
    title: notice.title,
    datetime: notice.published_at || "",
    author: notice.creator?.username || "",
    content: notice.content
  }
  contentViewerVisible.value = true
}

onMounted(() => {
  fetchOrderReport().then((res) => {
    mySalesData.value = res.data
  })
  fetchBulletinList({ page: 1, pageSize: 5 }).then((res) => {
    bulletinList.value = res.data.bulletins
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
          <template #description>
            <div v-for="item in bulletinList" :key="item.id" class="flex-vcenter notice-item" @click="handleNoticeClick(item)">
              <SvgIcon name="bulletin" style="margin-right: 10px; font-size: 22px;" />{{ item.title }}
            </div>
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

    <!-- 内容查看器 -->
    <ContentViewer
      v-model:visible="contentViewerVisible"
      :data="contentData"
    />
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

.flex-vcenter {
  display: flex;
  align-items: center;
}

.notice-item {
  cursor: pointer;
  transition: background-color 0.2s;
}
</style>

<script lang="ts" setup>
import { fetchCategoryReport } from "../../quotation/apis"
import CategoryChart from "./CategoryChart.vue"

const chartData = ref({})

const chartHeight = ref("calc(100vh - 100px)")

onMounted(() => {
  fetchCategoryReport().then((res) => {
    chartData.value = res.data
  })
})
</script>

<template>
  <div class="report-container">
    <el-row :gutter="8">
      <el-col>
        <div class="chart-wrapper" :style="{ height: chartHeight }">
          <CategoryChart :data="chartData" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.report-container {
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
}
.chart-wrapper {
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}
</style>

<script lang="ts" setup>
import { BarChart } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      loan: [],
      balance: [],
      names: []
    })
  }
})

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  BarChart,
  MarkLineComponent,
  CanvasRenderer
])

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

interface EChartSeries {
  name: string
  type: string
  stack?: string
  itemStyle?: any
  data: any[]
  [key: string]: any
}

const option = ref({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    }
  },
  legend: {
    top: "0",
    data: [] as string[]
  },
  grid: {
    top: "8%",
    bottom: "5%"
  },
  calculable: true,
  xAxis: [
    {
      type: "category",
      data: []
    }
  ],
  yAxis: [
    {
      type: "value"
    }
  ],
  series: [
    {
      name: "存款",
      type: "bar",
      data: [],
      markLine: {
        data: [{ type: "average", name: "Avg" }]
      }
    },
    {
      name: "贷款",
      type: "bar",
      data: [],
      markLine: {
        data: [{ type: "average", name: "Avg" }]
      }
    }
  ] as EChartSeries[]
})

// 初始化图表
function initChart() {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(option.value)
  }
}

// 更新图表数据
function updateChart() {
  if (chartInstance) {
    chartInstance.setOption(option.value)
  }
}

// 监听窗口大小变化
function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(
  () => props.data,
  (newValue) => {
    if (newValue && Object.keys(newValue).length > 0) {
      // 处理传入的月度报表数据
      const loan = newValue.loan || []
      const balance = newValue.balance || []
      const names = newValue.names || []

      // 更新图表配置
      option.value.legend.data = ["存款", "贷款"]
      option.value.xAxis[0].data = names
      option.value.series[0].data = balance
      option.value.series[1].data = loan
      updateChart()
    }
  },
  { immediate: true }
)

// 监听option变化
watch(
  () => option.value,
  () => {
    updateChart()
  },
  { deep: true }
)

onMounted(() => {
  initChart()
  window.addEventListener("resize", handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener("resize", handleResize)
})
</script>

<template>
  <div ref="chartRef" class="chart" />
</template>

<style scoped>
.chart {
  width: 100%;
  height: 350px;
}
</style>

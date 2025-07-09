<script lang="ts" setup>
import { LineChart } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
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
      months: [],
      platforms: [],
      sales: []
    })
  }
})

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  LineChart,
  CanvasRenderer
])

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

interface EChartSeries {
  name: string
  type: string
  stack?: string
  areaStyle?: any
  emphasis?: {
    focus: string
  }
  data: any[]
  [key: string]: any
}

const option = ref({
  title: {
    text: "个人销售情况"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#6a7985"
      }
    }
  },
  legend: {
    data: [] as string[]
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true
  },
  xAxis: [
    {
      type: "category",
      boundaryGap: false,
      data: []
    }
  ],
  yAxis: [
    {
      type: "value"
    }
  ],
  series: [] as EChartSeries[]
})

function initChart() {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(option.value)
  }
}

function updateChart() {
  if (chartInstance) {
    chartInstance.setOption(option.value)
  }
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

function processData() {
  if (!props.data || !props.data.months || !props.data.platforms || !props.data.sales) {
    return
  }

  // 设置 x 轴数据（月份）
  option.value.xAxis[0].data = props.data.months

  // 设置图例数据（平台名称）
  option.value.legend.data = props.data.platforms

  // 设置系列数据（每个平台的销售数据）
  option.value.series = props.data.platforms.map((platform: string, index: number) => {
    return {
      name: platform,
      type: "line",
      stack: "Total",
      label: {
        show: true,
        position: "top"
      },
      areaStyle: {},
      emphasis: {
        focus: "series"
      },
      data: props.data.sales[index]
    }
  })
}

watch(
  () => props.data,
  (newValue) => {
    if (newValue && Object.keys(newValue).length > 0) {
      processData()
      updateChart()
    }
  },
  { immediate: true, deep: true }
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
  height: 100%;
}
</style>

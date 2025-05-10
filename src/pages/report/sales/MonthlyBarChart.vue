<script lang="ts" setup>
import { BarChart } from "echarts/charts"
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
  BarChart,
  CanvasRenderer
])

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

interface EChartSeries {
  name: string
  type: string
  stack?: string
  itemStyle?: any
  markLine?: any
  data: any[]
  [key: string]: any
}

const option = ref({
  title: {
    text: "年度销售情况报表",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow"
    },
    formatter: (params: any) => {
      let result = `${params[0].name}<br/>`
      params.forEach((item: any) => {
        result = `${result}${item.marker} ${item.seriesName}: ${item.value.toLocaleString("zh-CN", { style: "currency", currency: "CNY" })}<br/>`
      })
      return result
    }
  },
  grid: {
    top: 60,
    left: "2%",
    right: "2%",
    bottom: "3%",
    containLabel: true
  },
  legend: {
    data: [] as string[],
    top: 30
  },
  calculable: true,
  xAxis: [
    {
      type: "category",
      data: [],
      axisLabel: {
        rotate: 0,
        interval: 0
      }
    }
  ],
  yAxis: [
    {
      type: "value",
      name: "销售额 (元)",
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${value / 10000}万`
          }
          return value
        }
      }
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
      type: "bar",
      data: props.data.sales[index],
      itemStyle: {
        color: getColorByIndex(index)
      },
      markLine: {
        data: [
          { type: "average", name: "平均值" }
        ]
      }
    }
  })
}

// 根据索引获取不同的颜色
function getColorByIndex(index: number) {
  const colors = [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4"
  ]
  return colors[index % colors.length]
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

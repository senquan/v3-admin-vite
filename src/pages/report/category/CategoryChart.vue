<script lang="ts" setup>
import { PieChart } from "echarts/charts"
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent
} from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

interface ChartData {
  name: string
  value: number
}

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      series: [] as ChartData[],
      models: [] as ChartData[]
    })
  }
})

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  PieChart,
  CanvasRenderer
])

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

const option = ref({
  title: {
    text: "商品销量分布",
    left: "center"
  },
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)"
  },
  legend: {
    type: "scroll",
    orient: "vertical",
    right: 10,
    top: 20,
    bottom: 20,
    data: [] as string[]
  },
  series: [
    {
      name: "系列分类",
      type: "pie",
      selectedMode: "single",
      radius: [0, "30%"],
      label: {
        position: "inner",
        fontSize: 14
      },
      labelLine: {
        show: false
      },
      data: [] as ChartData[]
    },
    {
      name: "型号分类",
      type: "pie",
      radius: ["45%", "60%"],
      labelLine: {
        length: 30
      },
      label: {
        formatter: "  {b|{b}：}{c}  {per|{d}%}  ",
        backgroundColor: "#F6F8FC",
        borderColor: "#8C8D8E",
        borderWidth: 1,
        borderRadius: 4,
        rich: {
          a: {
            color: "#6E7079",
            lineHeight: 22,
            align: "center"
          },
          hr: {
            borderColor: "#8C8D8E",
            width: "100%",
            borderWidth: 1,
            height: 0
          },
          b: {
            color: "#4C5058",
            fontSize: 14,
            fontWeight: "bold",
            lineHeight: 33
          },
          per: {
            color: "#fff",
            backgroundColor: "#4C5058",
            padding: [3, 4],
            borderRadius: 4
          }
        }
      },
      data: [] as ChartData[]
    }
  ]
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
  if (!props.data || !props.data.series || !props.data.models) {
    return
  }

  // 设置图例数据
  const legendData = [...props.data.series.map((item: ChartData) => item.name), ...props.data.models.map((item: ChartData) => item.name)]
  option.value.legend.data = legendData

  // 设置内环数据（系列分类）
  option.value.series[0].data = props.data.series

  // 设置外环数据（型号分类）
  option.value.series[1].data = props.data.models
}

watch(
  () => props.data,
  (newValue) => {
    if (newValue && Object.keys(newValue).length > 0) {
      console.log(newValue)
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

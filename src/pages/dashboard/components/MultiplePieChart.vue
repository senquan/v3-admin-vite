<script lang="ts" setup>
import { PieChart } from "echarts/charts"
import {
  DatasetComponent,
  TooltipComponent,
  TransformComponent
} from "echarts/components"
import * as echarts from "echarts/core"
import { LabelLayout } from "echarts/features"
import { CanvasRenderer } from "echarts/renderers"

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      source: [],
      names: []
    })
  }
})

// 注册必要的组件
echarts.use([
  DatasetComponent,
  TransformComponent,
  PieChart,
  TooltipComponent,
  CanvasRenderer,
  LabelLayout
])

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

const option = ref({
  tooltip: {
    trigger: "item"
  },
  legend: {
    data: []
  },
  title: [
    {
      text: "存款",
      top: 40,
      left: "10.5%",
      textStyle: {
        fontSize: 15,
        fontWeight: 600
      }
    },
    {
      text: "贷款",
      top: 40,
      left: "35.5%",
      textStyle: {
        fontSize: 15,
        fontWeight: 600
      }
    },
    {
      text: "利息收入",
      top: 40,
      right: "34.5%",
      textStyle: {
        fontSize: 15,
        fontWeight: 600
      }
    },
    {
      text: "贷款利息支出",
      top: 40,
      right: "8%",
      textStyle: {
        fontSize: 15,
        fontWeight: 600
      }
    }
  ],
  dataset: [
    {
      source: [
        ["Company", "Amount", "Type"]
      ]
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "Type", value: 1 }
      }
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "Type", value: 2 }
      }
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "Type", value: 3 }
      }
    },
    {
      transform: {
        type: "filter",
        config: { dimension: "Type", value: 4 }
      }
    }
  ],
  series: [
    {
      type: "pie",
      radius: 80,
      center: ["50%", "50%"],
      datasetIndex: 1,
      label: {
        show: false
      }
    },
    {
      type: "pie",
      radius: 80,
      center: ["50%", "50%"],
      datasetIndex: 2,
      label: {
        show: false
      }
    },
    {
      type: "pie",
      radius: 80,
      center: ["50%", "50%"],
      datasetIndex: 3,
      label: {
        show: false
      }
    },
    {
      type: "pie",
      radius: 80,
      center: ["50%", "50%"],
      datasetIndex: 4,
      label: {
        show: false
      }
    }
  ],
  // Optional. Only for responsive layout:
  media: [
    {
      query: { minAspectRatio: 1 },
      option: {
        series: [
          { center: ["12.5%", "50%"] },
          { center: ["37.5%", "50%"] },
          { center: ["62.5%", "50%"] },
          { center: ["87.5%", "50%"] }
        ]
      }
    },
    {
      option: {
        series: [
          { center: ["50%", "12.5%"] },
          { center: ["50%", "37.5%"] },
          { center: ["50%", "62.5%"] },
          { center: ["50%", "75%"] }
        ]
      }
    }
  ]
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
    if (newValue && newValue.source && newValue.source.length > 0) {
      option.value.legend.data = newValue.names || []
      option.value.dataset[0].source = [
        ["Company", "Amount", "Type"],
        ...newValue.source
      ]
      // 更新图表配置
      updateChart()
    }
  },
  { immediate: true, deep: true }
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
  height: 330px;
}
</style>

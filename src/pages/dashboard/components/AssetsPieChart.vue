<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  PieChart,
  CanvasRenderer
])

const props = defineProps({
  data: {
    type: Object,
    default: () => []
  }
})

const debtsType: string[] = ['3', '7']

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

type ChartDataItem = {
  value: number;
  name: string;
  label?: {
    formatter: string;
  };
};

type EChartSeries = {
  name: string;
  type: string;
  radius?: number | number[];
  center?: string[];
  data: ChartDataItem[];
  [key: string]: any;
};

const option = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    type: 'scroll',
    orient: 'vertical',
    left: '10',
    top: '20',
    bottom: '10',
    data: [] as string[]
  },
  calculable: true,
  series: [] as EChartSeries[]
})

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(option.value)
  }
}

// 更新图表数据
const updateChart = () => {
  if (chartInstance) {
    chartInstance.setOption(option.value)
  }
}

watch(
  () => props.data,
  (newValue) => {
    if (newValue && newValue.data && newValue.type) {
      const center = ['60%', '55%']
      let s1: ChartDataItem[] = []
      let s2: ChartDataItem[] = []
      let names: string[] = []

      Object.keys(newValue.data).forEach((key: string) => {
        if (newValue.type.find((t: { value: string }) => t.value == key)) {
          const typeName = newValue.type.find((t: { value: string }) => t.value == key)?.name || key
          names.push(typeName)
          const tmp: ChartDataItem = {
            value: newValue.data[key].x || 0,
            name: typeName,
            label: {
              formatter: '{b}({c})'
            }
          }
          if (debtsType.indexOf(key) === -1) {
            s1.push(tmp)
          } else {
            s2.push(tmp)
          }
        }
      })

      // 更新图表配置
      option.value.legend.data = names
      option.value.series = [
        {
          name: '资产',
          type: 'pie',
          center,
          radius : [100, 140],
          data: s1
        },
        {
          name: '负债',
          type: 'pie',
          center,
          radius : [0, 70],
          data: s2
        }
      ]
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

// 监听窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div ref="chartRef" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 350px;
}
</style>

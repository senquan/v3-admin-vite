<script lang="ts" setup>
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
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
  BarChart,
  CanvasRenderer
])

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      months: [],
      income: {},
      expense: {}
    })
  }
})

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

type EChartSeries = {
  name: string;
  type: string;
  stack?: string;
  itemStyle?: any;
  data: any[];
  [key: string]: any;
};

const option = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: function (params: any) {
      let sum = 0
      let res = ''
      for (let i = 0; i < params.length; i++) {
        sum += params[i].value
        res += '<br/>' + params[i].seriesName + ' : ' + params[i].value;
      }
      return params[0].name + ' 月, 总收入：' + Math.round(sum * 100) / 100 + res;
    }
  },
  grid: {
    top: 10,
    left: '2%',
    right: '2%',
    bottom: '3%',
    containLabel: true
  },
  legend: {
    data: [] as string[]
  },
  calculable: true,
  xAxis: [
    {
      type: 'category',
      data: []
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [] as EChartSeries[]
})

// 初始化图表
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

// 监听窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(
  () => props.data,
  (newValue) => {
    if (newValue && Object.keys(newValue).length > 0) {
      // 处理传入的月度报表数据
      const months = newValue.months || [];
      const incomeData = newValue.income || {};
      const expenseData = newValue.expense || {};

      // 更新图表配置
      option.value.legend.data = ['支出', '结余'];
      option.value.xAxis[0].data = months.map((month: string) => month.substring(month.lastIndexOf('-') + 1) || 0);
      option.value.series = [
        {
          name: '支出',
          type: 'bar',
          stack: '总量',
          data: months.map((month: string) => expenseData[month] || 0)
        },
        {
          name: '结余',
          type: 'bar',
          stack: '总量',
          data: months.map((month: string) => Math.round((incomeData[month] - expenseData[month]) * 100) / 100)
        }
      ];
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

<script lang="ts" setup>
import { Plus, Minus } from '@element-plus/icons-vue'
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
    default: () => ({
      expense: [],
      income: []
    })
  }
})
const emit = defineEmits(['changeType'])

const chartRef = ref(null)
const catType = ref<'expense' | 'income'>('expense')
const names = reactive({
  expense: [] as string[],
  income: [] as string[]
})
const datas = reactive({
  expense: [] as ChartDataItem[],
  income: [] as ChartDataItem[]
})

interface SelectedType {
  [key: string]: boolean;
}

const selected = ref({
  expense: {} as SelectedType,
  income: {} as SelectedType
})
let chartInstance: echarts.ECharts | null = null

const center = ['40%', '50%']
const itemLabel = {
  formatter: '{b}({c})'
}

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
  clockwise:boolean;
  radius?: number | number[];
  center?: string[];
  data: ChartDataItem[];
  [key: string]: any;
};

const option = ref({
  tooltip: {
    show: true,
    formatter: "{a} <br/>{b} : {c} ({d}%)"
  },
  legend: {
    type: 'scroll',
    orient: 'vertical',
    right: '10',
    top: '20',
    bottom: '10',
    itemGap: 5,
    data: [] as string[],
    selected: {}
  },
  calculable: true,
  series: [] as EChartSeries[]
})

const expenseSelected = computed(() => {
  return catType.value === 'expense' ? 'success' : ''
})

const incomeSelected = computed(() => {
  return catType.value === 'income' ? 'success' : ''
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

const setOption = () => {
  option.value.legend.data = names[catType.value]
  option.value.legend.selected = selected.value[catType.value]
  option.value.series = [
    {
      name: '支出',
      type: 'pie',
      clockwise:false,
      center,
      data: datas[catType.value],
    }
  ]
}

const processData = (dataArray: any[], dataType: 'expense' | 'income') => {
  const tmpNames: string[] = []
  const tmpDatas: ChartDataItem[] = []

  dataArray.forEach((item: any) => {
    tmpNames.push(item.category_name)
    const x = Number(item.x)
    selected.value[dataType][item.category_name] = x > 100
    tmpDatas.push({
      value: x,
      name: item.category_name,
      label: itemLabel
    })
  })

  names[dataType] = tmpNames
  datas[dataType] = tmpDatas
}

watch(
  () => props.data,
  (newValue) => {
    if (newValue) {
      if (newValue.expense) {
        processData(newValue.expense, 'expense')
      }
      if (newValue.income) {
        processData(newValue.income, 'income')
      }
      setOption()
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

const handelType = (type: 'expense' | 'income') => {
  catType.value = type
  emit('changeType', type)
  setOption()
  updateChart()
}

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
  <div>
    <div ref="chartRef" class="chart"></div>
    <div class="chart-button">
      <el-button :type="expenseSelected" :icon="Minus" @click="handelType('expense')">支出</el-button>
      <el-button :type="incomeSelected" :icon="Plus" @click="handelType('income')">收入</el-button>
    </div>
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 350px;
}
.chart-button {
  position: absolute;
  top: 20px;
}
</style>

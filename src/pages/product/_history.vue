<script lang="ts" setup>
import { LineChart } from "echarts/charts"
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent } from "echarts/components"
import * as echarts from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { getProductPriceHistory } from "./apis"

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  id: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(["close", "success"])

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer
])

const chartRef = ref(null)
let chartInstance: echarts.ECharts | null = null

const loading = ref(false)
const historyData = ref<any>()
const priceHistory = ref<any>([])

// 计算图表配置选项
const option = computed(() => {
  if (!priceHistory.value.length) {
    return {
      title: {
        text: "暂无价格数据",
        left: "center",
        top: "center",
        textStyle: {
          color: "#999",
          fontSize: 16
        }
      }
    }
  }

  return {
    title: {
      text: "商品历史价格趋势",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold"
      }
    },
    tooltip: {
      trigger: "axis",
      formatter(params: any) {
        const data = params[0]
        return `${data.axisValue}<br/>价格: ¥${data.value}`
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: priceHistory.value.map((item: any) => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: "value",
      name: "价格 (¥)",
      axisLabel: {
        formatter: "¥{value}"
      }
    },
    series: [
      {
        name: "价格",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: "#409EFF"
        },
        itemStyle: {
          color: "#409EFF"
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(64, 158, 255, 0.3)"
              },
              {
                offset: 1,
                color: "rgba(64, 158, 255, 0.1)"
              }
            ]
          }
        },
        data: priceHistory.value.map((item: any) => item.price)
      }
    ]
  }
})

// 获取产品历史数据
async function fetchProductHistory() {
  if (!props.id) return

  loading.value = true
  try {
    // 获取订单项历史数据
    const historyRes = await getProductPriceHistory(props.id)
    if (historyRes.code !== 0) {
      ElMessage.error(historyRes.message)
      return
    }
    historyData.value = historyRes.data || {}

    // 处理价格历史数据
    processPriceHistory()
  } catch (error) {
    console.error("获取产品历史数据失败:", error)
    ElMessage.error("获取产品历史数据失败")
  } finally {
    loading.value = false
  }
}

// 处理价格历史数据
function processPriceHistory() {
  const history = []
  if (historyData.value.priceHistory?.length > 0) {
    // 从订单项中获取价格历史
    const priceMap = new Map()

    historyData.value.priceHistory.forEach((item: any) => {
      const date = new Date(item.updatedAt).toLocaleDateString()
      const price = item.uniPrice || historyData.value.basePrice || 0

      if (!priceMap.has(date) || priceMap.get(date) < price) {
        priceMap.set(date, price)
      }
    })

    // 转换为数组并排序
    for (const [date, price] of priceMap) {
      history.push({ date, price })
    }

    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } else if (historyData.value?.basePrice) {
    // 如果没有订单历史，使用基础价格画一条直线
    const today = new Date().toLocaleDateString()
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()

    history.push(
      { date: lastMonth, price: historyData.value.basePrice },
      { date: today, price: historyData.value.basePrice }
    )
  }
  priceHistory.value = history
  updateChart()
}

function initChart() {
  if (chartRef.value && chartInstance == null) {
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

function close() {
  emit("close")
}

// 监听props变化
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && props.id) {
      await fetchProductHistory()
      // 等待下一个 tick 确保 DOM 渲染完成
      await nextTick()
      initChart()
    }
  },
  { immediate: true }
)

// 移除 onMounted 中的 initChart 调用
onMounted(() => {
  // initChart() // 删除这行
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
  <el-dialog
    title="商品历史价格曲线"
    :model-value="props.visible"
    width="800px"
    @close="close"
  >
    <div ref="chartRef" class="chart" />
    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-content {
  min-height: 400px;
  padding: 20px 0;
}

.chart {
  width: 100%;
  height: 400px;
  min-height: 400px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-align: center;
}
</style>

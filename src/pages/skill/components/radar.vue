<script setup lang="ts">
import * as echarts from "echarts"
import { onMounted, ref, onUnmounted } from 'vue'

// 图表实例
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

// 雷达图数据
const radarData = {
  // 雷达图指标
  indicator: [
    { name: '技术能力', max: 100 },
    { name: '沟通协作', max: 100 },
    { name: '学习能力', max: 100 },
    { name: '解决问题', max: 100 },
    { name: '创新思维', max: 100 },
    { name: '项目管理', max: 100 }
  ],
  // 用户技能评分数据
  series: [
    {
      name: '当前技能水平',
      value: [85, 78, 92, 88, 75, 82],
      itemStyle: {
        color: '#4facfe'
      },
      areaStyle: {
        color: 'rgba(79, 172, 254, 0.3)'
      }
    },
    {
      name: '目标技能水平',
      value: [95, 90, 95, 92, 88, 90],
      itemStyle: {
        color: '#f093fb'
      },
      areaStyle: {
        color: 'rgba(240, 147, 251, 0.2)'
      }
    }
  ]
}

// 初始化图表
function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const option = {
    title: {
      text: '技能雷达图',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#303133'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const data = params.data
        const indicator = radarData.indicator[params.dataIndex]
        return `${data.name}<br/>${indicator.name}: ${data.value[params.dataIndex]}`
      }
    },
    legend: {
      data: ['当前技能水平', '目标技能水平'],
      bottom: 10,
      textStyle: {
        fontSize: 12
      }
    },
    radar: {
      indicator: radarData.indicator,
      center: ['50%', '55%'],
      radius: '65%',
      startAngle: 90,
      splitNumber: 4,
      shape: 'polygon',
      name: {
        formatter: '{value}',
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(114, 172, 209, 0.1)', 'rgba(114, 172, 209, 0.05)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(114, 172, 209, 0.3)'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(114, 172, 209, 0.3)'
        }
      }
    },
    series: [
      {
        name: '技能评分',
        type: 'radar',
        data: radarData.series.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: item.itemStyle,
          areaStyle: item.areaStyle,
          lineStyle: {
            width: 2
          },
          symbol: 'circle',
          symbolSize: 6
        }))
      }
    ]
  }

  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 组件挂载
onMounted(() => {
  initChart()
})

// 组件卸载
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="radar-chart-container">
    <div ref="chartRef" class="radar-chart"></div>
  </div>
</template>

<style scoped>
.radar-chart-container {
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.radar-chart {
  width: 100%;
  height: 350px;
}
</style>

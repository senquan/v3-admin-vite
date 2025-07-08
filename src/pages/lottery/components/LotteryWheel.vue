<script setup>
import { onMounted, ref, watch } from "vue"

const props = defineProps({
  prizes: {
    type: Array,
    required: true
  },
  isSpinning: {
    type: Boolean,
    default: false
  },
  currentPrize: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(["spin"])

const canvasRef = ref(null)
const wheelRotation = ref(0)
const finalRotation = ref(0)

const wheelSize = 400
const centerX = wheelSize / 2
const centerY = wheelSize / 2
const radius = wheelSize / 2 - 20

// 绘制转盘
function drawWheel() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  const prizes = props.prizes
  const anglePerPrize = (2 * Math.PI) / prizes.length

  // 清空画布
  ctx.clearRect(0, 0, wheelSize, wheelSize)

  // 绘制转盘背景
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate((wheelRotation.value * Math.PI) / 180)

  prizes.forEach((prize, index) => {
    // 从-90度开始绘制，让第一个奖品在顶部
    const startAngle = index * anglePerPrize - Math.PI / 2
    const endAngle = (index + 1) * anglePerPrize - Math.PI / 2

    // 绘制扇形
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = prize.color
    ctx.fill()

    // 绘制边框
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制文字
    ctx.save()
    ctx.rotate(startAngle + anglePerPrize / 2)
    ctx.textAlign = "center"
    ctx.fillStyle = "#fff"
    ctx.font = "bold 14px Arial"
    ctx.shadowColor = "rgba(0,0,0,0.5)"
    ctx.shadowBlur = 2

    // 绘制图标
    ctx.font = "24px Arial"
    ctx.fillText(prize.icon, radius * 0.7, -5)

    // 绘制奖品名称
    ctx.font = "bold 12px Arial"
    ctx.fillText(prize.name, radius * 0.7, 15)

    ctx.restore()
  })

  ctx.restore()

  // 绘制中心圆
  ctx.beginPath()
  ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 3
  ctx.stroke()

  // 绘制指针
  ctx.beginPath()
  ctx.moveTo(centerX, 20)
  ctx.lineTo(centerX - 15, 50)
  ctx.lineTo(centerX + 15, 50)
  ctx.closePath()
  ctx.fillStyle = "#E74C3C"
  ctx.fill()
  ctx.strokeStyle = "#C0392B"
  ctx.lineWidth = 2
  ctx.stroke()
}

// 开始转动
function startSpin() {
  if (props.isSpinning) return
  emit("spin")
}

// 监听转动状态
watch(() => props.isSpinning, (isSpinning) => {
  if (isSpinning && props.currentPrize) {
    // 转盘复位到初始位置
    wheelRotation.value = 0

    // 计算最终角度 - 确保逆时针旋转
    const prizeIndex = props.prizes.findIndex(p => p.id === props.currentPrize.id)
    const anglePerPrize = 360 / props.prizes.length
    const targetAngle = prizeIndex * anglePerPrize
    const spins = 5 + Math.floor(Math.random() * 3) // 5到7圈随机
    const randomOffset = Math.random() * anglePerPrize // 随机偏移
    finalRotation.value = spins * 360 - targetAngle - randomOffset

    // 开始动画
    animateWheel()
  }
})

// 转盘动画
function animateWheel() {
  const startRotation = wheelRotation.value
  const endRotation = finalRotation.value
  const duration = 3000 // 3秒
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用缓动函数
    const easeOut = 1 - (1 - progress) ** 3
    wheelRotation.value = startRotation + (endRotation - startRotation) * easeOut

    drawWheel()

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

// 监听当前奖品变化
watch(() => props.currentPrize, (prize) => {
  if (prize && !props.isSpinning) {
    // 转动结束后的处理
    setTimeout(() => {
      drawWheel()
    }, 100)
  }
})

onMounted(() => {
  drawWheel()
})

// 监听奖品变化重新绘制
watch(() => props.prizes, () => {
  drawWheel()
}, { deep: true })
</script>

<template>
  <div class="lottery-wheel">
    <div class="wheel-container">
      <canvas
        ref="canvasRef"
        :width="wheelSize"
        :height="wheelSize"
        class="wheel-canvas"
      />

      <div class="spin-button-container">
        <el-button
          type="primary"
          size="large"
          :loading="isSpinning"
          :disabled="isSpinning"
          @click="startSpin"
          class="spin-button"
        >
          <span v-if="!isSpinning">🎰 开始抽奖</span>
          <span v-else>转动中...</span>
        </el-button>
      </div>
    </div>

    <!-- 转盘装饰 -->
    <div class="wheel-decoration">
      <div class="decoration-ring ring-1" />
      <div class="decoration-ring ring-2" />
      <div class="decoration-ring ring-3" />
    </div>
  </div>
</template>

<style scoped>
.lottery-wheel {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wheel-container {
  position: relative;
  z-index: 10;
}

.wheel-canvas {
  border-radius: 50%;
  box-shadow:
    0 0 20px rgba(0, 0, 0, 0.3),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  background: conic-gradient(from 0deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff, #5f27cd);
}

.spin-button-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
}

.spin-button {
  width: 120px;
  height: 50px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.spin-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.spin-button:active:not(:disabled) {
  transform: translateY(0);
}

.wheel-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.decoration-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 20s linear infinite;
}

.ring-1 {
  width: 450px;
  height: 450px;
  animation-duration: 30s;
}

.ring-2 {
  width: 500px;
  height: 500px;
  animation-duration: 40s;
  animation-direction: reverse;
}

.ring-3 {
  width: 550px;
  height: 550px;
  animation-duration: 50s;
}

@keyframes rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@media (max-width: 768px) {
  .wheel-canvas {
    width: 300px !important;
    height: 300px !important;
  }

  .spin-button {
    width: 100px;
    height: 40px;
    font-size: 14px;
  }

  .ring-1 {
    width: 350px;
    height: 350px;
  }

  .ring-2 {
    width: 400px;
    height: 400px;
  }

  .ring-3 {
    width: 450px;
    height: 450px;
  }
}
</style>

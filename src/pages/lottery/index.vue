<script lang="jsx" setup>
import { ElMessage } from "element-plus"
import { onMounted, ref, watch } from "vue"
import LotteryWheel from "./components/LotteryWheel.vue"
import PrizeList from "./components/PrizeList.vue"
import prizeConfig from "./config/prizes.json"

const isSpinning = ref(false)
const currentPrize = ref(null)
const userPrizes = ref([])
const remainingChances = ref(3) // 每日抽奖次数

// 抽奖逻辑
function handleSpin() {
  if (isSpinning.value) {
    ElMessage.warning("转盘正在转动中，请稍候...")
    return
  }

  if (remainingChances.value <= 0) {
    ElMessage.warning("今日抽奖次数已用完，明天再来吧！")
    return
  }

  // 先确定中奖结果
  const randomIndex = Math.floor(Math.random() * prizeConfig.prizes.length)
  const prize = prizeConfig.prizes[randomIndex]
  console.log(`选中奖品索引: ${randomIndex}, 奖品:`, prize)
  currentPrize.value = prize

  isSpinning.value = true
  remainingChances.value--

  // 转盘转动结束后的处理
  setTimeout(() => {
    // 添加到用户奖品列表
    userPrizes.value.unshift({
      ...prize,
      time: new Date().toLocaleString(),
      id: Date.now()
    })

    isSpinning.value = false

    if (prize.type !== "empty") {
      ElMessage.success(`恭喜您获得：${prize.name}！`)
    } else {
      ElMessage.info("很遗憾，这次没有中奖，再试一次吧！")
    }
  }, 3000) // 转盘转动3秒
}

// 重置抽奖次数（模拟每日重置）
function resetChances() {
  remainingChances.value = 3
  ElMessage.success("抽奖次数已重置！")
}

onMounted(() => {
  // 调试：检查奖品配置数据
  console.log("=== 奖品配置数据检查 ===")
  console.log("prizeConfig:", prizeConfig)
  console.log("prizeConfig.prizes:", prizeConfig.prizes)
  console.log("prizeConfig.prizes.length:", prizeConfig.prizes?.length)

  // 页面加载时可以从本地存储获取用户历史奖品
  const savedPrizes = localStorage.getItem("userPrizes")
  if (savedPrizes) {
    userPrizes.value = JSON.parse(savedPrizes)
  }
})

// 监听用户奖品变化，保存到本地存储
watch(userPrizes, (newPrizes) => {
  localStorage.setItem("userPrizes", JSON.stringify(newPrizes))
}, { deep: true })
</script>

<template>
  <div class="lottery-page">
    <div class="lottery-header">
      <h1 class="page-title">🎰 幸运大转盘</h1>
      <div class="chances-info">
        <span class="chances-text">剩余抽奖次数：</span>
        <span class="chances-count">{{ remainingChances }}</span>
        <el-button
          type="primary"
          size="small"
          @click="resetChances"
          style="margin-left: 10px"
        >
          重置次数
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="16">
        <div class="wheel-container">
          <LotteryWheel
            :prizes="prizeConfig.prizes"
            :is-spinning="isSpinning"
            :current-prize="currentPrize"
            @spin="handleSpin"
          />
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="8">
        <div class="prize-container">
          <PrizeList :prizes="userPrizes" />
        </div>
      </el-col>
    </el-row>

    <div class="rules-section">
      <el-card class="rules-card">
        <template #header>
          <span class="rules-title">🎯 抽奖规则</span>
        </template>
        <ul class="rules-list">
          <li>单日经验值每增长50获取一次抽奖机会</li>
          <li>奖品包括手机时间、礼金、外卖、实物奖品等</li>
          <li>中奖结果实时显示，奖品自动发放到账户</li>
          <li>活动最终解释权归平台所有</li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.lottery-page {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.lottery-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.page-title {
  font-size: 2.5rem;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.chances-info {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.chances-count {
  color: #ffd700;
  font-weight: bold;
  font-size: 1.4rem;
}

.wheel-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.prize-container {
  height: 500px;
}

.rules-section {
  margin-top: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.rules-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.rules-title {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
  position: relative;
  padding-left: 20px;
}

.rules-list li:before {
  content: "•";
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.rules-list li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .lottery-page {
    padding: 10px;
  }

  .page-title {
    font-size: 2rem;
  }

  .wheel-container {
    min-height: 400px;
  }

  .prize-container {
    height: auto;
    margin-top: 20px;
  }
}
</style>

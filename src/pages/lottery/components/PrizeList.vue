<script setup>
import { computed } from "vue"

const props = defineProps({
  prizes: {
    type: Array,
    default: () => []
  }
})

// 计算奖品统计
const prizeStats = computed(() => {
  const stats = {
    total: props.prizes.length,
    points: 0,
    coupons: 0,
    gifts: 0,
    retries: 0
  }

  props.prizes.forEach((prize) => {
    switch (prize.type) {
      case "points":
        stats.points += prize.value
        break
      case "coupon":
        stats.coupons++
        break
      case "gift":
        stats.gifts++
        break
      case "retry":
        stats.retries++
        break
    }
  })

  return stats
})

// 获取奖品类型图标
function getPrizeTypeIcon(type) {
  const icons = {
    points: "🎯",
    coupon: "🎫",
    gift: "🎁",
    retry: "🔄",
    empty: "😊"
  }
  return icons[type] || "🎁"
}

// 获取奖品类型颜色
function getPrizeTypeColor(type) {
  const colors = {
    points: "#F39C12",
    coupon: "#3498DB",
    gift: "#9B59B6",
    retry: "#2ECC71",
    empty: "#95A5A6"
  }
  return colors[type] || "#95A5A6"
}

// 格式化奖品描述
function formatPrizeDescription(prize) {
  switch (prize.type) {
    case "points":
      return `+${prize.value}积分`
    case "coupon":
      return `${prize.value}元优惠券`
    case "gift":
      return "实物礼品"
    case "retry":
      return "额外抽奖机会"
    case "empty":
      return "谢谢参与"
    default:
      return prize.description || prize.name
  }
}
</script>

<template>
  <div class="prize-list">
    <el-card class="prize-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">🏆 我的奖品</span>
          <el-badge :value="prizeStats.total" class="prize-badge" />
        </div>
      </template>

      <!-- 奖品统计 -->
      <div class="prize-stats">
        <div class="stat-item">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <div class="stat-label">积分</div>
            <div class="stat-value">{{ prizeStats.points }}</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">🎫</div>
          <div class="stat-info">
            <div class="stat-label">优惠券</div>
            <div class="stat-value">{{ prizeStats.coupons }}</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">🎁</div>
          <div class="stat-info">
            <div class="stat-label">礼品</div>
            <div class="stat-value">{{ prizeStats.gifts }}</div>
          </div>
        </div>
      </div>

      <!-- 奖品列表 -->
      <div class="prize-history">
        <div class="history-header">
          <span>🕐 抽奖记录</span>
        </div>

        <div class="prize-list-container">
          <el-scrollbar height="300px">
            <div v-if="prizes.length === 0" class="empty-state">
              <div class="empty-icon">🎰</div>
              <div class="empty-text">还没有抽奖记录</div>
              <div class="empty-hint">快去转动转盘试试手气吧！</div>
            </div>

            <div
              v-for="(prize, index) in prizes"
              :key="prize.id || index"
              class="prize-item"
              :class="{ 'prize-highlight': prize.type !== 'empty' }"
            >
              <div class="prize-icon" :style="{ color: getPrizeTypeColor(prize.type) }">
                {{ prize.icon || getPrizeTypeIcon(prize.type) }}
              </div>

              <div class="prize-content">
                <div class="prize-name">{{ prize.name }}</div>
                <div class="prize-desc">{{ formatPrizeDescription(prize) }}</div>
                <div class="prize-time">{{ prize.time }}</div>
              </div>

              <div class="prize-status">
                <el-tag
                  :type="prize.type === 'empty' ? 'info' : 'success'"
                  size="small"
                  effect="plain"
                >
                  {{ prize.type === 'empty' ? '未中奖' : '已获得' }}
                </el-tag>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.prize-list {
  height: 100%;
}

.prize-card {
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.prize-badge {
  margin-left: 10px;
}

.prize-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-info {
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
}

.prize-history {
  margin-top: 20px;
}

.history-header {
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.prize-list-container {
  max-height: 300px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.empty-hint {
  font-size: 0.9rem;
  opacity: 0.7;
}

.prize-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.prize-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.prize-highlight {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
  border-left: 4px solid #667eea;
}

.prize-highlight:hover {
  background: linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%);
}

.prize-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  min-width: 30px;
  text-align: center;
}

.prize-content {
  flex: 1;
}

.prize-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.prize-desc {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 2px;
}

.prize-time {
  font-size: 0.8rem;
  color: #999;
}

.prize-status {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .prize-stats {
    flex-direction: column;
    gap: 10px;
  }

  .stat-item {
    justify-content: center;
  }

  .prize-item {
    padding: 10px;
  }

  .prize-icon {
    font-size: 1.2rem;
    margin-right: 8px;
  }
}
</style>

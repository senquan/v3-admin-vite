<script setup lang="ts">
import { Coin, CreditCard, DataAnalysis, Money, OfficeBuilding, PieChart } from "@element-plus/icons-vue"
import { useRouter } from "vue-router"

const router = useRouter()

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="finance-dashboard">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>财务管理平台</span>
        </div>
      </template>
      <div class="dashboard-content">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-number">¥1,234,567</div>
                <div class="stat-label">总存款余额</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-number">¥890,123</div>
                <div class="stat-label">代垫费用总额</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-number">¥456,789</div>
                <div class="stat-label">利润上缴总额</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-number">12</div>
                <div class="stat-label">下属单位数量</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-20">
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>存款趋势分析</span>
                </div>
              </template>
              <div class="chart-container">
                <!-- 这里将放置图表 -->
                <div class="chart-placeholder">
                  <el-icon size="48"><PieChart /></el-icon>
                  <p>存款趋势图表</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="chart-card">
              <template #header>
                <div class="card-header">
                  <span>费用分布情况</span>
                </div>
              </template>
              <div class="chart-container">
                <div class="chart-placeholder">
                  <el-icon size="48"><DataAnalysis /></el-icon>
                  <p>费用分布图表</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-20">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>快捷操作</span>
                </div>
              </template>
              <div class="quick-actions">
                <el-button type="primary" @click="navigateTo('/finance/companies')">
                  <el-icon><OfficeBuilding /></el-icon>
                  单位管理
                </el-button>
                <el-button type="success" @click="navigateTo('/finance/deposits')">
                  <el-icon><CreditCard /></el-icon>
                  存款管理
                </el-button>
                <el-button type="warning" @click="navigateTo('/finance/expenses')">
                  <el-icon><Coin /></el-icon>
                  费用管理
                </el-button>
                <el-button type="danger" @click="navigateTo('/finance/payments')">
                  <el-icon><Money /></el-icon>
                  利润上缴
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.finance-dashboard {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.chart-card {
  height: 300px;
}

.chart-container {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin-top: 10px;
  font-size: 14px;
}

.quick-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.mt-20 {
  margin-top: 20px;
}
</style>

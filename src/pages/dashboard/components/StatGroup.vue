<script lang="ts" setup>
import { useTransition } from "@vueuse/core"

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const monthOrderAmount = computed(() => {
  if (!props.data.monthOrderAmount) return 0
  return Math.round(Number.parseFloat(props.data.monthOrderAmount) * 100) / 100
})

const monthTicketAmount = computed(() => {
  if (!props.data.monthTicketAmount) return 0
  return Math.round(Number.parseFloat(props.data.monthTicketAmount) * 100) / 100
})

const monthOrderCount = computed(() => {
  if (!props.data.monthOrderCount) return 0
  return Math.round(Number.parseFloat(props.data.monthOrderCount) * 100) / 100
})

const monthCustomerCount = computed(() => {
  if (!props.data.monthCustomerCount) return 0
  return Math.round(Number.parseFloat(props.data.monthCustomerCount) * 100) / 100
})

const transitionOrderAmount = useTransition(monthOrderAmount)
const transitionTicketAmount = useTransition(monthTicketAmount)
const transitionOrderCount = useTransition(monthOrderCount)
const transitionCustomerCount = useTransition(monthCustomerCount)
</script>

<template>
  <div class="app-container">
    <el-row>
      <el-col :sm="12" :md="12" :lg="12" :xl="12" class="card-data-col">
        <div class="card-data card-blue">
          <div class="card-data-icon-wrapper card-data-icon icon-money">
            <Money style="width: 48px; height: 48px;" />
          </div>
          <div class="card-data-description">
            <el-statistic title="本月订单总额" :value="transitionOrderAmount" :precision="2" value-style="font-size: 32px;" />
            <div class="card-data-text">已完成订单总额：{{ props.data.monthFinished || 0 }}</div>
            <div class="card-data-text">售后订单总额：{{ props.data.monthCs || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :sm="12" :md="12" :lg="12" :xl="12" class="card-data-col">
        <div class="card-data card-green">
          <div class="card-data-icon-wrapper card-data-icon icon-money">
            <DocumentChecked style="width: 48px; height: 48px;" />
          </div>
          <div class="card-data-description">
            <el-statistic title="本月处理工单" :value="transitionTicketAmount" value-style="font-size: 32px;" />
            <div class="card-data-text">工单总量：{{ props.data.monthTotalTickets || 0 }}</div>
            <div class="card-data-text">完成率：{{ props.data.monthTicketRate || 0 }} %</div>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row>
      <el-col :sm="12" :md="12" :lg="12" :xl="12" class="card-data-col">
        <div class="card-data card-orange">
          <div class="card-data-icon-wrapper card-data-icon icon-money">
            <Document style="width: 48px; height: 48px;" />
          </div>
          <div class="card-data-description">
            <el-statistic title="订单总数" :value="transitionOrderCount" value-style="font-size: 32px;" />
            <div class="card-data-text">已完成订单总数：{{ props.data.monthFinishedCount || 0 }}</div>
            <div class="card-data-text">售后订单总数：{{ props.data.monthCsCount || 0 }}</div>
          </div>
        </div>
      </el-col>
      <el-col :sm="12" :md="12" :lg="12" :xl="12" class="card-data-col">
        <div class="card-data card-purple">
          <div class="card-data-icon-wrapper card-data-icon icon-money">
            <User style="width: 48px; height: 48px;" />
          </div>
          <div class="card-data-description">
            <el-statistic title="新增客户数" :value="transitionCustomerCount" value-style="font-size: 32px;" />
            <div class="card-data-text">客户总数：{{ props.data.totalCustomerCount || 0 }}</div>
            <div class="card-data-text">本月回购客户总数：{{ props.data.monthBackCount || 0 }}</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.app-container .el-row {
  display: flex;
  flex-wrap: wrap;
  margin: 10px 0;
}
.card-data {
  height: 120px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  overflow: hidden;
  color: #666;
  background: #fff;
  box-shadow: 4px 4px 40px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.05);
  &:hover {
    .card-data-icon-wrapper {
      color: green;
    }
  }
  .card-data-icon-wrapper {
    float: left;
    margin: 14px 0 0 10px;
    padding: 16px;
    transition: all 0.38s ease-out;
    border-radius: 6px;
  }
  .card-data-description {
    float: right;
    font-weight: bold;
    margin: 10px;
    margin-left: 0px;
    .card-data-text {
      text-align: right;
      line-height: 14px;
      color: rgba(0, 0, 0, 0.45);
      font-size: 14px;
      margin-top: 3px;
    }
    .el-statistic {
      text-align: right;
    }
  }
  .card-data-icon {
    float: left;
    font-size: 48px;
  }
  &.card-blue {
    background-color: #e6f7ff;
    border-left: 4px solid #1890ff;
  }
  &.card-blue:hover .card-data-icon-wrapper {
    color: #1890ff;
  }
  &.card-green {
    background-color: #f6ffed;
    border-left: 4px solid #52c41a;
  }
  &.card-green:hover .card-data-icon-wrapper {
    color: #52c41a;
  }
  &.card-orange {
    background-color: #fff7e6;
    border-left: 4px solid #fa8c16;
  }
  &.card-purple {
    background-color: #f9f0ff;
    border-left: 4px solid #722ed1;
  }
}
</style>

<style>
.app-container {
  padding: 0;
}
</style>

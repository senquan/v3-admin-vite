<script lang="ts" setup>
import { useTransition } from '@vueuse/core'

const props = defineProps({
  data: {
    type: Object,
    default: () => []
  }
})

const normalassets = computed(() => {
  if (!props.data.normal) return 0
  return Math.round((parseFloat(props.data.normal) - parseFloat(props.data.debt)) * 100) / 100
})

const transitionNormalAssets = useTransition(normalassets)

const percentage = computed(() => {
  return 0
})

const dreamprocess = computed(() => {
  return '0 / 0'
})

const remaining = computed(() => {
  if (!props.data.current_in) return 0
  return Math.round((parseFloat(props.data.current_in) - parseFloat(props.data.current_out)) * 100) / 100
})

const liquidremain = computed(() => {
  if (!props.data.liquid) return 0
  return Math.round((props.data.liquid - props.data.credit) * 100) / 100
})

const budgetnew = computed(() => {
  return Math.round(props.data.budget_new * 100) / 100
})
</script>

<template>
  <el-col :xs="12" :sm="12" :lg="6" class="card-data-col">
    <div class="card-data">
      <div class="card-data-icon-wrapper card-data-icon icon-money">
        <Money style="width: 48px; height: 48px;" />
      </div>
      <div class="card-data-description">
        <el-statistic title="常规净资产" :value="transitionNormalAssets" :precision=2 value-style="font-size: 32px;" />
        <div class="card-data-text">{{ "分期付款：" + props.data.amortized }}</div>
        <div class="card-data-text">{{ "信用卡欠款：" + props.data.credit }}</div>
      </div>
    </div>
  </el-col>
  <el-col :xs="12" :sm="12" :lg="6" class="card-data-col">
    <div class="card-data">
      <div class="card-data-icon-wrapper card-data-icon icon-money">
        <Calendar style="width: 48px; height: 48px;" />
      </div>
      <div class="card-data-description">
        <el-statistic title="梦想储钱罐" :value="percentage" :precision=2 value-style="font-size: 32px;">
          <template #suffix>%</template>
        </el-statistic>
        <div class="card-data-text">下一个梦想：未设置</div>
        <div class="card-data-text">{{ "已完成：" + dreamprocess }}</div>
      </div>
    </div>
  </el-col>
  <el-col :xs="12" :sm="12" :lg="6" class="card-data-col">
    <div class="card-data">
      <div class="card-data-icon-wrapper card-data-icon icon-money">
        <CreditCard style="width: 48px; height: 48px;" />
      </div>
      <div class="card-data-description">
        <el-statistic title="当月收入余额" :value="remaining" :precision=2 value-style="font-size: 32px;" />
        <div class="card-data-text">{{ "现金流余额：" + props.data.liquid }}</div>
        <div class="card-data-text">{{ "相对可支配现金余额：" + liquidremain }}</div>
      </div>
    </div>
  </el-col>
  <el-col :xs="12" :sm="12" :lg="6" class="card-data-col">
    <div class="card-data">
      <div class="card-data-icon-wrapper card-data-icon icon-money">
        <Coin style="width: 48px; height: 48px;" />
      </div>
      <div class="card-data-description">
        <el-statistic title="预算占用余额" :value="parseFloat(props.data.budget)" :precision=2 value-style="font-size: 32px;" />
        <div class="card-data-text">{{ "本月使用预算：" + budgetnew }}</div>
      </div>
    </div>
  </el-col>
</template>

<style scoped lang="scss">
.card-data {
  height: 108px;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  overflow: hidden;
  color: #666;
  background: #fff;
  box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
  border-color: rgba(0, 0, 0, .05);
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
}
</style>

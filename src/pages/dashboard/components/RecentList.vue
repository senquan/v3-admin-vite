<script lang="ts" setup>

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})
const tableData = ref<any[]>([])

watch(
  () => props.data,
  (newValue) => {
    tableData.value = newValue
  },
  { immediate: true }
)

watch(
  () => props.loading,
  (newValue) => {
    console.log("loading", newValue)
  }
)
</script>

<template>
  <div class="recent-list">
    <div class="recent-list-title">本月最大支出</div>
    <div class="recent-list-content">
      <el-table :data="tableData" v-loading="props.loading" style="width: 100%">
        <el-table-column prop="date" label="日期" width="80" />
        <el-table-column prop="name" label="事项" min-width="200" />
        <el-table-column prop="amount" label="金额" width="80" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.recent-list {
  background-color: #fff;
}
.recent-list-title {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  padding: 3px 0;
}
</style>

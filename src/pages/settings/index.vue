<script lang="ts" setup>
import DictTab from "./components/DictTab.vue"

const dictTabRef = ref<InstanceType<typeof DictTab>>()

onMounted(() => {
  dictTabRef.value?.fetchList()
})
</script>

<template>
  <el-tabs type="border-card">
    <el-tab-pane label="字典设置">
      <DictTab ref="dictTabRef" />
    </el-tab-pane>
  </el-tabs>
</template>

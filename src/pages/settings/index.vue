<script lang="ts" setup>
import BasicTab from "./components/BasicTab.vue"
import DictTab from "./components/DictTab.vue"

const basicTabRef = ref<InstanceType<typeof BasicTab>>()
const dictTabRef = ref<InstanceType<typeof DictTab>>()

function handleTabClick(tab: any): void {
  if (tab.paneName === "1") {
    dictTabRef.value?.fetchList()
  }
}
onMounted(() => {
  basicTabRef.value?.fetchSettings()
})
</script>

<template>
  <el-tabs type="border-card" @tab-click="handleTabClick">
    <el-tab-pane label="基础设置">
      <BasicTab ref="basicTabRef" />
    </el-tab-pane>
    <el-tab-pane label="字典设置">
      <DictTab ref="dictTabRef" />
    </el-tab-pane>
  </el-tabs>
</template>

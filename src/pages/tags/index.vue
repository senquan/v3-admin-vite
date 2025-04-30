<script lang="ts" setup>
import CategoryTab from "./components/CategoryTab.vue"
import DictTab from "./components/DictTab.vue"
import ModelTab from "./components/ModelTab.vue"
import SerieTab from "./components/SerieTab.vue"
import SpecTab from "./components/SpecTab.vue"
import TagsTab from "./components/TagsTab.vue"

const tagsTabRef = ref<InstanceType<typeof TagsTab>>()
const specTabRef = ref<InstanceType<typeof SpecTab>>()
const categoryTabRef = ref<InstanceType<typeof CategoryTab>>()
const dictTabRef = ref<InstanceType<typeof DictTab>>()
const serieTabRef = ref<InstanceType<typeof SerieTab>>()
const modelTabRef = ref<InstanceType<typeof SerieTab>>()

function handleTabClick(tab: any): void {
  if (tab.paneName === "0") {
    tagsTabRef.value?.fetchList()
  } else if (tab.paneName === "1") {
    serieTabRef.value?.fetchList()
  } else if (tab.paneName === "2") {
    modelTabRef.value?.fetchList()
  } else if (tab.paneName === "3") {
    specTabRef.value?.fetchList()
  } else if (tab.paneName === "4") {
    categoryTabRef.value?.fetchList()
  } else if (tab.paneName === "5") {
    dictTabRef.value?.fetchList()
  }
}

onMounted(() => {
  tagsTabRef.value?.fetchList()
})
</script>

<template>
  <el-tabs type="border-card" @tab-click="handleTabClick">
    <el-tab-pane label="标签">
      <TagsTab ref="tagsTabRef" />
    </el-tab-pane>
    <el-tab-pane label="系列">
      <SerieTab ref="serieTabRef" />
    </el-tab-pane>
    <el-tab-pane label="型号">
      <ModelTab ref="modelTabRef" />
    </el-tab-pane>
    <el-tab-pane label="规格">
      <SpecTab ref="specTabRef" />
    </el-tab-pane>
    <el-tab-pane label="分类">
      <CategoryTab ref="categoryTabRef" />
    </el-tab-pane>
    <el-tab-pane label="字典">
      <DictTab ref="dictTabRef" />
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import CategoryTab from "./category.vue"
import TagsTab from "./tag.vue"

const tagsTabRef = ref<InstanceType<typeof TagsTab>>()
const categoryTabRef = ref<InstanceType<typeof CategoryTab>>()

function handleTabClick(tab: any): void {
  if (tab.paneName === "1") {
    tagsTabRef.value?.fetchList()
  } else if (tab.paneName === "0") {
    categoryTabRef.value?.fetchList()
  }
}

onMounted(() => {
  categoryTabRef.value?.fetchList()
})
</script>

<template>
  <el-tabs type="border-card" @tab-click="handleTabClick">
    <el-tab-pane label="分类">
      <CategoryTab ref="categoryTabRef" />
    </el-tab-pane>
    <el-tab-pane label="标签">
      <TagsTab ref="tagsTabRef" />
    </el-tab-pane>
  </el-tabs>
</template>

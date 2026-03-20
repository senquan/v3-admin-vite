<script lang="ts" setup>
interface Props {
  avatar?: string
}

defineOptions({
  name: "Greeting"
})

withDefaults(defineProps<Props>(), {
  avatar: ""
})
</script>

<template>
  <div class="card-box p-4 py-6 lg:flex">
    <el-avatar
      v-if="avatar"
      :src="avatar"
      :size="80"
      fit="cover"
    />
    <div
      v-if="$slots.title || $slots.description"
      class="flex flex-col justify-center md:ml-6 md:mt-0"
    >
      <h1 v-if="$slots.title" class="text-md font-semibold md:text-xl">
        <slot name="title" />
      </h1>
      <span v-if="$slots.description" class="text-foreground/80 mt-1">
        <slot name="description" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.card-box {
  border-radius: 12px;
  background: #fff;
}
</style>

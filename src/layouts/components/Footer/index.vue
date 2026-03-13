<script lang="ts" setup>
const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE
const VITE_APP_VERSION = import.meta.env.VITE_APP_VERSION
const VITE_APP_BUILD = import.meta.env.VITE_APP_BUILD
</script>

<template>
  <footer class="layout-footer">
    MIT © 2026-PRESENT {{ VITE_APP_TITLE }} Ver: {{ VITE_APP_VERSION }} Build: {{ VITE_APP_BUILD }}
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  font-size: 14px;
  width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}
</style>

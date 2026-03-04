<script setup lang="ts">
// 这里可以处理一些全局应用级别的挂载逻辑，如 PWA 注册提醒
import { onMounted } from "vue";
import AbstractBackground from "@/components/AbstractBackground.vue";

onMounted(() => {
  // 生产环境可以加上 PWA 的更新提示
});
</script>

<template>
  <!-- 全局抽象图案背景 -->
  <AbstractBackground />

  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>

<style lang="less">
/* 全局基础样式 */
html, body {
  margin: 0;
  padding: 0;
  /* 跟随主题自动切换 */
  background-color: var(--theme-bg);
  min-height: 100vh;
  overflow-x: hidden;
}

// 路由切换动画
.fade {
  &-enter-active,
  &-leave-active {
    transition: opacity 0.3s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }
}
</style>

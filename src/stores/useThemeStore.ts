import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { watch } from 'vue';

export type ThemeName = 'pixel' | 'modern' | 'clay';

/**
 * 主题切换 Store
 * 管理 UI 主题偏好，持久化到 localStorage
 */
export const useThemeStore = defineStore('theme', () => {
  const currentTheme = useLocalStorage<ThemeName>('factopia_theme', 'pixel');

  /** 切换到指定主题 */
  function switchTheme(name: ThemeName) {
    currentTheme.value = name;
  }

  /** 在三种风格之间切换: 像素 -> 现代 -> 黏土 -> 像素 */
  function toggleTheme() {
    const themes: ThemeName[] = ['pixel', 'modern', 'clay'];
    const currentIndex = themes.indexOf(currentTheme.value);
    currentTheme.value = themes[(currentIndex + 1) % themes.length];
  }

  /** 将当前主题应用到 DOM */
  function applyTheme(theme: ThemeName) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // 监听主题变化并自动应用
  watch(
    currentTheme,
    (newTheme) => {
      applyTheme(newTheme);
    },
    { immediate: true }
  );

  return {
    currentTheme,
    switchTheme,
    toggleTheme,
  };
});

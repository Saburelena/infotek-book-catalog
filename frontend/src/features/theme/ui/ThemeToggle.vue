<template>
  <button class="theme-toggle" type="button" :title="label" @click="toggle">
    <span class="theme-toggle-circle" :class="{ dark: isDark }" />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const STORAGE_KEY = "theme";

const html = document.documentElement;

// Тема уже применена inline-скриптом в index.html до отрисовки.
// Здесь только читаем текущее состояние и переключаем по клику.
const current = ref<"dark" | "light">(html.dataset.theme === "light" ? "light" : "dark");

function applyTheme(theme: "dark" | "light") {
  html.classList.toggle("theme-dark", theme === "dark");
  html.classList.toggle("theme-light", theme === "light");
  html.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

const isDark = computed(() => current.value === "dark");
const label = computed(() => (current.value === "dark" ? "Светлая тема" : "Тёмная тема"));

function toggle() {
  current.value = current.value === "dark" ? "light" : "dark";
  applyTheme(current.value);
}
</script>

<style scoped lang="scss">
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.theme-toggle-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(to right, #e2c98a 50%, #2a1a10 50%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.25);
  transition:
    background var(--duration) var(--ease-out),
    box-shadow var(--duration) ease;
}
.theme-toggle-circle.dark {
  background: linear-gradient(to right, #2a1a10 50%, #e2c98a 50%);
}
.theme-toggle:hover .theme-toggle-circle {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.4),
    0 0 0 1px rgba(0, 0, 0, 0.4);
}
.theme-toggle:focus-visible .theme-toggle-circle {
  box-shadow: var(--focus-ring);
}
</style>

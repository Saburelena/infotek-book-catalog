<template>
  <div class="page">
    <a class="skip-link" href="#main-content">К содержанию</a>

    <header class="masthead">
      <div class="masthead-inner">
        <RouterLink :to="ROUTES.home" class="brand" aria-describedby="brand-desc">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="-21.04 9.75 114.3 114.3" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="currentColor"
                d="M20.75 83.98L51.46 44.73Q51.46 38.77 49.54 37.18Q47.61 35.60 41.75 35.60L41.75 33.79L70.41 33.79L70.41 35.60Q64.26 35.79 62.55 37.55Q60.84 39.31 60.84 45.85L60.84 87.94Q60.84 94.48 62.55 96.24Q64.26 98 70.41 98.19L70.41 100L41.75 100L41.75 98.19Q48.05 98 49.76 96.22Q51.46 94.43 51.46 87.94L51.46 49.95L20.75 89.31Q20.80 93.55 21.31 95Q21.83 96.44 23.71 97.27Q25.59 98.10 30.37 98.19L30.37 100L1.81 100L1.81 98.19Q7.96 98 9.67 96.24Q11.38 94.48 11.38 87.94L11.38 45.85Q11.38 39.31 9.67 37.55Q7.96 35.79 1.81 35.60L1.81 33.79L30.37 33.79L30.37 35.60Q24.17 35.79 22.46 37.55Q20.75 39.31 20.75 45.85"
              />
            </svg>
          </span>
          <span class="brand-text">
            <strong class="brand-name">Инфотек</strong>
            <span class="brand-subtitle">каталог книг</span>
          </span>
        </RouterLink>
        <span id="brand-desc" class="sr-only">на главную</span>

        <nav class="masthead-nav" aria-label="Основная навигация">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="masthead-actions">
          <ThemeToggle />
          <template v-if="isUser">
            <span class="who">{{ user?.username }}</span>
            <button class="btn btn-ghost" type="button" @click="onLogout">Выйти</button>
          </template>
          <template v-else-if="route.path === ROUTES.login">
            <RouterLink :to="ROUTES.home" class="btn btn-primary">Назад</RouterLink>
          </template>
          <RouterLink v-else :to="ROUTES.login" class="btn btn-primary">Войти</RouterLink>
        </div>
      </div>
    </header>

    <main id="main-content" class="page-content" tabindex="-1">
      <RouterView />
    </main>

    <footer class="footer">
      <p>Инфотек · каталог книг</p>
      <span class="footer-sep" aria-hidden="true">·</span>
      <nav class="footer-nav" aria-label="Разделы в подвале">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="{ active: isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <span class="footer-sep" aria-hidden="true">·</span>
      <p>© 2026</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

import { useAuth } from "@/features/auth";
import ThemeToggle from "@/features/theme/ui/ThemeToggle.vue";
import { ROUTES } from "@/shared/config/constants";

const nav = [
  { to: ROUTES.home, label: "Книги", exact: true },
  { to: ROUTES.authors, label: "Авторы", exact: false },
  { to: ROUTES.report, label: "ТОП-10", exact: false },
] as const;

const route = useRoute();
const router = useRouter();
const { isUser, user, logout } = useAuth();

function isActive(item: (typeof nav)[number]) {
  return item.exact ? route.path === item.to : route.path === item.to || route.path.startsWith(`${item.to}/`);
}

function onLogout() {
  logout();
  void router.push(ROUTES.home);
}
</script>

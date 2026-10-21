<template>
  <div class="page">
    <a class="skip-link" href="#main-content">К содержанию</a>

    <header class="masthead">
      <div class="masthead-inner">
        <RouterLink :to="ROUTES.home" class="brand" aria-describedby="brand-desc">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>
            <strong>Инфотек</strong>
            &nbsp;
            <em>каталог книг</em>
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

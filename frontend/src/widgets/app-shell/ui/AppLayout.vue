<template>
  <div class="page">
    <a class="skip-link" href="#main-content">К содержанию</a>

    <header class="masthead">
      <div class="masthead-inner">
        <RouterLink :to="ROUTES.home" class="brand" aria-label="Инфотек — каталог книг, на главную">
          <span class="brand-mark" aria-hidden="true">И</span>
          <span>
            <strong>Инфотек</strong>
            <em>каталог книг</em>
          </span>
        </RouterLink>

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
          <template v-if="isUser">
            <span class="who">{{ user?.username }}</span>
            <button class="btn btn-ghost" type="button" @click="onLogout">Выйти</button>
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
      <p>© 2026</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

import { useAuth } from "@/features/auth";
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

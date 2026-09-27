<template>
  <CatalogWidget
    title="Авторы"
    :loading="isLoading"
    :error="isError"
    :empty="items.length === 0"
    :pagination="data?.pagination"
    loading-text="Загружаем авторов…"
    error-text="Не удалось загрузить авторов."
    empty-title="Авторы не найдены"
    empty-text="Измените поисковый запрос."
    @page="set({ page: $event })"
  >
    <template #action>
      <AuthLink :to="ROUTES.authorNew">Добавить автора</AuthLink>
    </template>

    <template #filters>
      <form class="filters" @submit="submit">
        <SearchField :value="filters.search" placeholder="ФИО автора" aria-label="Поиск авторов" />
        <button class="btn btn-primary" type="submit">Найти</button>
      </form>
    </template>

    <div class="author-grid">
      <RouterLink v-for="author in items" :key="author.id" :to="ROUTES.author(author.id)" class="author-card">
        <span class="avatar" aria-hidden="true">{{ (author.full_name || "?").slice(0, 1) }}</span>
        <strong>{{ author.full_name || "Без имени" }}</strong>
      </RouterLink>
    </div>
  </CatalogWidget>
</template>

<script setup lang="ts">
import { useAuthorsQuery } from "@/entities/author";
import { useQueryItems } from "@/shared/lib/query";
import { CatalogWidget } from "@/widgets/catalog";
import { SearchField, useSearchFilter } from "@/features/catalog-filter";
import { AuthLink } from "@/features/auth";
import { PAGE_SIZE, ROUTES } from "@/shared/config/constants";

const { filters, set, submit } = useSearchFilter();
const { isLoading, isError, data } = useAuthorsQuery(() => ({
  page: filters.value.page,
  perPage: PAGE_SIZE.authors,
  search: filters.value.search || undefined,
}));
const items = useQueryItems(data);
</script>

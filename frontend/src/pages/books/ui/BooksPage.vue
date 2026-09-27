<template>
  <CatalogWidget
    title="Книги"
    :loading="isLoading || shouldResetInvalidDefaultPage"
    :error="isError"
    :empty="items.length === 0 && !shouldResetInvalidDefaultPage"
    :pagination="data?.pagination"
    loading-text="Загружаем каталог…"
    error-text="Не удалось загрузить книги."
    empty-text="Сбросьте фильтры или измените запрос."
    @page="set({ page: $event })"
  >
    <template #action>
      <AuthLink :to="ROUTES.bookNew">Добавить книгу</AuthLink>
    </template>

    <template #filters>
      <form class="filters" @submit="submit">
        <SearchField :value="filters.search" placeholder="Название, автор, описание или ISBN" aria-label="Поиск книг" />
        <YearField v-model="year" :years="years" empty-label="Все годы" label="Год" />
        <SelectField v-model="authorId" label="Автор" :options="authorOptions" />
        <button class="btn btn-primary" type="submit">Найти</button>
      </form>
      <p v-if="yearsError" class="field-error">Не удалось загрузить список годов.</p>
      <p v-else-if="authorsError" class="field-error">Не удалось загрузить список авторов для фильтра.</p>
      <p v-else-if="authorsLoading || yearsLoading" class="muted">Обновляем фильтры…</p>
    </template>

    <div class="book-grid">
      <BookCard v-for="book in items" :key="book.id" :book="book" />
    </div>
  </CatalogWidget>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

import { useBooksQuery, BookCard } from "@/entities/book";
import { useAuthorsAllQuery } from "@/entities/author";
import { useCatalogYears } from "@/entities/report";
import { useQueryItems } from "@/shared/lib/query";
import { CatalogWidget } from "@/widgets/catalog";
import { AuthLink } from "@/features/auth";
import { SearchField, SelectField, YearField, useSearchFilter } from "@/features/catalog-filter";
import { PAGE_SIZE, ROUTES } from "@/shared/config/constants";
import { parseId, parseYear } from "@/shared/lib/utils";

const { filters, set, submit, model } = useSearchFilter();
const { isLoading: authorsLoading, isError: authorsError, data: authorsData } = useAuthorsAllQuery();
const { years, loading: yearsLoading, error: yearsError } = useCatalogYears(() => filters.value.year);
const { isLoading, isError, data } = useBooksQuery(() => ({
  page: filters.value.page,
  perPage: PAGE_SIZE.books,
  search: filters.value.search || undefined,
  year: parseYear(filters.value.year),
  author_id: parseId(filters.value.authorId),
}));
const items = useQueryItems(data);
const hasActiveFilters = computed(
  () => Boolean(filters.value.search || filters.value.year || filters.value.authorId),
);
const shouldResetInvalidDefaultPage = computed(() => {
  const pagination = data.value?.pagination;
  return Boolean(
    pagination &&
      !isLoading.value &&
      !isError.value &&
      !hasActiveFilters.value &&
      items.value.length === 0 &&
      filters.value.page > 1 &&
      pagination.total > 0 &&
      filters.value.page > pagination.total_pages,
  );
});

watch(
  () => shouldResetInvalidDefaultPage.value,
  (shouldReset) => {
    if (shouldReset) set({ page: 1 });
  },
  { flush: "post" },
);
const authorItems = useQueryItems(authorsData);
const authorOptions = computed(() => [
  { value: "", label: "Все авторы" },
  ...authorItems.value.map((author) => ({ value: String(author.id), label: author.full_name })),
]);
const year = model("year");
const authorId = model("author_id");
</script>

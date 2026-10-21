<template>
  <section class="catalog">
    <PageHeader :title="title">
      <slot name="action" />
    </PageHeader>

    <slot name="filters" />

    <QueryStatus
      :loading="loading"
      :error="error"
      :empty="empty"
      :loading-text="loadingText"
      :error-text="errorText"
      :empty-title="emptyTitle"
      :empty-text="emptyText"
      :skeleton="true"
      :retryable="true"
      @retry="$emit('retry')"
    />

    <template v-if="ready">
      <slot />
      <nav v-if="totalPages > 1" class="pager" aria-label="Страницы">
        <button
          type="button"
          :disabled="page <= 1"
          :aria-label="`Назад, текущая страница ${page}`"
          @click="emit('page', page - 1)"
        >
          Назад
        </button>
        <span aria-live="polite">Страница {{ page }} из {{ totalPages }}</span>
        <button
          type="button"
          :disabled="page >= totalPages"
          :aria-label="`Дальше, текущая страница ${page}`"
          @click="emit('page', page + 1)"
        >
          Дальше
        </button>
      </nav>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import PageHeader from "@/shared/ui/PageHeader.vue";
import QueryStatus from "@/shared/ui/QueryStatus.vue";

const props = withDefaults(
  defineProps<{
    title: string;
    loading: boolean;
    error: boolean;
    empty: boolean;
    pagination?: { page: number; total_pages: number } | undefined;
    loadingText?: string;
    errorText?: string;
    emptyTitle?: string;
    emptyText?: string;
  }>(),
  {
    pagination: undefined,
    loadingText: "Загружаем…",
    errorText: "Не удалось загрузить данные.",
    emptyTitle: "Ничего не найдено",
    emptyText: "Измените запрос.",
  },
);

const emit = defineEmits<{ page: [page: number]; retry: [] }>();
const ready = computed(() => !props.loading && !props.error && !props.empty);
const page = computed(() => props.pagination?.page ?? 1);
const totalPages = computed(() => props.pagination?.total_pages ?? 0);
</script>

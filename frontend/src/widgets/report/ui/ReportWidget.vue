<template>
  <section>
    <PageHeader title="ТОП-10 авторов">
      <template #extra>
        <p class="muted">Авторы с наибольшим числом книг за выбранный год.</p>
      </template>
      <label class="year-picker">
        Год
        <YearField v-model="year" :years="years" />
      </label>
    </PageHeader>

    <QueryStatus
      :loading="isLoading || yearsLoading"
      :error="isError || yearsError"
      :empty="rows.length === 0"
      loading-text="Загружаем отчёт…"
      :error-text="yearsError ? 'Не удалось загрузить годы для отчёта.' : 'Не удалось загрузить отчёт.'"
      empty-title="Нет данных за этот год"
      empty-text="За этот год в каталоге нет книг."
    />

    <ol v-if="!isLoading && !yearsLoading && !isError && !yearsError && rows.length" class="rank-list">
      <li v-for="row in rows" :key="row.author_id">
        <span class="rank">{{ row.rank }}</span>
        <div class="rank-body">
          <RouterLink :to="ROUTES.author(row.author_id)">
            {{ row.full_name }}
          </RouterLink>
          <div
            class="rank-bar"
            role="progressbar"
            :aria-label="`Доля от лидера: ${row.booksLabel}`"
            :aria-valuenow="row.books_count"
            :aria-valuemin="0"
            :aria-valuemax="maxBooks"
          >
            <span :style="{ width: row.barWidth }" />
          </div>
        </div>
        <strong>{{ row.booksLabel }}</strong>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useCatalogYears, useReportQuery } from "@/entities/report";
import { useSearchFilter, YearField } from "@/features/catalog-filter";
import PageHeader from "@/shared/ui/PageHeader.vue";
import QueryStatus from "@/shared/ui/QueryStatus.vue";
import { ROUTES } from "@/shared/config/constants";
import { booksWord, parseYear } from "@/shared/lib/utils";

const { filters, set } = useSearchFilter();
const { years, loading: yearsLoading, error: yearsError } = useCatalogYears(() => filters.value.year);
const year = computed({
  get: () => filters.value.year || (years.value[0] ? String(years.value[0]) : ""),
  set: (value: string | number) => set({ year: String(value) }),
});
const { isLoading, isError, data } = useReportQuery(() => parseYear(year.value) ?? 0);
const items = computed(() => data.value?.items ?? []);
const maxBooks = computed(() => items.value[0]?.books_count ?? 1);

const rows = computed(() =>
  items.value.map((item) => ({
    ...item,
    barWidth: `${(item.books_count / maxBooks.value) * 100}%`,
    booksLabel: `${item.books_count} ${booksWord(item.books_count)}`,
  })),
);
</script>

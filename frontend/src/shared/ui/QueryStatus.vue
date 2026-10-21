<template>
  <div v-if="loading" class="query-status" role="status" aria-live="polite">
    <div v-if="skeleton" class="skeleton-line skeleton-line--lg" />
    <div v-if="skeleton" class="skeleton-line skeleton-line--sm" />
    <p v-else class="muted">{{ loadingText }}</p>
  </div>
  <div v-else-if="error" class="query-error" role="alert">
    <p class="field-error">{{ errorText }}</p>
    <button v-if="retryable" class="btn btn-ghost" type="button" @click="$emit('retry')">Повторить</button>
  </div>
  <section v-else-if="empty" class="state-empty" aria-live="polite">
    <h2>{{ emptyTitle }}</h2>
    <p>{{ emptyText }}</p>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    loading: boolean;
    error: boolean;
    empty?: boolean;
    loadingText: string;
    errorText: string;
    emptyTitle?: string;
    emptyText?: string;
    skeleton?: boolean;
    retryable?: boolean;
  }>(),
  {
    empty: false,
    emptyTitle: "Ничего не найдено",
    emptyText: "Измените запрос.",
    skeleton: true,
    retryable: true,
  },
);

defineEmits<{ retry: [] }>();
</script>

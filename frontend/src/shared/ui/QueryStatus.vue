<template>
  <p v-if="loading" class="muted" role="status" aria-live="polite">{{ loadingText }}</p>
  <p v-else-if="error" class="field-error" role="alert">{{ errorText }}</p>
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
  }>(),
  {
    empty: false,
    emptyTitle: "Ничего не найдено",
    emptyText: "Измените запрос.",
  },
);
</script>

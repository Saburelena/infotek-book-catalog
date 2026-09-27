<template>
  <QueryStatus
    v-if="loading || error || data == null"
    :loading="loading"
    :error="!loading"
    :loading-text="loadingText"
    :error-text="errorText"
  />
  <slot v-else :data="data" />
</template>

<script setup lang="ts" generic="T">
import QueryStatus from "./QueryStatus.vue";

defineProps<{
  loading: boolean;
  error: boolean;
  data?: T | null;
  loadingText: string;
  errorText: string;
}>();
</script>

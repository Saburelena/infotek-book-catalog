<template>
  <header class="page-head">
    <div class="page-head-content">
      <h1>{{ title }}</h1>
      <slot name="extra" />
    </div>
    <div class="page-head-actions">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

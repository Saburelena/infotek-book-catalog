<template>
  <header class="page-head">
    <div>
      <h1>{{ title }}</h1>
      <slot name="extra" />
    </div>
    <slot />
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

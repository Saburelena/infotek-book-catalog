<template>
  <section class="form-page" :class="{ narrow }">
    <h1>{{ title }}</h1>
    <slot name="intro" />
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; narrow?: boolean }>(), { narrow: false });
</script>

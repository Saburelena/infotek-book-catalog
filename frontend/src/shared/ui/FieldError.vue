<template>
  <p v-if="message" :id="id" class="field-error" role="alert">{{ message }}</p>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string; id?: string }>(), { message: "", id: undefined });
</script>

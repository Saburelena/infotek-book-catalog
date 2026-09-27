<template>
  <div class="ui-row form-actions">
    <button class="btn btn-primary" :disabled="pending" type="submit">
      {{ pending ? "Сохранение…" : "Сохранить" }}
    </button>
    <button class="btn btn-ghost" :disabled="pending" type="button" @click="emit('cancel')">Отмена</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ pending: boolean }>();
const emit = defineEmits<{ cancel: [] }>();
</script>

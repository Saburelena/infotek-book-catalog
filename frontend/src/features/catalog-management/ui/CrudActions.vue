<template>
  <slot />
  <template v-if="isUser">
    <RouterLink class="btn btn-primary" :to="editTo">Редактировать</RouterLink>
    <button class="btn btn-danger" type="button" @click="emit('delete')">Удалить</button>
  </template>
</template>

<script setup lang="ts">
import { useAuth } from "@/features/auth";

defineProps<{ editTo: string }>();
const emit = defineEmits<{ delete: [] }>();
const { isUser } = useAuth();
</script>

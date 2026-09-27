<template>
  <RouterLink v-if="isUser" class="btn btn-primary" :to="to">
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import { useAuth } from "@/features/auth";

defineProps<{ to: string }>();
const { isUser } = useAuth();
</script>

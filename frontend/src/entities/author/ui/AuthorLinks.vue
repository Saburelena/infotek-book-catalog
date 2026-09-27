<template>
  <template v-for="(author, index) in authors ?? []" :key="author.id">
    <span v-if="index > 0" aria-hidden="true">,</span>
    <RouterLink :to="ROUTES.author(author.id)">{{ author.full_name }}</RouterLink>
  </template>
</template>

<script setup lang="ts">
import type { AuthorShort } from "@/shared/types/entities";
import { ROUTES } from "@/shared/config/constants";

defineProps<{ authors?: AuthorShort[] }>();
</script>

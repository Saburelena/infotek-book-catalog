<template>
  <QueryLoaded
    v-if="id"
    :loading="isLoading"
    :error="isError"
    :data="data"
    loading-text="Загружаем автора…"
    error-text="Автор не найден."
  >
    <template #default="{ data: author }">
      <AuthorForm :id="id" :full-name="author.full_name" />
    </template>
  </QueryLoaded>
  <AuthorForm v-else :id="null" full-name="" />
</template>

<script setup lang="ts">
import { useAuthorQuery } from "@/entities/author";
import { useIdQuery } from "@/features/catalog-filter";
import QueryLoaded from "@/shared/ui/QueryLoaded.vue";
import { AuthorForm } from "@/features/author-editor";

const { id, isLoading, isError, data } = useIdQuery(useAuthorQuery);
</script>

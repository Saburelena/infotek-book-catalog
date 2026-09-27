<template>
  <QueryLoaded
    v-if="id"
    :loading="isLoading"
    :error="isError"
    :data="data"
    loading-text="Загружаем книгу…"
    error-text="Книга не найдена."
  >
    <template #default="{ data: book }">
      <BookForm :id="id" :book="book" />
    </template>
  </QueryLoaded>
  <BookForm v-else :id="null" />
</template>

<script setup lang="ts">
import { useBookQuery } from "@/entities/book";
import { useIdQuery } from "@/features/catalog-filter";
import QueryLoaded from "@/shared/ui/QueryLoaded.vue";
import { BookForm } from "@/features/book-editor";

const { id, isLoading, isError, data } = useIdQuery(useBookQuery);
</script>

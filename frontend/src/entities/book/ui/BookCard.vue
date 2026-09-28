<template>
  <article class="book-card">
    <RouterLink :to="ROUTES.book(book.id)" class="book-cover-frame">
  <BookCover
    :src="book.cover_url"
    :title="`Обложка «${book.title}»`"
    class="book-cover"
  />
</RouterLink>
    <div class="book-card-body">
      <p class="meta">{{ book.year }}</p>
      <h2 class="clamp-2">
        <RouterLink :to="ROUTES.book(book.id)">{{ book.title }}</RouterLink>
      </h2>
      <p class="authors clamp-2">
        <AuthorLinks :authors="book.authors" />
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Book } from "@/shared/types/entities";
import { ROUTES } from "@/shared/config/constants";
import { AuthorLinks } from "@/entities/author";
import BookCover from "./BookCover.vue";

defineProps<{ book: Book }>();
</script>

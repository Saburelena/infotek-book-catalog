<template>
  <article class="book-card" tabindex="0" @click="onNavigate" @keydown.enter="onNavigate">
    <RouterLink :to="ROUTES.book(book.id)" custom>
      <template #default="{ navigate }">
        <div class="book-cover-frame book-cover-frame-inner" @click.stop="navigate">
          <BookCover :src="book.cover_url" :title="`Обложка «${book.title}»`" class="book-cover" />
        </div>
      </template>
    </RouterLink>
    <div class="book-card-body">
      <p class="meta">{{ book.year }}</p>
      <h2 class="clamp-2">{{ book.title }}</h2>
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
import { useRouter } from "vue-router";

const props = defineProps<{ book: Book }>();
const router = useRouter();

function onNavigate() {
  void router.push(ROUTES.book(props.book.id));
}
</script>

<template>
  <QueryLoaded
    :loading="isLoading"
    :error="isError"
    :data="data"
    loading-text="Загружаем книгу…"
    error-text="Книга не найдена."
  >
    <template #default="{ data: book }">
      <article class="detail">
        <BookCover :src="book.cover_url" :title="`Обложка «${book.title}»`" class="detail-cover" eager />

        <div>
          <p class="eyebrow">{{ book.year }}</p>
          <h1>{{ book.title }}</h1>
          <p class="authors"><AuthorLinks :authors="book.authors" /></p>
          <p v-if="book.isbn" class="meta">ISBN {{ book.isbn }}</p>
          <p class="lead">{{ book.description }}</p>

          <div class="ui-row wrap">
            <CrudActions :edit-to="ROUTES.bookEdit(book.id)" @delete="deleteOpen = true">
              <button
                v-for="author in book.authors"
                :key="author.id"
                class="btn btn-ghost"
                type="button"
                @click="subscribeAuthor = author"
              >
                Подписаться:
                <span class="person">{{ author.full_name }}</span>
              </button>
            </CrudActions>
          </div>
        </div>

        <SubscribeModal
          v-if="subscribeAuthor"
          :author-id="subscribeAuthor.id"
          :author-name="subscribeAuthor.full_name"
          @close="subscribeAuthor = null"
        />
        <ConfirmDialog
          v-if="deleteOpen"
          title="Удалить книгу?"
          :text="`«${book.title}» будет удалена из каталога.`"
          :confirm="onDeleteBook"
          @close="deleteOpen = false"
        />
      </article>
    </template>
  </QueryLoaded>
</template>

<script setup lang="ts">
import { ref, shallowRef } from "vue";

import { useBookQuery, BookCover } from "@/entities/book";
import { AuthorLinks } from "@/entities/author";
import { useIdQuery } from "@/features/catalog-filter";
import { useDeleteBook, CrudActions } from "@/features/catalog-management";
import QueryLoaded from "@/shared/ui/QueryLoaded.vue";
import { ConfirmDialog, SubscribeModal } from "@/features/subscription";
import { ROUTES } from "@/shared/config/constants";
import type { AuthorShort } from "@/shared/types/entities";

const { isLoading, isError, data } = useIdQuery(useBookQuery);
const { mutateAsync: deleteBook } = useDeleteBook();
const subscribeAuthor = shallowRef<AuthorShort | null>(null);
const deleteOpen = ref(false);

async function onDeleteBook() {
  if (data.value) await deleteBook(data.value.id);
}
</script>

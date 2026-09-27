<template>
  <QueryLoaded
    :loading="isLoading"
    :error="isError"
    :data="data"
    loading-text="Загружаем автора…"
    error-text="Автор не найден."
  >
    <template #default="{ data: author }">
      <section>
        <PageHeader :title="author.full_name">
          <template #extra>
            <p class="muted">{{ booksSummary }}</p>
          </template>
          <div class="ui-row wrap">
            <CrudActions :edit-to="ROUTES.authorEdit(author.id)" @delete="deleteOpen = true">
              <button class="btn btn-primary" type="button" @click="subscribeOpen = true">Подписаться на SMS</button>
            </CrudActions>
          </div>
        </PageHeader>

        <p v-if="author.books.length === 0" class="state-empty">У автора пока нет книг в каталоге.</p>
        <ul v-else class="book-list">
          <li v-for="item in author.books" :key="item.id">
            <RouterLink :to="ROUTES.book(item.id)">
              <span>{{ item.title }}</span>
              <em>{{ item.year }}</em>
            </RouterLink>
          </li>
        </ul>

        <SubscribeModal
          v-if="subscribeOpen"
          :author-id="author.id"
          :author-name="author.full_name"
          @close="subscribeOpen = false"
        />
        <ConfirmDialog
          v-if="deleteOpen"
          title="Удалить автора?"
          :text="`${author.full_name} будет удалён. Книги останутся в каталоге.`"
          :confirm="onDeleteAuthor"
          @close="deleteOpen = false"
        />
      </section>
    </template>
  </QueryLoaded>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { useAuthorQuery } from "@/entities/author";
import { useIdQuery } from "@/features/catalog-filter";
import { useDeleteAuthor, CrudActions } from "@/features/catalog-management";
import QueryLoaded from "@/shared/ui/QueryLoaded.vue";
import PageHeader from "@/shared/ui/PageHeader.vue";
import { ConfirmDialog, SubscribeModal } from "@/features/subscription";
import { ROUTES } from "@/shared/config/constants";
import { booksWord } from "@/shared/lib/utils";

const { isLoading, isError, data } = useIdQuery(useAuthorQuery);
const { mutateAsync: deleteAuthor } = useDeleteAuthor();
const subscribeOpen = ref(false);
const deleteOpen = ref(false);

const booksSummary = computed(() => {
  const count = data.value?.books.length ?? 0;
  return count ? `${count} ${booksWord(count)} в каталоге` : "Пока нет книг";
});

async function onDeleteAuthor() {
  if (data.value) await deleteAuthor(data.value.id);
}
</script>

<template>
  <FormPage :title="id ? 'Изменить книгу' : 'Добавить книгу'">
    <form class="card-form book-editor" novalidate @submit.prevent="submit">
      <CoverPicker :preview="preview" :title="coverTitle" :error="errors.cover" @file="onCover" />

      <div class="book-editor-fields">
        <FormField v-slot="{ invalid, describedby }" label="Название" :error="errors.title">
          <input
            v-model="form.title"
            name="title"
            :maxlength="LIMIT.name"
            autocomplete="off"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedby"
          />
        </FormField>

        <div class="grid-2">
          <FormField v-slot="{ invalid, describedby }" label="Год выпуска" :error="errors.year">
            <input
              v-model="form.year"
              name="year"
              type="text"
              inputmode="numeric"
              :maxlength="LIMIT.yearDigits"
              :aria-invalid="invalid || undefined"
              :aria-describedby="describedby"
            />
          </FormField>

          <FormField v-slot="{ invalid, describedby }" label="ISBN" :error="errors.isbn">
            <input
              v-model="form.isbn"
              name="isbn"
              inputmode="numeric"
              :maxlength="LIMIT.isbnChars"
              autocomplete="off"
              :aria-invalid="invalid || undefined"
              :aria-describedby="describedby"
            />
          </FormField>
        </div>

        <FormField v-slot="{ invalid, describedby }" label="Описание" :error="errors.description">
          <textarea
            v-model="form.description"
            name="description"
            rows="5"
            :maxlength="LIMIT.description"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedby"
          />
        </FormField>
      </div>

      <fieldset class="book-editor-authors">
        <legend class="legend">Авторы</legend>
        <QueryLoaded
          :loading="authorsLoading"
          :error="authorsError"
          :data="authorsData"
          loading-text="Загружаем авторов…"
          error-text="Не удалось загрузить авторов."
        >
          <template #default="{ data }">
            <p v-if="data.items.length === 0" class="muted">Авторов пока нет — сначала добавьте автора.</p>
            <div v-else>
              <label v-for="author in data.items" :key="author.id" class="chip">
                <input
                  :id="`author-${author.id}`"
                  v-model="form.author_ids"
                  :name="FORM_FIELD.authorIds"
                  type="checkbox"
                  :value="author.id"
                />
                {{ author.full_name }}
              </label>
            </div>
          </template>
        </QueryLoaded>
        <FieldError :message="errors.author_ids" />
      </fieldset>

      <FormActions :pending="isPending" @cancel="cancel" />
    </form>
  </FormPage>
</template>

<script setup lang="ts">
import { useAuthorsAllQuery } from "@/entities/author";
import type { Book } from "@/shared/types/entities";
import { FORM_FIELD } from "@/shared/config/constants";
import FormPage from "@/shared/ui/FormPage.vue";
import FormField from "@/shared/ui/FormField.vue";
import FormActions from "@/shared/ui/FormActions.vue";
import FieldError from "@/shared/ui/FieldError.vue";
import QueryLoaded from "@/shared/ui/QueryLoaded.vue";
import { useBookEditor } from "../model/useBookEditor";
import CoverPicker from "./CoverPicker.vue";

const props = defineProps<{ id: number | null; book?: Book }>();

const { isLoading: authorsLoading, isError: authorsError, data: authorsData } = useAuthorsAllQuery();

const { form, preview, errors, coverTitle, isPending, onCover, submit, cancel, LIMIT } = useBookEditor(
  props.id,
  props.book,
);
</script>

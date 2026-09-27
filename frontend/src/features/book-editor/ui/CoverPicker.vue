<template>
  <div class="cover-picker">
    <span class="field-label">Фото главной страницы</span>
    <BookCover :src="preview" :title="title" class="detail-cover" eager />

    <label class="btn btn-ghost cover-pick">
      {{ preview ? "Заменить обложку" : "Выбрать обложку" }}
      <input
        :id="inputId"
        ref="inputRef"
        class="sr-only"
        type="file"
        :accept="COVER_ACCEPT"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? errorId : undefined"
        @change="onChange"
      />
    </label>

    <FieldError :id="errorId" :message="error" />
  </div>
</template>

<script setup lang="ts">
import { ref, useId } from "vue";
import { COVER_ACCEPT } from "@/shared/config/constants";
import { BookCover } from "@/entities/book";
import FieldError from "@/shared/ui/FieldError.vue";

withDefaults(
  defineProps<{
    preview?: string;
    title: string;
    error?: string;
  }>(),
  { preview: "", error: "" },
);

const emit = defineEmits<{ file: [File | null] }>();
const inputId = useId();
const errorId = useId();
const inputRef = ref<HTMLInputElement | null>(null);

function onChange() {
  const input = inputRef.value;
  if (!input) return;
  emit("file", input.files?.[0] ?? null);
  input.value = "";
}
</script>

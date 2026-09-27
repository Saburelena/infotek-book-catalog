import { computed, onScopeDispose, reactive, ref, shallowRef } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { useRouter } from "vue-router";

import { useAppServices } from "@/shared/di/container";
import type { Book } from "@/shared/types/entities";
import { useAbortable } from "@/shared/lib/useAbortable";
import { coverFileError, mediaUrl } from "@/shared/lib/utils";
import { validateBookForm } from "@/shared/lib/formValidation";
import { ApiError } from "@/shared/api/errors";
import { FORM_FIELD, LIMIT, ROUTES } from "@/shared/config/constants";
import { useCatalogWrite } from "@/features/catalog-management";

export function useBookEditor(id: number | null, book?: Book) {
  const services = useAppServices();
  const router = useRouter();
  const afterSave = useCatalogWrite();
  const { signal } = useAbortable();

  const form = reactive({
    title: book?.title ?? "",
    year: book ? String(book.year) : String(new Date().getFullYear()),
    description: book?.description || "",
    isbn: book?.isbn || "",
    author_ids: (book?.authors?.map((a) => a.id) ?? []) as number[],
  });

  const cover = shallowRef<File | null>(null);
  const preview = ref(book ? mediaUrl(book.cover_url) : "");
  const errors = shallowRef<Record<string, string>>({});
  const cancelTo = id ? ROUTES.book(id) : ROUTES.home;
  const coverTitle = computed(() => (form.title ? `Обложка «${form.title}»` : "Обложка"));

  onScopeDispose(() => {
    if (preview.value.startsWith("blob:")) URL.revokeObjectURL(preview.value);
  });

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("year", form.year);
      fd.append("description", form.description.trim());
      fd.append("isbn", form.isbn.trim());
      for (const authorId of form.author_ids) {
        fd.append(FORM_FIELD.authorIds, String(authorId));
      }
      if (cover.value) fd.append(FORM_FIELD.cover, cover.value);
      return services.books.save(fd, id ?? undefined, signal());
    },
    onSuccess: (saved) =>
      afterSave(id ? "Книга обновлена" : "Книга добавлена. Подписчики авторов получат SMS.", ROUTES.book(saved.id)),
    onError: (err) => {
      if (err instanceof ApiError) errors.value = err.toMap();
      services.toast.fromError(err);
    },
  });

  function onCover(file: File | null) {
    const message = coverFileError(file, !id);
    if (message) {
      errors.value = { ...errors.value, cover: message };
      return;
    }
    errors.value = { ...errors.value };
    delete errors.value.cover;
    cover.value = file;
    if (preview.value.startsWith("blob:")) URL.revokeObjectURL(preview.value);
    preview.value = file ? URL.createObjectURL(file) : mediaUrl(book?.cover_url);
  }

  function submit() {
    const next = validateBookForm({
      title: form.title,
      year: form.year,
      isbn: form.isbn,
      authorIds: form.author_ids,
      cover: cover.value,
      coverRequired: !id,
    });
    errors.value = next;
    if (Object.keys(next).length) return;
    mutation.mutate();
  }

  function cancel() {
    void router.push(cancelTo);
  }

  return {
    form,
    preview,
    errors,
    coverTitle,
    isPending: mutation.isPending,
    onCover,
    submit,
    cancel,
    LIMIT,
  };
}

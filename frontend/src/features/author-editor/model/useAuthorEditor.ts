import { ref } from "vue";
import { useMutation } from "@tanstack/vue-query";
import { useRouter } from "vue-router";

import { useAppServices } from "@/shared/di/container";
import { useAbortable } from "@/shared/lib/useAbortable";
import { validateAuthorName } from "@/shared/lib/formValidation";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { LIMIT, ROUTES } from "@/shared/config/constants";
import { useCatalogWrite } from "@/features/catalog-management";

export function useAuthorEditor(id: number | null, initialName: string) {
  const services = useAppServices();
  const router = useRouter();
  const afterSave = useCatalogWrite();
  const { signal } = useAbortable();
  const fullName = ref(initialName);
  const error = ref("");
  const cancelTo = id ? ROUTES.author(id) : ROUTES.authors;

  const mutation = useMutation({
    mutationFn: () => services.authors.save(fullName.value.trim(), id ?? undefined, signal()),
    onSuccess: (author) => afterSave(id ? "Автор обновлён" : "Автор добавлен", ROUTES.author(author.id)),
    onError: (requestError) => {
      error.value =
        requestError instanceof ApiError
          ? requestError.field("full_name") || requestError.message
          : errorMessage(requestError);
      services.toast.fromError(requestError);
    },
  });

  function submit() {
    const message = validateAuthorName(fullName.value);
    if (message) {
      error.value = message;
      return;
    }
    error.value = "";
    mutation.mutate();
  }

  function cancel() {
    void router.push(cancelTo);
  }

  return {
    fullName,
    error,
    isPending: mutation.isPending,
    submit,
    cancel,
    LIMIT,
  };
}

import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useRouter } from "vue-router";

import { queryKeys } from "@/shared/api/queryKeys";
import { ROUTES } from "@/shared/config/constants";
import { useAppServices } from "@/shared/di/container";
import { useAbortable } from "@/shared/lib/useAbortable";

export function useCatalogWrite() {
  const services = useAppServices();
  const queryClient = useQueryClient();
  const router = useRouter();

  return async (message: string, to: string) => {
    await router.push(to);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.booksRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bookRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.authorsRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.authorRoot }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reportRoot }),
      ]);
      services.toast.success(message);
    } catch (error) {
      services.toast.fromError(error, "Сохранено, но данные на экране могут обновиться не сразу");
    }
  };
}

export function useDeleteBook() {
  const services = useAppServices();
  const afterSave = useCatalogWrite();
  const { signal } = useAbortable();

  return useMutation({
    mutationFn: (id: number) => services.books.remove(id, signal()),
    onSuccess: () => afterSave("Книга удалена", ROUTES.home),
    onError: (error) => services.toast.fromError(error),
  });
}

export function useDeleteAuthor() {
  const services = useAppServices();
  const afterSave = useCatalogWrite();
  const { signal } = useAbortable();

  return useMutation({
    mutationFn: (id: number) => services.authors.remove(id, signal()),
    onSuccess: () => afterSave("Автор удалён", ROUTES.authors),
    onError: (error) => services.toast.fromError(error),
  });
}

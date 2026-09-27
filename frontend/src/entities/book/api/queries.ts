import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

import { useAppServices } from "@/shared/di/container";
import type { BookListParams } from "@/shared/types/entities";
import { queryKeys } from "@/shared/api/queryKeys";

export function useBooksQuery(params: MaybeRefOrGetter<BookListParams>) {
  const services = useAppServices();
  return useQuery({
    queryKey: computed(() => queryKeys.books(toValue(params))),
    queryFn: ({ signal }) => services.books.list(toValue(params), signal),
    placeholderData: keepPreviousData,
  });
}

export function useBookQuery(id: MaybeRefOrGetter<number | null>) {
  const services = useAppServices();
  return useQuery({
    queryKey: computed(() => queryKeys.book(toValue(id))),
    queryFn: ({ signal }) => {
      const value = toValue(id);
      if (value === null) return Promise.reject(new Error("Book id is missing"));
      return services.books.get(value, signal);
    },
    enabled: computed(() => toValue(id) !== null),
  });
}

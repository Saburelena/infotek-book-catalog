import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

import { useAppServices } from "@/shared/di/container";
import type { AuthorListParams } from "@/shared/types/entities";
import { queryKeys } from "@/shared/api/queryKeys";

export function useAuthorsQuery(params: MaybeRefOrGetter<AuthorListParams>) {
  const services = useAppServices();
  return useQuery({
    queryKey: computed(() => queryKeys.authors(toValue(params))),
    queryFn: ({ signal }) => services.authors.list(toValue(params), signal),
    placeholderData: keepPreviousData,
  });
}

export function useAuthorsAllQuery() {
  return useAuthorsQuery({ perPage: 100 });
}

export function useAuthorQuery(id: MaybeRefOrGetter<number | null>) {
  const services = useAppServices();
  return useQuery({
    queryKey: computed(() => queryKeys.author(toValue(id))),
    queryFn: ({ signal }) => {
      const value = toValue(id);
      if (value === null) return Promise.reject(new Error("Author id is missing"));
      return services.authors.get(value, signal);
    },
    enabled: computed(() => toValue(id) !== null),
  });
}

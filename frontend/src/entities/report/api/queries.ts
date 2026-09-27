import { useQuery } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

import { useAppServices } from "@/shared/di/container";
import { queryKeys } from "@/shared/api/queryKeys";
import { parseYear } from "@/shared/lib/utils";

export function useCatalogYears(extra?: MaybeRefOrGetter<string | number | undefined>) {
  const services = useAppServices();
  const books = useQuery({
    queryKey: queryKeys.books({ perPage: 100 }),
    queryFn: ({ signal }) => services.books.list({ perPage: 100 }, signal),
  });

  return {
    years: computed(() =>
      [...new Set([Number(toValue(extra)), ...(books.data.value?.items ?? []).map((book) => book.year)])]
        .filter((year) => year > 0)
        .sort((a, b) => b - a),
    ),
    loading: books.isLoading,
    error: books.isError,
  };
}

export function useReportQuery(year: MaybeRefOrGetter<number>) {
  const services = useAppServices();
  return useQuery({
    queryKey: computed(() => queryKeys.report(toValue(year))),
    queryFn: ({ signal }) => services.reports.topAuthors(toValue(year), signal),
    enabled: computed(() => parseYear(toValue(year)) !== undefined),
  });
}

import { computed, type WritableComputedRef } from "vue";
import { useRoute, useRouter } from "vue-router";

import { parseId } from "@/shared/lib/utils";

type QueryFilterKey = "page" | "search" | "year" | "author_id";
type QueryFilterPatch = Partial<Record<QueryFilterKey, string | number | undefined>>;

export function useIdParam() {
  const route = useRoute();
  return computed(() => parseId(String(route.params.id ?? "")) ?? null);
}

export function useIdQuery<T>(run: (id: ReturnType<typeof useIdParam>) => T) {
  const id = useIdParam();
  return { id, ...run(id) };
}

export function useSearchFilter() {
  const route = useRoute();
  const router = useRouter();

  const filters = computed(() => {
    const get = (key: QueryFilterKey) => {
      const value = route.query[key];
      return typeof value === "string" ? value : "";
    };

    return {
      page: Math.max(1, Number(get("page")) || 1),
      search: get("search"),
      year: get("year"),
      authorId: get("author_id"),
    };
  });

  function set(patch: QueryFilterPatch) {
    const query = { ...route.query };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") delete query[key];
      else query[key] = String(value);
    }
    if (!("page" in patch)) delete query.page;
    void router.replace({ query });
  }

  function model<K extends Exclude<QueryFilterKey, "page">>(key: K): WritableComputedRef<string, string | number> {
    return computed({
      get: () => {
        const value = route.query[key];
        return typeof value === "string" ? value : "";
      },
      set: (value: string | number) => {
        const patch: QueryFilterPatch = {};
        patch[key] = String(value);
        set(patch);
      },
    });
  }

  function submit(event: Event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    set({ search: String(new FormData(form).get("search") ?? "") });
  }

  return { filters, set, submit, model };
}

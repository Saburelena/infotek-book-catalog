import { computed, type Ref } from "vue";

export function useQueryItems<T>(data: Ref<{ items: T[] } | undefined>) {
  return computed(() => data.value?.items ?? []);
}

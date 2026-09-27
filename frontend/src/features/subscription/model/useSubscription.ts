import { ref } from "vue";

import { useAppServices } from "@/shared/di/container";
import { useAbortable } from "@/shared/lib/useAbortable";
import { ApiError, errorMessage, isAbortError } from "@/shared/api/errors";
import { normalizePhone, phoneError } from "@/shared/lib/utils";

export function useSubscription(authorId: number, onSuccess: () => void) {
  const services = useAppServices();
  const { signal } = useAbortable();
  const phone = ref("");
  const error = ref("");
  const pending = ref(false);

  async function submit() {
    const invalid = phoneError(phone.value);
    if (invalid) {
      error.value = invalid;
      return;
    }

    pending.value = true;
    error.value = "";

    try {
      const result = await services.subscriptions.subscribe(authorId, normalizePhone(phone.value), signal());
      services.toast.success(result.message);
      onSuccess();
    } catch (err) {
      if (isAbortError(err)) return;
      error.value =
        err instanceof ApiError ? err.field("phone") || err.message : errorMessage(err, "Не удалось подписаться");
    } finally {
      pending.value = false;
    }
  }

  return { phone, error, pending, submit };
}

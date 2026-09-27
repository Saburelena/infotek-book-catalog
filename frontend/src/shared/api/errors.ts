import { HTTP_STATUS } from "@/shared/config/constants";
import type { ErrorItem } from "@/shared/types/entities";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: ErrorItem[],
  ) {
    super(errors[0]?.message || `Ошибка ${status}`);
    this.name = "ApiError";
  }

  field(name: string) {
    return this.errors.find((item) => item.field === name)?.message;
  }

  toMap() {
    return Object.fromEntries(
      this.errors.filter((item) => item.field !== "base").map((item) => [item.field, item.message]),
    );
  }
}

export function errorMessage(err: unknown, fallback = "Не удалось выполнить запрос") {
  return err instanceof ApiError ? err.message : fallback;
}

export function isAbortError(err: unknown): err is DOMException | ApiError {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof ApiError && err.status === HTTP_STATUS.requestTimeout)
  );
}

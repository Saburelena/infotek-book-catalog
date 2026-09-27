import { API_PATH, API_PREFIX, FORM_FIELD, HTTP_STATUS, ROLE_USER, SESSION_KEYS } from "@/shared/config/constants";
import { isAbortError } from "./errors";
import type { AuthUser, ErrorItem, AuthorListParams, BookListParams } from "@/shared/types/entities";
import { ApiError } from "./errors";
import {
  normalizeAuthorShort,
  normalizeBook,
  normalizeList,
  normalizeLogin,
  normalizeMessage,
  normalizeTopAuthors,
  requireAuthor,
  requireBook,
} from "./normalize";

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  errors?: unknown[];
};

type SessionState = {
  token: string | null;
  user: AuthUser | null;
  dropped: boolean;
};

export interface SessionStorage {
  read(): SessionState;
  write(token: string, user: AuthUser, expiresAt: string): void;
  clear(): void;
}

export interface HttpClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
}

export type RequestOptions = {
  method?: string;
  body?: BodyInit | null;
  json?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function extractEnvelopeData<T>(value: unknown): T {
  const envelope = isRecord(value) && "data" in value ? value : null;
  if (!envelope || !Object.prototype.hasOwnProperty.call(envelope, "data")) {
    throw new ApiError(500, [{ field: "base", message: "Некорректный ответ сервера" }]);
  }

  return envelope.data as T;
}

function parseAuthUser(value: unknown): AuthUser | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    typeof value.username !== "string" ||
    value.role !== ROLE_USER
  ) {
    return null;
  }
  return { id: value.id, username: value.username, role: ROLE_USER };
}

function parseErrors(value: unknown): ErrorItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    isRecord(item) && typeof item.field === "string" && typeof item.message === "string"
      ? [{ field: item.field, message: item.message }]
      : [],
  );
}

export function createSessionStorage(storage: Storage = window.localStorage): SessionStorage {
  return {
    read() {
      const token = storage.getItem(SESSION_KEYS.token);
      const rawUser = storage.getItem(SESSION_KEYS.user);
      if (!token && !rawUser) return { token: null, user: null, dropped: false };
      try {
        const user = parseAuthUser(JSON.parse(rawUser || "null"));
        const exp = Date.parse(storage.getItem(SESSION_KEYS.exp) || "");
        if (token && user && Number.isFinite(exp) && exp > Date.now()) {
          return { token, user, dropped: false };
        }
      } catch {
        /* invalid persisted session */
      }
      storage.removeItem(SESSION_KEYS.token);
      storage.removeItem(SESSION_KEYS.user);
      storage.removeItem(SESSION_KEYS.exp);
      return { token: null, user: null, dropped: true };
    },
    write(token, user, expiresAt) {
      storage.setItem(SESSION_KEYS.token, token);
      storage.setItem(SESSION_KEYS.user, JSON.stringify(user));
      storage.setItem(SESSION_KEYS.exp, expiresAt);
    },
    clear() {
      storage.removeItem(SESSION_KEYS.token);
      storage.removeItem(SESSION_KEYS.user);
      storage.removeItem(SESSION_KEYS.exp);
    },
  };
}

function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : "";
}

export function createHttpClient(config: {
  baseUrl?: string;
  session: SessionStorage;
  onUnauthorized?: () => void;
  timeoutMs?: number;
}): HttpClient {
  const apiBase = config.baseUrl || import.meta.env.VITE_API_BASE || API_PREFIX;
  const defaultTimeoutMs = config.timeoutMs ?? undefined;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    const current = config.session.read();
    if (current.dropped) config.onUnauthorized?.();
    const token = options.auth !== false ? current.token : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    let body = options.body ?? null;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    }

    const timeoutMs = typeof options.timeoutMs === "number" ? options.timeoutMs : defaultTimeoutMs;
    let timeoutId: number | undefined;
    let effectiveSignal = options.signal;
    let abortListener: (() => void) | undefined;

    if (typeof timeoutMs === "number" && timeoutMs > 0) {
      const timeoutController = new AbortController();
      if (options.signal?.aborted) {
        timeoutController.abort();
      } else if (options.signal) {
        abortListener = () => timeoutController.abort();
        options.signal.addEventListener("abort", abortListener, { once: true });
        timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);
        effectiveSignal = timeoutController.signal;
      } else {
        timeoutId = window.setTimeout(() => timeoutController.abort(), timeoutMs);
        effectiveSignal = timeoutController.signal;
      }
    }

    try {
      const response = await fetch(`${apiBase}${path}`, {
        method: options.method || "GET",
        headers,
        body,
        signal: effectiveSignal,
      });

      if (response.status === HTTP_STATUS.noContent) return undefined as T;

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const envelope = isRecord(payload) ? payload : null;

      if (!response.ok || envelope == null || envelope.success === false) {
        if (response.status === HTTP_STATUS.unauthorized && token) {
          config.session.clear();
          config.onUnauthorized?.();
        }
        const errors = parseErrors(envelope?.errors);
        throw new ApiError(
          response.status,
          errors.length ? errors : [{ field: "base", message: `Ошибка ${response.status}` }],
        );
      }

      return extractEnvelopeData<T>(payload);
    } catch (error) {
      if (isAbortError(error) && timeoutId !== undefined && !options.signal?.aborted) {
        throw new ApiError(HTTP_STATUS.requestTimeout, [
          { field: "base", message: "Превышено время ожидания запроса" },
        ]);
      }
      throw error;
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (abortListener && options.signal) {
        options.signal.removeEventListener("abort", abortListener);
      }
    }
  }

  return { request };
}

export function createApiServices(http: HttpClient) {
  return {
    auth: {
      login: (username: string, password: string, signal?: AbortSignal) =>
        http
          .request<unknown>(API_PATH.login, {
            method: "POST",
            json: { username, password },
            auth: false,
            signal,
          })
          .then(normalizeLogin),
    },
    books: {
      list: (params: BookListParams, signal?: AbortSignal) =>
        http
          .request<unknown>(
            `${API_PATH.books}${queryString({
              page: params.page,
              "per-page": params.perPage,
              search: params.search,
              year: params.year,
              author_id: params.author_id,
            })}`,
            { signal },
          )
          .then((v) => normalizeList(v, normalizeBook)),
      get: (id: number, signal?: AbortSignal) => http.request<unknown>(API_PATH.book(id), { signal }).then(requireBook),
      save: async (form: FormData, id?: number, signal?: AbortSignal) => {
        const raw = !id
          ? await http.request<unknown>(API_PATH.books, {
              method: "POST",
              body: form,
              signal,
            })
          : form.has(FORM_FIELD.cover)
            ? await http.request<unknown>(API_PATH.book(id), {
                method: "PUT",
                body: form,
                signal,
              })
            : await http.request<unknown>(API_PATH.book(id), {
                method: "PATCH",
                json: {
                  title: String(form.get("title") ?? ""),
                  year: Number(form.get("year")),
                  description: String(form.get("description") ?? ""),
                  isbn: String(form.get("isbn") ?? ""),
                  author_ids: form.getAll(FORM_FIELD.authorIds).map(Number),
                },
                signal,
              });
        return requireBook(raw);
      },
      remove: (id: number, signal?: AbortSignal) => http.request<void>(API_PATH.book(id), { method: "DELETE", signal }),
    },
    authors: {
      list: (params: AuthorListParams = {}, signal?: AbortSignal) =>
        http
          .request<unknown>(
            `${API_PATH.authors}${queryString({
              page: params.page,
              "per-page": params.perPage,
              search: params.search,
            })}`,
            { signal },
          )
          .then((v) => normalizeList(v, normalizeAuthorShort)),
      get: (id: number, signal?: AbortSignal) =>
        http.request<unknown>(API_PATH.author(id), { signal }).then(requireAuthor),
      save: (fullName: string, id?: number, signal?: AbortSignal) =>
        http
          .request<unknown>(id ? API_PATH.author(id) : API_PATH.authors, {
            method: id ? "PUT" : "POST",
            json: { full_name: fullName },
            signal,
          })
          .then(requireAuthor),
      remove: (id: number, signal?: AbortSignal) =>
        http.request<void>(API_PATH.author(id), {
          method: "DELETE",
          signal,
        }),
    },
    subscriptions: {
      subscribe: (authorId: number, phone: string, signal?: AbortSignal) =>
        http
          .request<unknown>(API_PATH.subscribe(authorId), {
            method: "POST",
            json: { phone },
            auth: false,
            signal,
          })
          .then((v) => normalizeMessage(v, "Подписка оформлена")),
    },
    reports: {
      topAuthors: (year: number, signal?: AbortSignal) =>
        http.request<unknown>(`${API_PATH.topAuthors}${queryString({ year })}`, { signal }).then(normalizeTopAuthors),
    },
  };
}

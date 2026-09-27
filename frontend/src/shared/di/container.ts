import { inject, provide, type Ref, computed, shallowRef, readonly } from "vue";

import type {
  Author,
  AuthorListParams,
  AuthorShort,
  AuthUser,
  BookListParams,
  Book,
  ListPayload,
  LoginResponse,
  TopAuthor,
} from "@/shared/types/entities";
import type { HttpClient, SessionStorage } from "@/shared/api/httpClient";
import { TOAST_KIND, TOAST_MS, type ToastKind } from "@/shared/config/constants";
import { errorMessage, isAbortError } from "@/shared/api/errors";

export interface BookService {
  list(params: BookListParams, signal?: AbortSignal): Promise<ListPayload<Book>>;
  get(id: number, signal?: AbortSignal): Promise<Book>;
  save(form: FormData, id?: number, signal?: AbortSignal): Promise<Book>;
  remove(id: number, signal?: AbortSignal): Promise<void>;
}

export interface AuthorService {
  list(params?: AuthorListParams, signal?: AbortSignal): Promise<ListPayload<AuthorShort>>;
  get(id: number, signal?: AbortSignal): Promise<Author>;
  save(fullName: string, id?: number, signal?: AbortSignal): Promise<Author>;
  remove(id: number, signal?: AbortSignal): Promise<void>;
}

export interface AuthApi {
  login(username: string, password: string, signal?: AbortSignal): Promise<LoginResponse>;
}

export interface SubscriptionService {
  subscribe(authorId: number, phone: string, signal?: AbortSignal): Promise<{ message: string }>;
}

export interface ReportService {
  topAuthors(year: number, signal?: AbortSignal): Promise<{ year: number; items: TopAuthor[] }>;
}

export interface AuthStore {
  user: Readonly<Ref<AuthUser | null>>;
  isUser: Readonly<Ref<boolean>>;
  login(response: LoginResponse): void;
  logout(): void;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export interface ToastService {
  items: Readonly<Ref<Toast[]>>;
  success(text: string): void;
  error(text: string): void;
  fromError(error: unknown, fallback?: string): void;
}

export interface AppServices {
  session: SessionStorage;
  http: HttpClient;
  books: BookService;
  authors: AuthorService;
  authApi: AuthApi;
  auth: AuthStore;
  subscriptions: SubscriptionService;
  reports: ReportService;
  toast: ToastService;
}

import { APP_SERVICES_TOKEN } from "./tokens";

export function provideAppServices(services: AppServices) {
  provide(APP_SERVICES_TOKEN, services);
}

export function useAppServices() {
  const services = inject(APP_SERVICES_TOKEN);
  if (!services) throw new Error("AppServices не подключены");
  return services;
}

export function createAuthStore(session: SessionStorage): AuthStore {
  const user = shallowRef<AuthUser | null>(session.read().user);
  const isUser = computed(() => user.value != null);

  return {
    user: readonly(user),
    isUser: readonly(isUser),
    login(response) {
      session.write(response.token, response.user, response.expires_at);
      user.value = response.user;
    },
    logout() {
      session.clear();
      user.value = null;
    },
  };
}

export function createToastService(): ToastService {
  const items = shallowRef<Toast[]>([]);

  function push(kind: ToastKind, text: string) {
    const id = Date.now() + Math.random();
    items.value = [...items.value, { id, kind, text }];
    window.setTimeout(() => {
      items.value = items.value.filter((item) => item.id !== id);
    }, TOAST_MS);
  }

  return {
    items,
    success: (text) => push(TOAST_KIND.ok, text),
    error: (text) => push(TOAST_KIND.err, text),
    fromError: (error, fallback) => {
      if (!isAbortError(error)) push(TOAST_KIND.err, errorMessage(error, fallback));
    },
  };
}

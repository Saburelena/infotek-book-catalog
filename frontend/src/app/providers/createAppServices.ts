import { createApiServices, createHttpClient, createSessionStorage } from "@/shared/api/httpClient";
import { HTTP_TIMEOUT_MS } from "@/shared/config/constants";
import { createAuthStore, createToastService, type AppServices } from "@/shared/di/container";

export function createAppServices(): AppServices {
  const session = createSessionStorage();
  const auth = createAuthStore(session);
  const http = createHttpClient({
    session,
    onUnauthorized: auth.logout,
    timeoutMs: HTTP_TIMEOUT_MS,
  });
  const api = createApiServices(http);

  return {
    session,
    http,
    auth,
    authApi: api.auth,
    books: api.books,
    authors: api.authors,
    subscriptions: api.subscriptions,
    reports: api.reports,
    toast: createToastService(),
  };
}

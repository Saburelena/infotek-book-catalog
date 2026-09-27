import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";

import type { AuthStore } from "@/shared/di/container";
import { REDIRECT_QUERY, ROUTE_ID, ROUTES } from "@/shared/config/constants";
import { safeRedirect } from "@/shared/lib/utils";

declare module "vue-router" {
  interface RouteMeta {
    auth?: boolean;
    guest?: boolean;
  }
}

function childPath(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function createAppRouter(auth: AuthStore) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: ROUTES.home,
        component: () => import("@/widgets/app-shell/ui/AppLayout.vue"),
        children: [
          { path: "", component: () => import("@/pages/books/ui/BooksPage.vue") },
          {
            path: childPath(ROUTES.authors),
            component: () => import("@/pages/authors/ui/AuthorsPage.vue"),
          },
          {
            path: childPath(ROUTES.report),
            component: () => import("@/pages/report/ui/ReportPage.vue"),
          },
          {
            path: childPath(ROUTES.login),
            component: () => import("@/pages/login/ui/LoginPage.vue"),
            meta: { guest: true },
          },
          {
            path: childPath(ROUTES.bookNew),
            component: () => import("@/pages/book-edit/ui/BookEditPage.vue"),
            meta: { auth: true },
          },
          {
            path: childPath(ROUTES.bookEdit(ROUTE_ID)),
            component: () => import("@/pages/book-edit/ui/BookEditPage.vue"),
            meta: { auth: true },
          },
          {
            path: childPath(ROUTES.authorNew),
            component: () => import("@/pages/author-edit/ui/AuthorEditPage.vue"),
            meta: { auth: true },
          },
          {
            path: childPath(ROUTES.authorEdit(ROUTE_ID)),
            component: () => import("@/pages/author-edit/ui/AuthorEditPage.vue"),
            meta: { auth: true },
          },
          {
            path: childPath(ROUTES.book(ROUTE_ID)),
            component: () => import("@/pages/book/ui/BookPage.vue"),
          },
          {
            path: childPath(ROUTES.author(ROUTE_ID)),
            component: () => import("@/pages/author/ui/AuthorPage.vue"),
          },
          { path: ":pathMatch(.*)*", redirect: ROUTES.home },
        ],
      },
    ],
    scrollBehavior: () => ({ top: 0 }),
  });

  const guard = (to: RouteLocationNormalized) => {
    if (to.meta.auth && !auth.isUser.value) {
      return {
        path: ROUTES.login,
        query: { [REDIRECT_QUERY]: to.fullPath },
      };
    }
    if (to.meta.guest && auth.isUser.value) {
      return safeRedirect(to.query[REDIRECT_QUERY]);
    }
  };

  router.beforeEach(guard);
  return { router, guard };
}

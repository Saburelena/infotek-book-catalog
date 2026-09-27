import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, expectTypeOf, it } from "vitest";

import { ROUTE_ID, ROUTES } from "@/shared/config/constants";
import { useIdParam, useIdQuery, useSearchFilter } from "./useSearchFilter";

const Stub = { template: "<div />" };

async function routerAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: ROUTES.home, component: Stub },
      { path: ROUTES.book(ROUTE_ID), component: Stub },
      { path: ROUTES.authors, component: Stub },
    ],
  });
  await router.push(path);
  await router.isReady();
  return router;
}

async function mountFilters(path: string) {
  const router = await routerAt(path);
  let api!: ReturnType<typeof useSearchFilter>;
  mount(
    defineComponent({
      setup() {
        api = useSearchFilter();
        return () => null;
      },
    }),
    { global: { plugins: [router] } },
  );
  return { api, router };
}

describe("useIdParam", () => {
  it("читает целый id и отбрасывает мусор", async () => {
    const router = await routerAt(ROUTES.book(12));
    let id!: ReturnType<typeof useIdParam>;
    mount(
      defineComponent({
        setup() {
          id = useIdParam();
          return () => null;
        },
      }),
      { global: { plugins: [router] } },
    );

    expect(id.value).toBe(12);

    await router.push(ROUTES.book("abc"));
    await flushPromises();
    expect(id.value).toBeNull();

    await router.push(ROUTES.home);
    await flushPromises();
    expect(id.value).toBeNull();
  });
});

describe("useIdQuery", () => {
  it("передаёт id в фабрику запроса", async () => {
    const router = await routerAt(ROUTES.book(12));
    let api!: { id: ReturnType<typeof useIdParam>; current: ReturnType<typeof useIdParam> };
    mount(
      defineComponent({
        setup() {
          api = useIdQuery((id) => ({ current: id }));
          return () => null;
        },
      }),
      { global: { plugins: [router] } },
    );

    expect(api.id.value).toBe(12);
    expect(api.current.value).toBe(12);
  });
});

describe("useSearchFilter", () => {
  it("разбирает query", async () => {
    const { api } = await mountFilters("/?page=2&search=Мастер&year=1869&author_id=3");
    expect(api.filters.value).toEqual({
      page: 2,
      search: "Мастер",
      year: "1869",
      authorId: "3",
    });
  });

  it("возвращает безопасные значения для пустого и некорректного query", async () => {
    const { api } = await mountFilters("/?page=abc&search=&year=bad&author_id=0");
    expect(api.filters.value).toEqual({
      page: 1,
      search: "",
      year: "bad",
      authorId: "0",
    });
  });

  it("пишет фильтр и сбрасывает страницу, пока page не в патче", async () => {
    const { api, router } = await mountFilters("/?page=2&year=1869");
    api.set({ search: "Идиот" });
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ year: "1869", search: "Идиот" });
    expect(api.filters.value.page).toBe(1);

    api.set({ page: 3 });
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe("3");
  });

  it("удаляет пустой ключ", async () => {
    const { api, router } = await mountFilters("/?year=1869");
    api.set({ year: "" });
    await flushPromises();
    expect(router.currentRoute.value.query.year).toBeUndefined();
  });

  it("берёт поиск из формы", async () => {
    const router = await routerAt("/?page=2");
    const wrapper = mount(
      defineComponent({
        setup: () => useSearchFilter(),
        template: `<form @submit="submit"><input name="search" value="Мастер" /></form>`,
      }),
      { global: { plugins: [router] } },
    );
    await wrapper.get("form").trigger("submit");
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ search: "Мастер" });
  });

  it("даёт v-model на query-ключ", async () => {
    const { api, router } = await mountFilters("/");
    expectTypeOf(api.model).parameter(0).toEqualTypeOf<"search" | "year" | "author_id">();
    const year = api.model("year");
    expect(year.value).toBe("");
    year.value = 1869;
    await flushPromises();
    expect(router.currentRoute.value.query.year).toBe("1869");
    expect(year.value).toBe("1869");
  });
});

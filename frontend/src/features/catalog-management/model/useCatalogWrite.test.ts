import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";

import { useCatalogWrite } from "./useCatalogWrite";

const services = {
  toast: {
    success: vi.fn(),
    fromError: vi.fn(),
  },
};

vi.mock("@/shared/di/container", () => ({
  useAppServices: () => services,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCatalogWrite", () => {
  it("redirects first, then invalidates list and detail caches", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div>home</div>" } },
        { path: "/authors", component: { template: "<div>authors</div>" } },
      ],
    });
    await router.push("/");
    await router.isReady();

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = mount(
      defineComponent({
        setup() {
          const run = useCatalogWrite();
          return { run };
        },
        template: "<div />",
      }),
      {
        global: {
          plugins: [router, [VueQueryPlugin, { queryClient }]],
        },
      },
    );

    await wrapper.vm.run("Книга удалена", "/authors");

    expect(invalidateSpy).toHaveBeenCalledTimes(5);
    expect(services.toast.success).toHaveBeenCalledWith("Книга удалена");
    expect(router.currentRoute.value.path).toBe("/authors");
  });

  it("uses toast fallback when invalidation fails", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div>home</div>" } }],
    });
    await router.push("/");
    await router.isReady();

    const queryClient = new QueryClient();
    vi.spyOn(queryClient, "invalidateQueries").mockRejectedValueOnce(new Error("boom"));

    const wrapper = mount(
      defineComponent({
        setup() {
          const run = useCatalogWrite();
          return { run };
        },
        template: "<div />",
      }),
      {
        global: {
          plugins: [router, [VueQueryPlugin, { queryClient }]],
        },
      },
    );

    await wrapper.vm.run("Книга удалена", "/");

    expect(services.toast.fromError).toHaveBeenCalledWith(
      expect.any(Error),
      "Сохранено, но данные на экране могут обновиться не сразу",
    );
    expect(router.currentRoute.value.path).toBe("/");
  });
});

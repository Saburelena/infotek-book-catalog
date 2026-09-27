import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { useBookEditor } from "./useBookEditor";

const { services, routerMock, afterSave } = vi.hoisted(() => ({
  services: {
    books: { save: vi.fn() },
    toast: { fromError: vi.fn() },
  },
  routerMock: { push: vi.fn() },
  afterSave: vi.fn(),
}));

vi.mock("@/shared/di/container", () => ({
  useAppServices: () => services,
}));

vi.mock("@/features/catalog-management", () => ({
  useCatalogWrite: () => afterSave,
}));

vi.mock("vue-router", () => ({
  useRouter: () => routerMock,
}));

describe("useBookEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mountEditor() {
    const queryClient = new QueryClient();
    return mount(
      defineComponent({
        setup() {
          const api = useBookEditor(null);
          return { ...api };
        },
        template: "<div />",
      }),
      {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]],
        },
      },
    );
  }

  it("blocks invalid form submission and keeps validation errors", async () => {
    const wrapper = mountEditor();

    await wrapper.vm.submit();

    expect(services.books.save).not.toHaveBeenCalled();
    expect(wrapper.vm.errors.title).toBe("Укажите название книги");
  });

  it("saves valid data, attaches cover and triggers catalog invalidation flow", async () => {
    services.books.save.mockResolvedValue({ id: 42 });
    const wrapper = mountEditor();

    wrapper.vm.form.title = "Мастер и Маргарита";
    wrapper.vm.form.year = "2024";
    wrapper.vm.form.isbn = "1234567890";
    wrapper.vm.form.author_ids = [7];
    wrapper.vm.onCover(new File(["cover"], "cover.png", { type: "image/png" }));

    await wrapper.vm.submit();
    await flushPromises();

    expect(services.books.save).toHaveBeenCalledTimes(1);
    const call = services.books.save.mock.calls[0];
    expect(call).toBeDefined();
    const payload = call?.[0] as FormData;
    expect(payload instanceof FormData).toBe(true);
    expect(payload.get("title")).toBe("Мастер и Маргарита");
    expect(payload.get("year")).toBe("2024");
    expect(payload.get("author_ids[]")).toBe("7");
    expect(afterSave).toHaveBeenCalledWith("Книга добавлена. Подписчики авторов получат SMS.", "/books/42");
  });

  it("pushes cancel target when user aborts form", async () => {
    const wrapper = mountEditor();

    await wrapper.vm.cancel();

    expect(routerMock.push).toHaveBeenCalledWith("/");
  });
});

import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { useAuthorEditor } from "./useAuthorEditor";

const { services, routerMock, afterSave } = vi.hoisted(() => ({
  services: {
    authors: { save: vi.fn() },
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

describe("useAuthorEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mountEditor(initialName: string, id: number | null = null) {
    const queryClient = new QueryClient();
    return mount(
      defineComponent({
        setup() {
          const api = useAuthorEditor(id, initialName);
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

  it("rejects empty author names before mutation", async () => {
    const wrapper = mountEditor("");

    await wrapper.vm.submit();

    expect(services.authors.save).not.toHaveBeenCalled();
    expect(wrapper.vm.error).toBe("Укажите ФИО автора");
  });

  it("saves trimmed author name and triggers post-save redirect flow", async () => {
    services.authors.save.mockResolvedValue({ id: 9, full_name: "Лев Толстой" });
    const wrapper = mountEditor("Лев Толстой", 9);

    wrapper.vm.fullName = "  Лев Толстой  ";
    await wrapper.vm.submit();
    await flushPromises();

    expect(services.authors.save).toHaveBeenCalledWith("Лев Толстой", 9, expect.any(AbortSignal));
    expect(afterSave).toHaveBeenCalledWith("Автор обновлён", "/authors/9");
  });

  it("navigates to author page on cancel", async () => {
    const wrapper = mountEditor("Лев Толстой", 9);

    await wrapper.vm.cancel();

    expect(routerMock.push).toHaveBeenCalledWith("/authors/9");
  });
});

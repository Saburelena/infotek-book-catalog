import { describe, expect, it, vi } from "vitest";
import { computed } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";

vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/features/auth";
import AppLayout from "./AppLayout.vue";

function createTestRouter(initialPath = "/") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div>Home</div>" } },
      { path: "/login", component: { template: "<div>Login</div>" } },
      { path: "/authors", component: { template: "<div>Authors</div>" } },
      { path: "/report", component: { template: "<div>Report</div>" } },
    ],
  });
  void router.push(initialPath);
  return router;
}

function mockAuth(options: {
  isUser?: boolean;
  user?: { id: number; username: string; role: string } | null;
  logout?: () => void;
}) {
  const { isUser = false, user = null, logout = vi.fn() } = options;

  vi.mocked(useAuth).mockReturnValue({
    isUser: computed(() => isUser),
    user: computed(() => user),
    logout,
  } as unknown as ReturnType<typeof useAuth>);

  return { logout };
}

const globalStubs = {
  ThemeToggle: { template: "<div class='theme-toggle-stub' />" },
};

describe("AppLayout", () => {
  it("shows login link for guest", async () => {
    mockAuth({ isUser: false });
    const router = createTestRouter("/");
    await router.isReady();

    const wrapper = mount(AppLayout, {
      global: { plugins: [router], stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Войти");
    expect(wrapper.text()).not.toContain("Выйти");
  });

  it("shows username and logout for authenticated user", async () => {
    mockAuth({
      isUser: true,
      user: { id: 1, username: "user", role: "user" },
    });
    const router = createTestRouter("/");
    await router.isReady();

    const wrapper = mount(AppLayout, {
      global: { plugins: [router], stubs: globalStubs },
    });

    expect(wrapper.find(".who").text()).toBe("user");
    expect(wrapper.text()).toContain("Выйти");
  });

  it("calls logout and redirects to home on logout click", async () => {
    const { logout } = mockAuth({
      isUser: true,
      user: { id: 1, username: "user", role: "user" },
    });
    const router = createTestRouter("/authors");
    await router.isReady();

    const wrapper = mount(AppLayout, {
      global: { plugins: [router], stubs: globalStubs },
    });

    const logoutButton = wrapper.findAll("button").find((b) => b.text() === "Выйти");
    if (!logoutButton) throw new Error("Кнопка Выйти не найдена");

    await logoutButton.trigger("click");
    await flushPromises();

    expect(logout).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("shows back link on login page", async () => {
    mockAuth({ isUser: false });
    const router = createTestRouter("/login");
    await router.isReady();

    const wrapper = mount(AppLayout, {
      global: { plugins: [router], stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Назад");
    expect(wrapper.text()).not.toContain("Войти");
  });
});

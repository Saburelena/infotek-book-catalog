import { describe, expect, it, vi, beforeEach } from "vitest";
import { effectScope, ref } from "vue";

vi.mock("@/shared/di/container", () => ({
  useAppServices: () => services,
}));

const services = {
  authApi: { login: vi.fn() },
  auth: {
    user: ref(null),
    isUser: ref(false),
    login: vi.fn(),
    logout: vi.fn(),
  },
};

beforeEach(() => {
  services.authApi.login.mockReset();
  services.auth.login.mockReset();
  services.auth.logout.mockReset();
});

describe("useAuth", () => {
  it("delegates login to injected services", async () => {
    const scope = effectScope();
    const { useAuth } = await import("./useAuth");

    services.authApi.login.mockResolvedValue({
      token: "t",
      expires_at: "2030",
      user: { id: 1, username: "user", role: "user" },
    });

    await scope.run(async () => {
      await useAuth().login("user", "user123");
    });

    scope.stop();

    expect(services.authApi.login).toHaveBeenCalledWith("user", "user123", expect.any(AbortSignal));
    expect(services.auth.login).toHaveBeenCalledOnce();
  });

  it("delegates logout to injected auth store", async () => {
    const scope = effectScope();
    const { useAuth } = await import("./useAuth");

    await scope.run(async () => {
      useAuth().logout();
    });

    scope.stop();

    expect(services.auth.logout).toHaveBeenCalledOnce();
  });
});

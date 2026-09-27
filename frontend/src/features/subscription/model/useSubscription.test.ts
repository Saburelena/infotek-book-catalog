import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { useSubscription } from "./useSubscription";

const services = {
  subscriptions: { subscribe: vi.fn() },
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

describe("useSubscription", () => {
  it("does not submit invalid phone values", async () => {
    const onSuccess = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup() {
          const api = useSubscription(7, onSuccess);
          return { ...api };
        },
        template: "<div />",
      }),
    );

    await wrapper.vm.submit();

    expect(services.subscriptions.subscribe).not.toHaveBeenCalled();
    expect(wrapper.vm.error).toBe("Укажите телефон в формате 7XXXXXXXXXX");
  });

  it("submits normalized phone and calls success callback", async () => {
    const onSuccess = vi.fn();
    services.subscriptions.subscribe.mockResolvedValue({ message: "Спасибо" });

    const wrapper = mount(
      defineComponent({
        setup() {
          const api = useSubscription(7, onSuccess);
          return { ...api };
        },
        template: "<div />",
      }),
    );

    wrapper.vm.phone = "8 (999) 123-45-67";
    await wrapper.vm.submit();

    expect(services.subscriptions.subscribe).toHaveBeenCalledWith(7, "79991234567", expect.any(AbortSignal));
    expect(services.toast.success).toHaveBeenCalledWith("Спасибо");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(wrapper.vm.pending).toBe(false);
  });

  it("shows API error without crashing the form state", async () => {
    const onSuccess = vi.fn();
    services.subscriptions.subscribe.mockRejectedValue(new Error("bad request"));

    const wrapper = mount(
      defineComponent({
        setup() {
          const api = useSubscription(7, onSuccess);
          return { ...api };
        },
        template: "<div />",
      }),
    );

    wrapper.vm.phone = "79991234567";
    await wrapper.vm.submit();

    expect(services.toast.success).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(wrapper.vm.error).toContain("Не удалось подписаться");
    expect(wrapper.vm.pending).toBe(false);
  });
});

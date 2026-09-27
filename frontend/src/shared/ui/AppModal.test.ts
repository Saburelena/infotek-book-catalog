import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick } from "vue";

import AppModal from "./AppModal.vue";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("AppModal", () => {
  it("focuses first element, handles Escape and restores focus after unmount", async () => {
    const close = vi.fn();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(
      defineComponent({
        components: { AppModal },
        emits: ["close"],
        setup() {
          return { close };
        },
        template: `
          <AppModal labelled-by="dialog-title" @close="close">
            <h2 id="dialog-title">Заголовок</h2>
            <button>Action 1</button>
            <button>Action 2</button>
          </AppModal>
        `,
      }),
      { attachTo: document.body },
    );

    await nextTick();
    expect(document.activeElement?.tagName).toBe("BUTTON");
    expect(document.activeElement?.textContent).toBe("Action 1");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();
    expect(close).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps focus cycling between first and last focusable elements", async () => {
    const wrapper = mount(
      defineComponent({
        components: { AppModal },
        template: `
          <AppModal labelled-by="dialog-title">
            <h2 id="dialog-title">Заголовок</h2>
            <input aria-label="first" />
            <button>Done</button>
          </AppModal>
        `,
      }),
      { attachTo: document.body },
    );

    await nextTick();
    const first = document.querySelector('input[aria-label="first"]') as HTMLElement;
    const last = document.querySelector("button") as HTMLElement;

    first.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, shiftKey: true }));
    await nextTick();
    expect(document.activeElement).toBe(last);

    last.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    await nextTick();
    expect(document.activeElement).toBe(first);

    wrapper.unmount();
  });
});

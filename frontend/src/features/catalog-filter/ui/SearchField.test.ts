import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, ref } from "vue";
import SearchField from "./SearchField.vue";

describe("SearchField", () => {
  it("не отдаёт черновик родителю, пока не отправили форму", async () => {
    const committed = ref("Мастер");
    const submitted = ref("");
    const Host = defineComponent({
      components: { SearchField },
      setup() {
        function onSubmit(event: Event) {
          const form = event.target;
          submitted.value = form instanceof HTMLFormElement ? String(new FormData(form).get("search") ?? "") : "";
        }
        return { committed, onSubmit };
      },
      template: `<form @submit.prevent="onSubmit"><SearchField :value="committed" placeholder="Найти" /></form>`,
    });
    const wrapper = mount(Host);
    const input = wrapper.get("input");

    expect(input.element).toMatchObject({ name: "search", value: "Мастер" });
    await input.setValue("Идиот");
    expect(committed.value).toBe("Мастер");
    expect(input.element.value).toBe("Идиот");

    await wrapper.get("form").trigger("submit");
    expect(submitted.value).toBe("Идиот");

    committed.value = "Булгаков";
    await wrapper.vm.$nextTick();
    expect(wrapper.get("input").element.value).toBe("Булгаков");
  });
});

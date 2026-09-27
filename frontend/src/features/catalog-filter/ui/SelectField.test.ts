import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SelectField from "./SelectField.vue";

describe("SelectField", () => {
  it("открывает список, выбирает значение и закрывает по Escape", async () => {
    const wrapper = mount(SelectField, {
      props: {
        label: "Автор",
        modelValue: "",
        options: [
          { value: "", label: "Все авторы" },
          { value: "3", label: "Булгаков" },
        ],
      },
      attachTo: document.body,
    });

    await wrapper.get(".ui-select-trigger").trigger("click");
    expect(wrapper.find(".ui-select-list").isVisible()).toBe(true);
    expect(wrapper.get(".ui-select-list").attributes("aria-activedescendant")).toBeTruthy();
    expect(wrapper.findAll(".ui-select-option")[0]!.attributes("id")).toBe(
      wrapper.get(".ui-select-list").attributes("aria-activedescendant"),
    );

    await wrapper.get(".ui-select-list").trigger("keydown", { key: "Escape" });
    expect(wrapper.find(".ui-select").classes()).not.toContain("open");

    await wrapper.get(".ui-select-trigger").trigger("click");
    await wrapper.findAll(".ui-select-option")[1]!.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["3"]);
    expect(wrapper.find(".ui-select").classes()).not.toContain("open");
    wrapper.unmount();
  });
});

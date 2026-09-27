import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import YearField from "./YearField.vue";

describe("YearField", () => {
  it("рисует кастомный select и меняет год", async () => {
    const wrapper = mount(YearField, {
      props: {
        years: [1967, 1869],
        emptyLabel: "Все годы",
        label: "Год",
        modelValue: "",
      },
      attachTo: document.body,
    });
    const trigger = wrapper.get(".ui-select-trigger");
    expect(trigger.attributes("aria-label")).toBe("Год");
    expect(trigger.text()).toContain("Все годы");

    await trigger.trigger("click");
    const options = wrapper.findAll(".ui-select-option").map((option) => option.text());
    expect(options).toEqual(["Все годы", "1967", "1869"]);

    await wrapper.findAll(".ui-select-option")[2]!.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["1869"]);
    wrapper.unmount();
  });
});

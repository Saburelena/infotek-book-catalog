import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import CatalogWidget from "./CatalogWidget.vue";

const baseProps = {
  title: "Книги",
  loading: false,
  error: false,
  empty: false,
};

describe("CatalogWidget", () => {
  it("renders loading skeleton", () => {
    const wrapper = mount(CatalogWidget, {
      props: { ...baseProps, loading: true },
    });
    expect(wrapper.find(".skeleton-line").exists()).toBe(true);
  });

  it("renders error state and emits retry on click", async () => {
    const wrapper = mount(CatalogWidget, {
      props: { ...baseProps, error: true },
    });
    expect(wrapper.text()).toContain("Не удалось загрузить");
    const retryButton = wrapper.find("button");
    expect(retryButton.exists()).toBe(true);
    await retryButton.trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
  });

  it("renders empty state", () => {
    const wrapper = mount(CatalogWidget, {
      props: { ...baseProps, empty: true },
    });
    expect(wrapper.text()).toContain("Ничего не найдено");
  });

  it("renders pagination when total_pages > 1", () => {
    const wrapper = mount(CatalogWidget, {
      props: {
        ...baseProps,
        pagination: { page: 2, total_pages: 3 },
      },
      slots: { default: "<div>content</div>" },
    });
    expect(wrapper.text()).toContain("Страница 2 из 3");
    expect(wrapper.text()).toContain("Назад");
    expect(wrapper.text()).toContain("Дальше");
  });

  it("emits page on next click", async () => {
    const wrapper = mount(CatalogWidget, {
      props: {
        ...baseProps,
        pagination: { page: 2, total_pages: 3 },
      },
    });
    const buttons = wrapper.findAll("button");
    const nextButton = buttons.find((b) => b.text() === "Дальше");
    expect(nextButton).toBeDefined();
    if (!nextButton) return;
    await nextButton.trigger("click");
    expect(wrapper.emitted("page")).toBeTruthy();
    expect(wrapper.emitted("page")?.[0]).toEqual([3]);
  });
});

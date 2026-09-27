import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import QueryLoaded from "./QueryLoaded.vue";
import QueryStatus from "./QueryStatus.vue";

describe("QueryStatus", () => {
  it("renders loading message when loading is true", () => {
    const wrapper = mount(QueryStatus, {
      props: {
        loading: true,
        error: false,
        loadingText: "Загружаем каталог",
        errorText: "Ошибка загрузки",
      },
    });

    expect(wrapper.text()).toContain("Загружаем каталог");
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it("renders error message when error is true", () => {
    const wrapper = mount(QueryStatus, {
      props: {
        loading: false,
        error: true,
        loadingText: "Загружаем каталог",
        errorText: "Ошибка загрузки",
      },
    });

    expect(wrapper.text()).toContain("Ошибка загрузки");
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it("renders empty state when no data", () => {
    const wrapper = mount(QueryStatus, {
      props: {
        loading: false,
        error: false,
        empty: true,
        loadingText: "Загружаем каталог",
        errorText: "Ошибка загрузки",
        emptyTitle: "Пусто",
        emptyText: "Ничего не найдено",
      },
    });

    expect(wrapper.text()).toContain("Пусто");
    expect(wrapper.text()).toContain("Ничего не найдено");
  });
});

describe("QueryLoaded", () => {
  it("renders loading state until data is available", () => {
    const wrapper = mount(QueryLoaded, {
      props: {
        loading: true,
        error: false,
        loadingText: "Загружаем",
        errorText: "Ошибка",
      },
      slots: {
        default: '<div class="result">Данные</div>',
      },
    });

    expect(wrapper.text()).toContain("Загружаем");
    expect(wrapper.find(".result").exists()).toBe(false);
  });

  it("renders slot result when data is loaded", () => {
    const wrapper = mount(QueryLoaded, {
      props: {
        loading: false,
        error: false,
        data: { id: 1 },
        loadingText: "Загружаем",
        errorText: "Ошибка",
      },
      slots: {
        default: '<div class="result">Данные</div>',
      },
    });

    expect(wrapper.find(".result").exists()).toBe(true);
    expect(wrapper.text()).toContain("Данные");
  });
});

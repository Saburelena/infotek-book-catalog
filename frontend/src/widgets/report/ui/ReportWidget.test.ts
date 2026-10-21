import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("@/entities/report", () => ({
  useReportQuery: vi.fn(),
  useCatalogYears: vi.fn(),
}));

vi.mock("@/features/catalog-filter", () => ({
  useSearchFilter: vi.fn(),
  YearField: { template: "<div class='year-field-mock' />" },
}));

import { createRouter, createMemoryHistory } from "vue-router";
import { useReportQuery, useCatalogYears } from "@/entities/report";
import { useSearchFilter } from "@/features/catalog-filter";
import ReportWidget from "./ReportWidget.vue";

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div>Home</div>" } },
      { path: "/authors/:id", component: { template: "<div>Author</div>" } },
    ],
  });
  void router.push("/");
  return router;
}

function mockComposables(options: {
  isLoading?: boolean;
  isError?: boolean;
  rows?: Array<{ author_id: number; rank: number; full_name: string; books_count: number }>;
}) {
  const { isLoading = false, isError = false, rows = [] } = options;

  vi.mocked(useReportQuery).mockReturnValue({
    isLoading,
    isError,
    data: { value: { items: rows } },
  } as unknown as ReturnType<typeof useReportQuery>);

  vi.mocked(useCatalogYears).mockReturnValue({
    years: [2026],
    loading: false,
    error: false,
  } as unknown as ReturnType<typeof useCatalogYears>);

  vi.mocked(useSearchFilter).mockReturnValue({
    filters: { value: { year: "2026" } },
    set: vi.fn(),
  } as unknown as ReturnType<typeof useSearchFilter>);
}

describe("ReportWidget", () => {
  it("renders loading skeleton", () => {
    mockComposables({ isLoading: true });
    const wrapper = mount(ReportWidget, { global: { plugins: [createTestRouter()] } });
    expect(wrapper.find(".skeleton-line").exists()).toBe(true);
  });

  it("renders error state", () => {
    mockComposables({ isError: true });
    const wrapper = mount(ReportWidget, { global: { plugins: [createTestRouter()] } });
    expect(wrapper.text()).toContain("Не удалось загрузить");
  });

  it("renders empty state when no rows", () => {
    mockComposables({ rows: [] });
    const wrapper = mount(ReportWidget, { global: { plugins: [createTestRouter()] } });
    expect(wrapper.text()).toContain("Нет данных");
  });

  it("renders rank list when rows exist", () => {
    mockComposables({
      rows: [
        { author_id: 1, rank: 1, full_name: "Лев Толстой", books_count: 2 },
        { author_id: 2, rank: 2, full_name: "Фёдор Достоевский", books_count: 1 },
      ],
    });
    const wrapper = mount(ReportWidget, { global: { plugins: [createTestRouter()] } });
    const items = wrapper.findAll("ol.rank-list li");
    expect(items).toHaveLength(2);
    expect(wrapper.text()).toContain("Лев Толстой");
    expect(wrapper.text()).toContain("Фёдор Достоевский");
  });
});

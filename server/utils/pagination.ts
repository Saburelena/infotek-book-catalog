import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from "../constants.js";

export function paginate<T>(
  items: T[],
  page: unknown = 1,
  perPage: unknown = DEFAULT_PER_PAGE,
) {
  const currentPage = Math.max(1, Number(page) || 1);
  const size = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(perPage) || DEFAULT_PER_PAGE),
  );
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = (currentPage - 1) * size;

  return {
    items: items.slice(start, start + size),
    pagination: {
      total,
      page: currentPage,
      per_page: size,
      total_pages: totalPages,
    },
  };
}

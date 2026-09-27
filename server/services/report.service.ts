import type { StoreRepository } from "../storage/storeRepository.js";
import { TOP_AUTHORS, YEAR_MAX, YEAR_MIN } from "../constants.js";

export class ReportService {
  constructor(private readonly repository: StoreRepository) {}

  topAuthors(rawYear: unknown) {
    const year = Number(rawYear);
    if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX) {
      return { invalidYear: true } as const;
    }

    const store = this.repository.snapshot();
    const counts = new Map<number, number>();

    for (const book of store.books) {
      if (book.year !== year) continue;
      for (const authorId of book.author_ids) {
        counts.set(authorId, (counts.get(authorId) || 0) + 1);
      }
    }

    const items = [...counts.entries()]
      .map(([authorId, booksCount]) => {
        const author = store.authors.find((item) => item.id === authorId);
        return {
          author_id: authorId,
          full_name: author?.full_name || "Неизвестный автор",
          books_count: booksCount,
        };
      })
      .sort(
        (a, b) =>
          b.books_count - a.books_count ||
          a.full_name.localeCompare(b.full_name, "ru"),
      )
      .slice(0, TOP_AUTHORS)
      .map((item, index) => ({ rank: index + 1, ...item }));

    return { result: { year, items } } as const;
  }
}

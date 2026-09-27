import type { AuthorListParams, BookListParams } from "@/shared/types/entities";

export const queryKeys = {
  booksRoot: ["books"] as const,
  books: (params: BookListParams) => ["books", params] as const,
  bookRoot: ["book"] as const,
  book: (id: number | null) => ["book", id] as const,
  authorsRoot: ["authors"] as const,
  authors: (params: AuthorListParams) => ["authors", params] as const,
  authorRoot: ["author"] as const,
  author: (id: number | null) => ["author", id] as const,
  reportRoot: ["report"] as const,
  report: (year: number) => ["report", year] as const,
};

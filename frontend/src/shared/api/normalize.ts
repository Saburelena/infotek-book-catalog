import { ROLE_USER } from "@/shared/config/constants";
import type {
  Author,
  AuthorShort,
  Book,
  BookShort,
  ErrorItem,
  ListPayload,
  LoginResponse,
  Pagination,
  TopAuthor,
} from "@/shared/types/entities";
import { ApiError } from "./errors";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function badPayload(): never {
  throw new ApiError(500, [{ field: "base", message: "Некорректный ответ сервера" }]);
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asList<T>(value: unknown, map: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const mapped = map(item);
    return mapped ? [mapped] : [];
  });
}

export function normalizeAuthorShort(value: unknown): AuthorShort | null {
  if (!isRecord(value) || !Number.isFinite(Number(value.id))) return null;
  return {
    id: asNumber(value.id),
    full_name: asString(value.full_name) || "Без имени",
  };
}

export function normalizeBookShort(value: unknown): BookShort | null {
  if (!isRecord(value) || !Number.isFinite(Number(value.id))) return null;
  return {
    id: asNumber(value.id),
    title: asString(value.title) || "Без названия",
    year: asNumber(value.year),
  };
}

export function normalizeBook(value: unknown): Book | null {
  if (!isRecord(value) || !Number.isFinite(Number(value.id))) return null;
  return {
    id: asNumber(value.id),
    title: asString(value.title),
    year: asNumber(value.year),
    description: asString(value.description),
    isbn: asString(value.isbn),
    cover_url: asString(value.cover_url),
    authors: asList(value.authors, normalizeAuthorShort),
  };
}

export function requireBook(value: unknown): Book {
  return normalizeBook(value) ?? badPayload();
}

export function normalizeAuthor(value: unknown): Author | null {
  if (!isRecord(value) || !Number.isFinite(Number(value.id))) return null;
  return {
    id: asNumber(value.id),
    full_name: asString(value.full_name) || "Без имени",
    books: asList(value.books, normalizeBookShort),
  };
}

export function requireAuthor(value: unknown): Author {
  return normalizeAuthor(value) ?? badPayload();
}

function normalizePagination(value: unknown, itemCount: number): Pagination {
  if (!isRecord(value)) {
    return { total: itemCount, page: 1, per_page: itemCount || 1, total_pages: 1 };
  }
  return {
    total: asNumber(value.total, itemCount),
    page: Math.max(1, asNumber(value.page, 1)),
    per_page: Math.max(1, asNumber(value.per_page, itemCount || 1)),
    total_pages: Math.max(0, asNumber(value.total_pages, 1)),
  };
}

export function normalizeList<T>(value: unknown, map: (item: unknown) => T | null): ListPayload<T> {
  if (!isRecord(value)) badPayload();
  const items = asList(value.items, map);
  return {
    items,
    pagination: normalizePagination(value.pagination, items.length),
  };
}

export function normalizeTopAuthors(value: unknown): {
  year: number;
  items: TopAuthor[];
} {
  if (!isRecord(value)) badPayload();
  return {
    year: asNumber(value.year),
    items: asList(value.items, (item) => {
      if (!isRecord(item) || !Number.isFinite(Number(item.author_id))) return null;
      return {
        rank: asNumber(item.rank),
        author_id: asNumber(item.author_id),
        full_name: asString(item.full_name) || "Без имени",
        books_count: asNumber(item.books_count),
      };
    }),
  };
}

export function normalizeLogin(value: unknown): LoginResponse {
  if (!isRecord(value) || typeof value.token !== "string" || !value.token) {
    badPayload();
  }
  const user = value.user;
  if (
    !isRecord(user) ||
    typeof user.id !== "number" ||
    typeof user.username !== "string" ||
    typeof user.role !== "string"
  ) {
    badPayload();
  }
  return {
    token: value.token,
    expires_at: asString(value.expires_at),
    user: {
      id: user.id,
      username: user.username,
      role: user.role === ROLE_USER ? ROLE_USER : ROLE_USER,
    },
  };
}

export function normalizeMessage(value: unknown, fallback: string) {
  if (!isRecord(value)) return { message: fallback };
  return { message: asString(value.message, fallback) };
}

export type NormalizedError = ErrorItem;

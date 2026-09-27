export const YEAR_MIN = 1000;
export const YEAR_MAX = 2100;

export const PAGE_SIZE = { books: 10, authors: 12, all: 100 } as const;
export const LIMIT = {
  name: 255,
  description: 4000,
  yearDigits: 4,
  isbnChars: 17,
  coverBytes: 5 * 1024 * 1024,
} as const;

export const ISBN10_PATTERN = /^\d{10}$/;
export const ISBN13_PATTERN = /^\d{13}$/;
export const PHONE_COUNTRY = "7";
export const PHONE_TRUNK = "8";
export const PHONE_LOCAL_DIGITS = 10;
export const PHONE_WITH_TRUNK_DIGITS = 11;
export const PHONE_PATTERN = /^7\d{10}$/;
export const COVER_EXT = /\.(jpe?g|png|webp|gif)$/i;
export const COVER_MIME = /^image\/(jpeg|png|webp|gif)$/;
export const COVER_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export const TOAST_MS = 4200;
export const QUERY_RETRY = 1;
export const QUERY_STALE_MS = 30_000;
export const HTTP_TIMEOUT_MS = 15_000;
export const API_PREFIX = "/api/v1";
export const ROUTE_ID = ":id";
export const HTTP_STATUS = {
  noContent: 204,
  unauthorized: 401,
  requestTimeout: 408,
} as const;
export const ROLE_USER = "user";
export type UserRole = typeof ROLE_USER;
export const TOAST_KIND = { ok: "ok", err: "err" } as const;
export type ToastKind = (typeof TOAST_KIND)[keyof typeof TOAST_KIND];

export const ROUTES = {
  home: "/",
  login: "/login",
  authors: "/authors",
  report: "/report",
  bookNew: "/books/new",
  authorNew: "/authors/new",
  book: (id: number | string) => `/books/${id}`,
  author: (id: number | string) => `/authors/${id}`,
  bookEdit: (id: number | string) => `/books/${id}/edit`,
  authorEdit: (id: number | string) => `/authors/${id}/edit`,
} as const;

export const API_PATH = {
  login: "/auth/login",
  books: "/books",
  book: (id: number) => `/books/${id}`,
  authors: "/authors",
  author: (id: number) => `/authors/${id}`,
  subscribe: (id: number) => `/authors/${id}/subscribe`,
  topAuthors: "/reports/top-authors",
} as const;

export const SESSION_KEYS = {
  token: "token",
  user: "user",
  exp: "expires_at",
} as const;

export const FORM_FIELD = {
  cover: "cover",
  authorIds: "author_ids[]",
} as const;

export const REDIRECT_QUERY = "from";

export const MESSAGE = {
  isbn: "ISBN должен содержать 10–13 цифр",
  phone: "Укажите телефон в формате 7XXXXXXXXXX",
  year: "Укажите корректный год выпуска",
  coverRequired: "Загрузите фото главной страницы",
  coverTooBig: "Файл больше 5 МБ",
  coverType: "Нужен файл изображения",
} as const;

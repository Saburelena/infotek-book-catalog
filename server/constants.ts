export const YEAR_MIN = 1000;
export const YEAR_MAX = 2100;
export const NAME_MAX = 255;
export const DESCRIPTION_MAX = 4000;
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_EXT = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
] as const;
export const COVER_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;
export const COVER_FALLBACK_EXT = ".jpg";
export const FIELD_COVER = "cover";
export const ISBN10_PATTERN = /^\d{10}$/;
export const ISBN13_PATTERN = /^\d{13}$/;
export const PHONE_COUNTRY = "7";
export const PHONE_TRUNK = "8";
export const PHONE_LOCAL_DIGITS = 10;
export const PHONE_WITH_TRUNK_DIGITS = 11;
export const PHONE_PATTERN = /^7\d{10}$/;
export const JWT_TTL_MS = 12 * 60 * 60 * 1000;
export const JWT_EXPIRES_IN = "12h" as const;
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 100;
export const TOP_AUTHORS = 10;
export const DEFAULT_PORT = 3001;
export const API_PREFIX = "/api/v1";
export const ROLE_USER = "user";
export const HTTP_STATUS = {
  created: 201,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  unprocessable: 422,
  internalServerError: 500,
} as const;
export const MESSAGE = {
  isbn: "ISBN должен содержать 10–13 цифр",
  phone: "Укажите телефон в формате 7XXXXXXXXXX",
  year: "Укажите корректный год выпуска",
  coverType: "Нужен файл изображения",
  coverTooBig: "Файл больше 5 МБ",
  coverRequired: "Загрузите фото главной страницы",
} as const;

import {
  COVER_EXT,
  COVER_MIME,
  ISBN10_PATTERN,
  ISBN13_PATTERN,
  LIMIT,
  MESSAGE,
  PHONE_COUNTRY,
  PHONE_LOCAL_DIGITS,
  PHONE_PATTERN,
  PHONE_TRUNK,
  PHONE_WITH_TRUNK_DIGITS,
  ROUTES,
  YEAR_MAX,
  YEAR_MIN,
} from "@/shared/config/constants";

export function parseId(value?: string | number | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function booksWord(n: number) {
  return plural(n, "книга", "книги", "книг");
}

export function coverFileError(file: File | null, required: boolean) {
  if (!file) return required ? MESSAGE.coverRequired : "";
  if (file.size > LIMIT.coverBytes) return MESSAGE.coverTooBig;
  if (!COVER_MIME.test(file.type) && !COVER_EXT.test(file.name)) {
    return MESSAGE.coverType;
  }
  return "";
}

export function parseYear(value: string | number) {
  const year = Number(value);
  return Number.isInteger(year) && year >= YEAR_MIN && year <= YEAR_MAX ? year : undefined;
}

export function uniqueYears(years: number[], extra?: string | number) {
  return [...new Set([Number(extra), ...years])].filter((year) => year > 0).sort((a, b) => b - a);
}

export function yearSelectOptions(years: number[] = [], emptyLabel?: string) {
  return [
    ...(emptyLabel ? [{ value: "", label: emptyLabel }] : []),
    ...years.map((year) => ({ value: String(year), label: String(year) })),
  ];
}

export function yearError(year: string) {
  return parseYear(year) === undefined ? MESSAGE.year : "";
}

export function isbnError(isbn: string) {
  const v = isbn.trim();
  if (!v) return "";
  const d = v.replaceAll("-", "");
  return ISBN10_PATTERN.test(d) || ISBN13_PATTERN.test(d) ? "" : MESSAGE.isbn;
}

export function normalizePhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === PHONE_WITH_TRUNK_DIGITS && d.startsWith(PHONE_TRUNK)) {
    return `${PHONE_COUNTRY}${d.slice(1)}`;
  }
  if (d.length === PHONE_LOCAL_DIGITS) return `${PHONE_COUNTRY}${d}`;
  return d;
}

export function phoneError(phone: string) {
  return PHONE_PATTERN.test(normalizePhone(phone)) ? "" : MESSAGE.phone;
}

export function safeRedirect(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith(ROUTES.login)) {
    return ROUTES.home;
  }
  return value;
}

export function mediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("blob:")) return url;
  if (/^https?:/i.test(url)) return url;
  if (url.startsWith("data:")) return "";
  return `${import.meta.env.VITE_API_ORIGIN || ""}${url}`;
}

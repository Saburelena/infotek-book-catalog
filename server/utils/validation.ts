import {
  DESCRIPTION_MAX,
  FIELD_COVER,
  ISBN10_PATTERN,
  ISBN13_PATTERN,
  MESSAGE,
  NAME_MAX,
  PHONE_COUNTRY,
  PHONE_LOCAL_DIGITS,
  PHONE_TRUNK,
  PHONE_WITH_TRUNK_DIGITS,
  PHONE_PATTERN,
  YEAR_MAX,
  YEAR_MIN,
} from "../constants.js";
import type { AuthorRecord, FieldError } from "../domain/types.js";

export function isValidIsbn(isbn: string) {
  const digits = String(isbn).replaceAll("-", "");
  return ISBN10_PATTERN.test(digits) || ISBN13_PATTERN.test(digits);
}

export function parseAuthorName(raw: unknown) {
  const fullName = String(raw || "").trim();
  if (!fullName) {
    return {
      error: {
        field: "full_name",
        message: "Укажите ФИО автора",
      } as FieldError,
    };
  }

  if (fullName.length > NAME_MAX) {
    return {
      error: {
        field: "full_name",
        message: "ФИО слишком длинное",
      } as FieldError,
    };
  }

  return { fullName };
}

export function parseAuthorIds(raw: unknown) {
  if (raw == null || raw === "") return [];

  const values = Array.isArray(raw)
    ? raw.flatMap((value) => String(value).split(","))
    : String(raw).split(",");

  return [
    ...new Set(
      values
        .map((value) => Number(value))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

export function validateBookInput(
  body: Record<string, unknown>,
  options: {
    requireAll: boolean;
    hasCover: boolean;
    authors: AuthorRecord[];
  },
) {
  const errors: FieldError[] = [];
  const title = body.title == null ? undefined : String(body.title).trim();
  const year =
    body.year === undefined || body.year === "" ? undefined : Number(body.year);
  const description =
    body.description == null ? undefined : String(body.description);
  const isbn = body.isbn == null ? undefined : String(body.isbn).trim();
  const rawIds = body.author_ids ?? body["author_ids[]"];
  const authorIds = rawIds === undefined ? undefined : parseAuthorIds(rawIds);

  if (options.requireAll || title !== undefined) {
    if (!title) {
      errors.push({ field: "title", message: "Укажите название книги" });
    } else if (title.length > NAME_MAX) {
      errors.push({ field: "title", message: "Название слишком длинное" });
    }
  }

  if (options.requireAll || year !== undefined) {
    if (
      year === undefined ||
      !Number.isInteger(year) ||
      year < YEAR_MIN ||
      year > YEAR_MAX
    ) {
      errors.push({ field: "year", message: MESSAGE.year });
    }
  }

  if (description && description.length > DESCRIPTION_MAX) {
    errors.push({
      field: "description",
      message: "Описание слишком длинное",
    });
  }

  if (options.requireAll || authorIds !== undefined) {
    if (!authorIds?.length) {
      errors.push({
        field: "author_ids",
        message: "Выберите хотя бы одного автора",
      });
    } else {
      const unknown = authorIds.filter(
        (id) => !options.authors.some((author) => author.id === id),
      );
      if (unknown.length) {
        errors.push({
          field: "author_ids",
          message: "Один или несколько авторов не найдены",
        });
      }
    }
  }

  if (isbn && !isValidIsbn(isbn)) {
    errors.push({ field: "isbn", message: MESSAGE.isbn });
  }

  if (options.requireAll && !options.hasCover) {
    errors.push({ field: FIELD_COVER, message: MESSAGE.coverRequired });
  }

  return {
    errors,
    value: {
      title,
      year,
      description,
      isbn,
      author_ids: authorIds,
    },
  };
}

export function normalizePhone(phone: unknown) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (
    digits.length === PHONE_WITH_TRUNK_DIGITS &&
    digits.startsWith(PHONE_TRUNK)
  ) {
    return `${PHONE_COUNTRY}${digits.slice(1)}`;
  }

  if (digits.length === PHONE_LOCAL_DIGITS) {
    return `${PHONE_COUNTRY}${digits}`;
  }

  return digits;
}

export function isValidPhone(phone: string) {
  return PHONE_PATTERN.test(phone);
}

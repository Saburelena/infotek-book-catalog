import { coverFileError, isbnError, yearError } from "@/shared/lib/utils";

export function validateAuthorName(fullName: string) {
  return fullName.trim() ? "" : "Укажите ФИО автора";
}

export function validateBookForm(input: {
  title: string;
  year: string;
  isbn: string;
  authorIds: number[];
  cover: File | null;
  coverRequired: boolean;
}) {
  const errors: Record<string, string> = {};
  if (!input.title.trim()) errors.title = "Укажите название книги";
  const yearMessage = yearError(input.year);
  if (yearMessage) errors.year = yearMessage;
  const isbnMessage = isbnError(input.isbn);
  if (isbnMessage) errors.isbn = isbnMessage;
  if (!input.authorIds.length) errors.author_ids = "Выберите хотя бы одного автора";
  const coverMessage = coverFileError(input.cover, input.coverRequired);
  if (coverMessage) errors.cover = coverMessage;
  return errors;
}

import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidIsbn,
  isValidPhone,
  normalizePhone,
  parseAuthorIds,
  parseAuthorName,
  validateBookInput,
} from "../utils/validation.js";

test("normalizes russian phone formats", () => {
  assert.equal(normalizePhone("8 (900) 111-22-33"), "79001112233");
  assert.equal(normalizePhone("9001112233"), "79001112233");
  assert.equal(isValidPhone("79001112233"), true);
});

test("parses author ids without duplicates", () => {
  assert.deepEqual(parseAuthorIds(["1,2", "2", "3"]), [1, 2, 3]);
});

test("validates author name", () => {
  assert.equal("error" in parseAuthorName(""), true);
  assert.deepEqual(parseAuthorName("Лев Толстой"), { fullName: "Лев Толстой" });
});

test("validates required book fields", () => {
  const result = validateBookInput(
    {
      title: "Война и мир",
      year: 1869,
      author_ids: [1],
    },
    {
      requireAll: true,
      hasCover: false,
      authors: [{ id: 1, full_name: "Лев Толстой" }],
    },
  );

  assert.deepEqual(result.errors, [
    { field: "cover", message: "Загрузите фото главной страницы" },
  ]);
});

test("accepts isbn with hyphens", () => {
  assert.equal(isValidIsbn("978-0-14-004239-6"), true);
});

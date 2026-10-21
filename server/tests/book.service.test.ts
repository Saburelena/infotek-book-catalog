import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import test from "node:test";

function mockMulterFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: "cover",
    originalname: "cover.svg",
    encoding: "7bit",
    mimetype: "image/svg+xml",
    size: 0,
    stream: Readable.from([]),
    destination: "",
    filename: "cover-test.svg",
    path: "",
    buffer: Buffer.from(""),
    ...overrides,
  };
}

import { createServerConfig } from "../config/env.js";
import { BookService } from "../services/book.service.js";
import { NotificationService } from "../services/notification.service.js";
import { createCoverStorage } from "../storage/coverStorage.js";
import { StoreRepository } from "../storage/storeRepository.js";

function createBookService(options?: { blobStoreId?: string; delBlob?: (url: string) => Promise<void> }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "infotek-book-service-"));
  const dataFile = path.join(root, "data", "store.json");
  const uploadsDir = path.join(root, "uploads");
  const config = { ...createServerConfig(), dataFile, uploadsDir };
  const repository = new StoreRepository({
    dataFile,
    onLoad: () => undefined,
  });
  const covers = createCoverStorage({
    uploadsDir,
    blobStoreId: options?.blobStoreId ?? "",
    delBlob: options?.delBlob,
  });
  const notifications = new NotificationService(repository, config);
  const service = new BookService(repository, covers, notifications, config);

  return {
    service,
    repository,
    covers,
    dataFile,
    uploadsDir,
    cleanup: async () => {
      await Promise.resolve();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test("returns books from the first page without filters", async () => {
  const { service, cleanup } = createBookService();

  try {
    const result = service.list({ page: 1, perPage: 10 });

    assert.ok(result.items.length > 0);
    assert.equal(result.pagination.page, 1);
    assert.ok(result.pagination.total > 0);
  } finally {
    await cleanup();
  }
});

test("searches books by author name", async () => {
  const { service, cleanup } = createBookService();

  try {
    const result = service.list({ search: "Толстой", page: 1, perPage: 10 });

    assert.ok(result.items.length > 0);
    assert.ok(result.items.every((book) => book.authors.some((author) => author.full_name.includes("Толстой"))));
  } finally {
    await cleanup();
  }
});

test("creates a book and persists it to the store", async () => {
  const { service, repository, cleanup } = createBookService();

  try {
    const initialCount = repository.snapshot().books.length;

    const result = await service.create(
      {
        title: "Тестовая книга",
        year: 2026,
        author_ids: [1, 2],
      },
      mockMulterFile(),
    );

    assert.ok("book" in result);
    assert.ok(result.book);
    const book = result.book;
    assert.equal(book.title, "Тестовая книга");
    assert.equal(book.year, 2026);
    assert.deepEqual(book.authors, [
      { id: 1, full_name: "Лев Николаевич Толстой" },
      { id: 2, full_name: "Фёдор Михайлович Достоевский" },
    ]);

    assert.equal(repository.snapshot().books.length, initialCount + 1);

    const createdBook = repository.snapshot().books.find((b) => b.title === "Тестовая книга");
    assert.ok(createdBook);
    assert.equal(createdBook.year, 2026);
    assert.deepEqual(createdBook.author_ids, [1, 2]);
    assert.ok(createdBook.cover_url.startsWith("/uploads/"));

    assert.equal(repository.snapshot().next.book, repository.snapshot().books.length + 1);
  } finally {
    await cleanup();
  }
});

test("updates an existing book and persists the changes", async () => {
  const { service, repository, dataFile, cleanup } = createBookService();

  try {
    const existingBookId = 1;
    const existingBook = repository.snapshot().books.find((b) => b.id === existingBookId);
    assert.ok(existingBook);
    const originalIsbn = existingBook.isbn;

    const result = service.update(
      String(existingBookId),
      {
        title: "Война и мир (обновлённое издание)",
        year: 1870,
        isbn: originalIsbn,
        author_ids: [1],
      },
      undefined,
    );

    assert.ok("book" in result);
    assert.ok(result.book);
    const updatedBook = result.book;
    assert.equal(updatedBook.title, "Война и мир (обновлённое издание)");
    assert.equal(updatedBook.year, 1870);
    assert.ok(updatedBook.authors.length > 0);
    assert.equal(updatedBook.authors[0]?.id, 1);

    const liveBook = repository.snapshot().books.find((b) => b.id === existingBookId);
    assert.ok(liveBook);
    assert.equal(liveBook.title, "Война и мир (обновлённое издание)");
    assert.equal(liveBook.year, 1870);
    assert.equal(liveBook.isbn, originalIsbn);

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      books: Array<{
        id: number;
        title: string;
        year: number;
        isbn: string;
        author_ids: number[];
      }>;
    };

    const persistedBook = persistedStore.books.find((book) => book.id === existingBookId);

    assert.ok(persistedBook);
    assert.equal(persistedBook.title, "Война и мир (обновлённое издание)");
    assert.equal(persistedBook.year, 1870);
    assert.equal(persistedBook.isbn, originalIsbn);
    assert.deepEqual(persistedBook.author_ids, [1]);
  } finally {
    await cleanup();
  }
});

test("patches only provided fields and persists the changes", async () => {
  const { service, repository, dataFile, cleanup } = createBookService();

  try {
    const existingBookId = 1;
    const existingBook = repository.snapshot().books.find((b) => b.id === existingBookId);
    assert.ok(existingBook);

    const originalTitle = existingBook.title;
    const originalIsbn = existingBook.isbn;
    const originalAuthorIds = [...existingBook.author_ids];

    const result = service.patch(String(existingBookId), {
      year: 1901,
    });

    assert.ok("book" in result);
    assert.ok(result.book);
    const patchedBook = result.book;

    assert.equal(patchedBook.year, 1901);
    assert.equal(patchedBook.title, originalTitle);
    assert.equal(patchedBook.isbn, originalIsbn);
    assert.deepEqual(
      patchedBook.authors.map((author) => author.id),
      originalAuthorIds,
    );

    const liveBook = repository.snapshot().books.find((b) => b.id === existingBookId);
    assert.ok(liveBook);
    assert.equal(liveBook.year, 1901);
    assert.equal(liveBook.title, originalTitle);
    assert.equal(liveBook.isbn, originalIsbn);
    assert.deepEqual(liveBook.author_ids, originalAuthorIds);

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      books: Array<{
        id: number;
        title: string;
        year: number;
        isbn: string;
        author_ids: number[];
      }>;
    };

    const persistedBook = persistedStore.books.find((book) => book.id === existingBookId);

    assert.ok(persistedBook);
    assert.equal(persistedBook.year, 1901);
    assert.equal(persistedBook.title, originalTitle);
    assert.equal(persistedBook.isbn, originalIsbn);
    assert.deepEqual(persistedBook.author_ids, originalAuthorIds);
  } finally {
    await cleanup();
  }
});

test("deletes a book, its uploaded cover, and persists the deletion", async () => {
  const { service, repository, dataFile, uploadsDir, cleanup } = createBookService();

  try {
    const existingBookId = 1;
    const existingBook = repository.snapshot().books.find((b) => b.id === existingBookId);
    assert.ok(existingBook);

    const uploadedCoverFilename = "user-cover.svg";
    const uploadedCoverPath = path.join(uploadsDir, uploadedCoverFilename);

    fs.writeFileSync(uploadedCoverPath, "<svg />", "utf8");
    existingBook.cover_url = `/uploads/${uploadedCoverFilename}`;

    const initialCount = repository.snapshot().books.length;

    const result = service.remove(String(existingBookId));

    assert.equal(result, true);
    assert.equal(repository.snapshot().books.length, initialCount - 1);
    assert.equal(
      repository.snapshot().books.some((book) => book.id === existingBookId),
      false,
    );
    assert.equal(fs.existsSync(uploadedCoverPath), false);

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      books: Array<{
        id: number;
      }>;
    };

    assert.equal(
      persistedStore.books.some((book) => book.id === existingBookId),
      false,
    );
  } finally {
    await cleanup();
  }
});

test("creates a book with a Blob URL and does not create a local file", async () => {
  const blobStoreId = "teststore";
  const { service, repository, uploadsDir, cleanup } = createBookService({
    blobStoreId,
  });

  try {
    const blobUrl = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/test.jpg`;

    const result = await service.create(
      {
        title: "Книга с Blob обложкой",
        year: 2026,
        author_ids: [1],
        cover_url: blobUrl,
      },
      undefined,
    );

    assert.ok("book" in result);
    assert.ok(result.book);
    const book = result.book;
    assert.equal(book.cover_url, blobUrl);

    const stored = repository.snapshot().books.find((b) => b.title === "Книга с Blob обложкой");
    assert.ok(stored);
    assert.equal(stored.cover_url, blobUrl);

    assert.deepEqual(fs.readdirSync(uploadsDir), []);
  } finally {
    await cleanup();
  }
});

test("rejects create when both file and Blob URL are provided", async () => {
  const blobStoreId = "teststore";
  const { service, cleanup } = createBookService({ blobStoreId });

  try {
    const blobUrl = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/test.jpg`;

    const result = await service.create(
      {
        title: "Конфликт обложек",
        year: 2026,
        author_ids: [1],
        cover_url: blobUrl,
      },
      mockMulterFile(),
    );

    assert.ok("errors" in result);
    assert.deepEqual(result.errors, [
      { field: "cover", message: "Нельзя передать и файл, и URL обложки одновременно" },
    ]);
  } finally {
    await cleanup();
  }
});

test("updates a book with a Blob URL and removes the previous local cover", async () => {
  const blobStoreId = "teststore";
  const { service, repository, uploadsDir, cleanup } = createBookService({
    blobStoreId,
  });

  try {
    const bookId = 1;
    const book = repository.snapshot().books.find((b) => b.id === bookId);
    assert.ok(book);

    const oldFilename = "old-cover.svg";
    const oldPath = path.join(uploadsDir, oldFilename);
    fs.writeFileSync(oldPath, "<svg />", "utf8");
    book.cover_url = `/uploads/${oldFilename}`;

    const blobUrl = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/new.jpg`;

    const result = service.update(
      String(bookId),
      {
        title: book.title,
        year: book.year,
        author_ids: book.author_ids,
        cover_url: blobUrl,
      },
      undefined,
    );

    assert.ok("book" in result);
    assert.ok(result.book);
    assert.equal(result.book.cover_url, blobUrl);
    assert.equal(fs.existsSync(oldPath), false);
  } finally {
    await cleanup();
  }
});

test("remove with Blob URL calls delBlob and does not touch local files", async () => {
  const blobStoreId = "teststore";
  const calls: string[] = [];
  const delBlob = async (url: string) => {
    calls.push(url);
  };

  const { service, repository, cleanup } = createBookService({
    blobStoreId,
    delBlob,
  });

  try {
    const bookId = 1;
    const book = repository.snapshot().books.find((b) => b.id === bookId);
    assert.ok(book);

    const blobUrl = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/test.jpg`;
    book.cover_url = blobUrl;

    const removed = service.remove(String(bookId));
    assert.equal(removed, true);

    await Promise.resolve();

    assert.deepEqual(calls, [blobUrl]);
  } finally {
    await cleanup();
  }
});

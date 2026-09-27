import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createServerConfig } from "../config/env.js";
import { BookService } from "../services/book.service.js";
import { NotificationService } from "../services/notification.service.js";
import { createCoverStorage } from "../storage/coverStorage.js";
import { StoreRepository } from "../storage/storeRepository.js";

function createBookService() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "infotek-book-service-"));
  const dataFile = path.join(root, "data", "store.json");
  const uploadsDir = path.join(root, "uploads");
  const config = { ...createServerConfig(), dataFile, uploadsDir };
  const repository = new StoreRepository({
    dataFile,
    onLoad: () => undefined,
  });
  const covers = createCoverStorage({ uploadsDir });
  const notifications = new NotificationService(repository, config);
  const service = new BookService(repository, covers, notifications, config);

  return {
    service,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

test("returns books from the first page without filters", () => {
  const { service, cleanup } = createBookService();

  try {
    const result = service.list({ page: 1, perPage: 10 });

    assert.ok(result.items.length > 0);
    assert.equal(result.pagination.page, 1);
    assert.ok(result.pagination.total > 0);
  } finally {
    cleanup();
  }
});

test("searches books by author name", () => {
  const { service, cleanup } = createBookService();

  try {
    const result = service.list({ search: "Толстой", page: 1, perPage: 10 });

    assert.ok(result.items.length > 0);
    assert.ok(
      result.items.every((book) =>
        book.authors.some((author) => author.full_name.includes("Толстой")),
      ),
    );
  } finally {
    cleanup();
  }
});

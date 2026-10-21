import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createServerConfig } from "../config/env.js";
import { AuthorService } from "../services/author.service.js";
import { StoreRepository } from "../storage/storeRepository.js";

function createAuthorService() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "infotek-author-service-"));
  const dataFile = path.join(root, "data", "store.json");
  const config = { ...createServerConfig(), dataFile };
  const repository = new StoreRepository({
    dataFile,
    onLoad: () => undefined,
  });
  const service = new AuthorService(repository, config);

  return {
    service,
    repository,
    dataFile,
    cleanup: async () => {
      await Promise.resolve();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test("creates an author and persists it to the store", async () => {
  const { service, repository, dataFile, cleanup } = createAuthorService();

  try {
    const initialCount = repository.snapshot().authors.length;
    const initialNextAuthorId = repository.snapshot().next.author;

    const result = service.create("Иван Иванов");

    assert.ok("author" in result);
    assert.ok(result.author);
    const author = result.author;

    assert.equal(author.id, initialNextAuthorId);
    assert.equal(author.full_name, "Иван Иванов");
    assert.deepEqual(author.books, []);

    assert.equal(repository.snapshot().authors.length, initialCount + 1);

    const liveAuthor = repository.snapshot().authors.find((item) => item.id === initialNextAuthorId);

    assert.ok(liveAuthor);
    assert.equal(liveAuthor.full_name, "Иван Иванов");
    assert.equal(repository.snapshot().next.author, initialNextAuthorId + 1);

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      authors: Array<{
        id: number;
        full_name: string;
      }>;
      next: {
        author: number;
      };
    };

    const persistedAuthor = persistedStore.authors.find((item) => item.id === initialNextAuthorId);

    assert.ok(persistedAuthor);
    assert.equal(persistedAuthor.full_name, "Иван Иванов");
    assert.equal(persistedStore.next.author, initialNextAuthorId + 1);
  } finally {
    await cleanup();
  }
});

test("removes an author and cascades to books and subscriptions", async () => {
  const { service, repository, dataFile, cleanup } = createAuthorService();

  try {
    const authorId = 3;
    const initialNextAuthorId = repository.snapshot().next.author;

    const affectedBookIds = repository
      .snapshot()
      .books.filter((book) => book.author_ids.includes(authorId))
      .map((book) => book.id);

    const initialSubscriptionCount = repository
      .snapshot()
      .subscriptions.filter((item) => item.author_id === authorId).length;

    assert.deepEqual(affectedBookIds, [6, 7]);
    assert.equal(initialSubscriptionCount, 1);

    const result = service.remove(String(authorId));

    assert.equal(result, true);

    assert.equal(
      repository.snapshot().authors.some((author) => author.id === authorId),
      false,
    );

    for (const bookId of affectedBookIds) {
      const book = repository.snapshot().books.find((item) => item.id === bookId);

      assert.ok(book);
      assert.equal(book.author_ids.includes(authorId), false);
    }

    assert.equal(
      repository.snapshot().subscriptions.some((item) => item.author_id === authorId),
      false,
    );

    assert.equal(repository.snapshot().next.author, initialNextAuthorId);

    assert.ok(repository.snapshot().authors.some((author) => author.id === 1));
    assert.ok(repository.snapshot().books.some((book) => book.id === 1));

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      authors: Array<{
        id: number;
        full_name: string;
      }>;
      books: Array<{
        id: number;
        author_ids: number[];
      }>;
      subscriptions: Array<{
        id: number;
        author_id: number;
      }>;
      next: {
        author: number;
      };
    };

    assert.equal(
      persistedStore.authors.some((author) => author.id === authorId),
      false,
    );

    for (const bookId of affectedBookIds) {
      const book = persistedStore.books.find((item) => item.id === bookId);

      assert.ok(book);
      assert.equal(book.author_ids.includes(authorId), false);
    }

    assert.equal(
      persistedStore.subscriptions.some((item) => item.author_id === authorId),
      false,
    );

    assert.equal(persistedStore.next.author, initialNextAuthorId);
  } finally {
    await cleanup();
  }
});

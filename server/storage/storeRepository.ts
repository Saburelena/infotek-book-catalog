import fs from "node:fs";
import path from "node:path";

import {
  DEMO_USER,
  authors as seedAuthors,
  books as seedBooks,
  subscriptions as seedSubs,
} from "../seed.js";
import type {
  AuthorRecord,
  BookRecord,
  Store,
  SubscriptionRecord,
} from "../domain/types.js";

type StoreRepositoryOptions = {
  dataFile: string;
  onLoad: (books: BookRecord[]) => void;
};

const STORE_VERSION = 1;

function normalizeStore(value: unknown): Store | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const users = Array.isArray(candidate.users)
    ? (candidate.users as Store["users"])
    : [];
  const authors = Array.isArray(candidate.authors)
    ? (candidate.authors as AuthorRecord[])
    : [];
  const books = Array.isArray(candidate.books)
    ? (candidate.books as BookRecord[])
    : [];
  const subscriptions = Array.isArray(candidate.subscriptions)
    ? (candidate.subscriptions as SubscriptionRecord[])
    : [];
  const smsLog = Array.isArray(candidate.smsLog)
    ? (candidate.smsLog as Store["smsLog"])
    : [];

  if (
    !users.length &&
    !authors.length &&
    !books.length &&
    !subscriptions.length
  )
    return null;

  const candidateNext =
    candidate.next && typeof candidate.next === "object"
      ? (candidate.next as Record<string, unknown>)
      : {};

  const next = {
    author: Number(candidateNext.author ?? 0),
    book: Number(candidateNext.book ?? 0),
    sub: Number(candidateNext.sub ?? 0),
  };

  const maxAuthorId = authors.reduce(
    (max, author) => Math.max(max, author.id),
    0,
  );
  const maxBookId = books.reduce((max, book) => Math.max(max, book.id), 0);
  const maxSubId = subscriptions.reduce((max, sub) => Math.max(max, sub.id), 0);

  return {
    users,
    authors,
    books,
    subscriptions,
    smsLog,
    next: {
      author: next.author || maxAuthorId + 1,
      book: next.book || maxBookId + 1,
      sub: next.sub || maxSubId + 1,
    },
    version: STORE_VERSION,
  };
}

export class StoreRepository {
  private readonly data: Store;
  private pendingPersist: Store | null = null;
  private persistQueued = false;

  constructor(options: StoreRepositoryOptions) {
    fs.mkdirSync(options.dataFile.replace(/[/\\][^/\\]+$/, ""), {
      recursive: true,
    });
    this.data = this.load(options);
  }

  private load(options: StoreRepositoryOptions) {
    if (fs.existsSync(options.dataFile)) {
      try {
        const parsed = JSON.parse(
          fs.readFileSync(options.dataFile, "utf8"),
        ) as unknown;
        const normalized = normalizeStore(parsed);
        if (normalized) {
          options.onLoad(normalized.books);
          return { ...normalized, version: STORE_VERSION };
        }
      } catch {
        // Fall back to deterministic seed data.
      }
    }

    const initial: Store = {
      users: [DEMO_USER],
      authors: structuredClone(seedAuthors),
      books: structuredClone(seedBooks),
      subscriptions: structuredClone(seedSubs),
      smsLog: [],
      next: { author: 13, book: 21, sub: 2 },
      version: STORE_VERSION,
    };

    options.onLoad(initial.books);
    this.writeNow(initial, options.dataFile);
    return initial;
  }

  private writeNow(snapshot: Store, dataFile: string) {
    fs.writeFileSync(dataFile, JSON.stringify(snapshot, null, 2), "utf8");
  }

  persist(dataFile: string) {
    this.pendingPersist = { ...this.data, version: STORE_VERSION };
    if (this.persistQueued) return;

    this.persistQueued = true;
    queueMicrotask(() => {
      this.persistQueued = false;
      const snapshot = this.pendingPersist;
      this.pendingPersist = null;
      if (!snapshot) return;

      this.writeNow(snapshot, dataFile);
    });
  }

  snapshot() {
    return this.data;
  }

  findBook(id: string | undefined) {
    return this.data.books.find((item) => item.id === Number(id));
  }

  findAuthor(id: string | undefined) {
    return this.data.authors.find((item) => item.id === Number(id));
  }

  removeBook(id: string | undefined) {
    const index = this.data.books.findIndex((item) => item.id === Number(id));
    return index === -1 ? undefined : this.data.books.splice(index, 1)[0];
  }

  removeAuthor(id: string | undefined) {
    const index = this.data.authors.findIndex((item) => item.id === Number(id));
    return index === -1 ? undefined : this.data.authors.splice(index, 1)[0];
  }

  nextBookId() {
    return this.data.next.book++;
  }

  nextAuthorId() {
    return this.data.next.author++;
  }

  nextSubscriptionId() {
    return this.data.next.sub++;
  }
}

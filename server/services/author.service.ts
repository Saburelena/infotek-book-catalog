import type { AuthorRecord } from "../domain/types.js";
import type { ServerConfig } from "../config/env.js";
import type { StoreRepository } from "../storage/storeRepository.js";
import { paginate } from "../utils/pagination.js";
import { parseAuthorName } from "../utils/validation.js";

export class AuthorService {
  constructor(
    private readonly repository: StoreRepository,
    private readonly config: ServerConfig,
  ) {}

  list(params: { search?: unknown; page?: unknown; perPage?: unknown }) {
    let items = [...this.repository.snapshot().authors];

    if (params.search) {
      const query = String(params.search).toLowerCase();
      items = items.filter((author) =>
        author.full_name.toLowerCase().includes(query),
      );
    }

    items.sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));

    const result = paginate(items, params.page, params.perPage);
    return {
      items: result.items.map((author) => this.authorShort(author)),
      pagination: result.pagination,
    };
  }

  get(id: string | undefined) {
    const author = this.repository.findAuthor(id);
    if (!author) return null;
    return this.serialize(author);
  }

  create(rawName: unknown) {
    const parsed = parseAuthorName(rawName);
    if ("error" in parsed) return { error: parsed.error } as const;

    const author: AuthorRecord = {
      id: this.repository.nextAuthorId(),
      full_name: parsed.fullName,
    };

    this.repository.snapshot().authors.push(author);
    this.repository.persist(this.config.dataFile);

    return { author: this.serialize(author) } as const;
  }

  update(id: string | undefined, rawName: unknown) {
    const author = this.repository.findAuthor(id);
    if (!author) return { missing: true } as const;

    const parsed = parseAuthorName(rawName);
    if ("error" in parsed) return { error: parsed.error } as const;

    author.full_name = parsed.fullName;
    this.repository.persist(this.config.dataFile);

    return { author: this.serialize(author) } as const;
  }

  remove(id: string | undefined) {
    const author = this.repository.removeAuthor(id);
    if (!author) return false;

    const store = this.repository.snapshot();
    store.books.forEach((book) => {
      book.author_ids = book.author_ids.filter(
        (authorId) => authorId !== author.id,
      );
    });
    store.subscriptions = store.subscriptions.filter(
      (item) => item.author_id !== author.id,
    );

    this.repository.persist(this.config.dataFile);
    return true;
  }

  authorShort(author: AuthorRecord) {
    return { id: author.id, full_name: author.full_name };
  }

  serialize(author: AuthorRecord) {
    return {
      id: author.id,
      full_name: author.full_name,
      books: this.repository
        .snapshot()
        .books.filter((book) => book.author_ids.includes(author.id))
        .map((book) => ({ id: book.id, title: book.title, year: book.year })),
    };
  }
}

export type SerializedAuthor = ReturnType<AuthorService["serialize"]>;

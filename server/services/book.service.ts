import type { AuthorRecord, BookRecord } from "../domain/types.js";
import type { ServerConfig } from "../config/env.js";
import { FIELD_COVER, MESSAGE } from "../constants.js";
import type { CoverStorage } from "../storage/coverStorage.js";
import type { StoreRepository } from "../storage/storeRepository.js";
import { paginate } from "../utils/pagination.js";
import { validateBookInput } from "../utils/validation.js";
import type { NotificationService } from "./notification.service.js";

function includesWholeWord(text: string, query: string) {
  const normalizedText = text.toLocaleLowerCase("ru-RU");
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapedQuery}($|[^\\p{L}\\p{N}])`, "u").test(normalizedText);
}

export class BookService {
  constructor(
    private readonly repository: StoreRepository,
    private readonly covers: CoverStorage,
    private readonly notifications: NotificationService,
    private readonly config: ServerConfig,
  ) {}

  list(params: { search?: unknown; year?: unknown; author_id?: unknown; page?: unknown; perPage?: unknown }) {
    const store = this.repository.snapshot();
    let items = [...store.books];

    if (typeof params.search === "string" && params.search) {
      const query = params.search.trim().toLocaleLowerCase("ru-RU");
      if (query) {
        items = items.filter((book) => {
          const authors = store.authors
            .filter((author) => book.author_ids.includes(author.id))
            .map((author) => author.full_name)
            .join(" ");

          return (
            includesWholeWord(book.title, query) ||
            includesWholeWord(book.description || "", query) ||
            (book.isbn || "").includes(query) ||
            includesWholeWord(authors, query)
          );
        });
      }
    }

    if (params.year) items = items.filter((book) => book.year === Number(params.year));
    if (params.author_id) {
      items = items.filter((book) => book.author_ids.includes(Number(params.author_id)));
    }

    items.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, "ru"));

    const result = paginate(items, params.page, params.perPage);
    return {
      items: result.items.map((book) => this.serializeBook(book)),
      pagination: result.pagination,
    };
  }

  get(id: string | undefined) {
    const book = this.repository.findBook(id);
    if (!book) return null;
    return this.serializeBook(book);
  }

  async create(body: Record<string, unknown>, file: Express.Multer.File | undefined) {
    const store = this.repository.snapshot();
    const rawCoverUrl = typeof body.cover_url === "string" ? body.cover_url : undefined;
    const providedBlobUrl = this.covers.isBlobUrl(rawCoverUrl) ? rawCoverUrl : undefined;
    const coverProvided = Boolean(file || providedBlobUrl);

    if (file && providedBlobUrl) {
      return {
        errors: [{ field: FIELD_COVER, message: MESSAGE.coverConflict }],
      };
    }

    const { errors, value } = validateBookInput(body, {
      requireAll: true,
      hasCover: coverProvided,
      authors: store.authors,
    });

    if (errors.length || !value.title || value.year === undefined || !value.author_ids) {
      return {
        errors: errors.length ? errors : [{ field: FIELD_COVER, message: MESSAGE.coverRequired }],
      };
    }

    let coverUrl: string;
    if (file) {
      coverUrl = this.covers.uploadedUrl(file);
    } else if (providedBlobUrl) {
      coverUrl = providedBlobUrl;
    } else {
      return {
        errors: [{ field: FIELD_COVER, message: MESSAGE.coverRequired }],
      };
    }

    const book: BookRecord = {
      id: this.repository.nextBookId(),
      title: value.title,
      year: value.year,
      description: value.description || "",
      isbn: value.isbn || "",
      cover_url: coverUrl,
      author_ids: value.author_ids,
    };

    store.books.unshift(book);
    this.repository.persist(this.config.dataFile);
    await this.notifications.notifySubscribers(book);

    return { book: this.serializeBook(book) } as const;
  }

  update(id: string | undefined, body: Record<string, unknown>, file: Express.Multer.File | undefined) {
    const book = this.repository.findBook(id);
    if (!book) return { missing: true } as const;

    const store = this.repository.snapshot();
    const rawCoverUrl = typeof body.cover_url === "string" ? body.cover_url : undefined;
    const providedBlobUrl = this.covers.isBlobUrl(rawCoverUrl) ? rawCoverUrl : undefined;

    if (file && providedBlobUrl) {
      return {
        errors: [{ field: FIELD_COVER, message: MESSAGE.coverConflict }],
      };
    }

    const { errors, value } = validateBookInput(body, {
      requireAll: true,
      hasCover: Boolean(file || providedBlobUrl || book.cover_url),
      authors: store.authors,
    });

    if (errors.length || !value.title || value.year === undefined || !value.author_ids) {
      return { errors } as const;
    }

    const previousCoverUrl = book.cover_url;

    Object.assign(book, {
      title: value.title,
      year: value.year,
      description: value.description || "",
      isbn: value.isbn || "",
      author_ids: value.author_ids,
    });

    if (file) {
      book.cover_url = this.covers.uploadedUrl(file);
    } else if (providedBlobUrl) {
      book.cover_url = providedBlobUrl;
    }

    this.repository.persist(this.config.dataFile);

    if (book.cover_url !== previousCoverUrl) {
      if (this.covers.isBlobUrl(previousCoverUrl)) {
        void this.covers.removeBlobByUrl(previousCoverUrl);
      } else {
        this.covers.removeByUrl(previousCoverUrl);
      }
    }

    return { book: this.serializeBook(book) } as const;
  }

  patch(id: string | undefined, body: Record<string, unknown>) {
    const book = this.repository.findBook(id);
    if (!book) return { missing: true } as const;

    const store = this.repository.snapshot();
    const { errors, value } = validateBookInput(body, {
      requireAll: false,
      hasCover: true,
      authors: store.authors,
    });

    if (errors.length) return { errors } as const;

    if (value.title !== undefined) book.title = value.title;
    if (value.year !== undefined) book.year = value.year;
    if (value.description !== undefined) book.description = value.description;
    if (value.isbn !== undefined) book.isbn = value.isbn;
    if (value.author_ids !== undefined) book.author_ids = value.author_ids;

    this.repository.persist(this.config.dataFile);
    return { book: this.serializeBook(book) } as const;
  }

  remove(id: string | undefined) {
    const book = this.repository.removeBook(id);
    if (!book) return false;

    if (this.covers.isBlobUrl(book.cover_url)) {
      void this.covers.removeBlobByUrl(book.cover_url);
    } else {
      this.covers.removeByUrl(book.cover_url);
    }

    this.repository.persist(this.config.dataFile);
    return true;
  }

  serializeBook(book: BookRecord) {
    const store = this.repository.snapshot();
    const authors = store.authors
      .filter((author) => book.author_ids.includes(author.id))
      .map((author) => ({ id: author.id, full_name: author.full_name }));

    return {
      id: book.id,
      title: book.title,
      year: book.year,
      description: book.description,
      isbn: book.isbn,
      cover_url: book.cover_url,
      authors,
    };
  }

  serializeAuthorBook(author: AuthorRecord) {
    return this.repository
      .snapshot()
      .books.filter((book) => book.author_ids.includes(author.id))
      .map((book) => ({ id: book.id, title: book.title, year: book.year }));
  }
}

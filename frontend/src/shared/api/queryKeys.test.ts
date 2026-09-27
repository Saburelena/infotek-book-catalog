import { QueryClient } from "@tanstack/vue-query";
import { describe, expect, it } from "vitest";

import { queryKeys } from "./queryKeys";

describe("queryKeys invalidation family", () => {
  it("exposes separate detail roots for book and author caches", () => {
    expect(queryKeys.bookRoot).toEqual(["book"]);
    expect(queryKeys.authorRoot).toEqual(["author"]);
  });

  it("invalidates both list and detail queries for catalog data", async () => {
    const client = new QueryClient();

    client.setQueryData(queryKeys.books({ perPage: 10 }), { ok: true });
    client.setQueryData(queryKeys.book(42), { ok: true });
    client.setQueryData(queryKeys.authors({ perPage: 10 }), { ok: true });
    client.setQueryData(queryKeys.author(7), { ok: true });
    client.setQueryData(queryKeys.report(2024), { ok: true });

    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.booksRoot }),
      client.invalidateQueries({ queryKey: queryKeys.bookRoot }),
      client.invalidateQueries({ queryKey: queryKeys.authorsRoot }),
      client.invalidateQueries({ queryKey: queryKeys.authorRoot }),
      client.invalidateQueries({ queryKey: queryKeys.reportRoot }),
    ]);

    expect(client.getQueryState(queryKeys.books({ perPage: 10 }))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.book(42))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.authors({ perPage: 10 }))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.author(7))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.report(2024))?.isInvalidated).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";

import { createHttpClient, extractEnvelopeData } from "./httpClient";

describe("extractEnvelopeData", () => {
  it("returns data from a valid API envelope", () => {
    const payload = {
      success: true,
      data: {
        id: 42,
        title: "Тестовая книга",
      },
    };

    expect(extractEnvelopeData(payload)).toEqual(payload.data);
  });

  it("throws for malformed envelope payloads", () => {
    expect(() => extractEnvelopeData({ success: true })).toThrow("Некорректный ответ сервера");
  });
});

describe("createHttpClient timeout handling", () => {
  it("converts timeout aborts into ApiError with 408 status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.reject(new DOMException("The operation was aborted", "AbortError"))),
    );

    const client = createHttpClient({
      session: {
        read: () => ({ token: "token", user: null, dropped: false }),
        write: () => undefined,
        clear: () => undefined,
      },
      timeoutMs: 10,
    });

    await expect(client.request("/books")).rejects.toMatchObject({
      status: 408,
      name: "ApiError",
      message: "Превышено время ожидания запроса",
    });

    vi.unstubAllGlobals();
  });
});

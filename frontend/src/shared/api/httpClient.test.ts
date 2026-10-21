import { describe, expect, it, vi } from "vitest";

import { createApiServices, createHttpClient, extractEnvelopeData, type HttpClient } from "./httpClient";
import { upload } from "@vercel/blob/client";

vi.mock("@vercel/blob/client", () => ({
  upload: vi.fn(),
}));

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

describe("createApiServices — books.uploadCover", () => {
  function createMockHttp(options: { token?: string | null } = {}): {
    http: HttpClient;
    requestMock: ReturnType<typeof vi.fn>;
  } {
    const requestMock = vi.fn();
    const http: HttpClient = {
      // Vitest не поддерживает generic-функции в mock, поэтому assertion.
      request: requestMock as unknown as HttpClient["request"],
      getToken: () => options.token ?? null,
    };
    return { http, requestMock };
  }

  it("throws ApiError 401 when no token", async () => {
    const { http } = createMockHttp({ token: null });
    const api = createApiServices(http);

    await expect(api.books.uploadCover(new File(["x"], "x.png"))).rejects.toMatchObject({
      status: 401,
      name: "ApiError",
    });
  });

  it("calls upload() with Authorization header and returns blob url", async () => {
    const { http } = createMockHttp({ token: "test-token" });
    const api = createApiServices(http);

    const uploadMock = vi.mocked(upload);
    uploadMock.mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/covers/test.png",
      downloadUrl: "https://store.public.blob.vercel-storage.com/covers/test.png",
      pathname: "covers/test.png",
      contentType: "image/png",
      contentDisposition: "inline",
      etag: "mock-etag",
    });

    const file = new File(["x"], "cover.png", { type: "image/png" });
    const result = await api.books.uploadCover(file);

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(result).toBe("https://store.public.blob.vercel-storage.com/covers/test.png");

    const [pathnameArg, fileArg, optsArg] = uploadMock.mock.calls[0]!;
    expect(pathnameArg).toMatch(/^covers\/\d+-cover\.png$/);
    expect(fileArg).toBe(file);
    expect(optsArg).toMatchObject({
      access: "public",
      handleUploadUrl: expect.stringContaining("/uploads/blob-token"),
      headers: { Authorization: "Bearer test-token" },
    });
  });
});

describe("createApiServices — books.save", () => {
  function createMockHttp() {
    const requestMock = vi.fn().mockResolvedValue({
      id: 1,
      title: "T",
      year: 2026,
      description: "",
      isbn: "",
      cover_url: "/uploads/x.png",
      authors: [],
    });
    const http: HttpClient = {
      // Vitest не поддерживает generic-функции в mock, поэтому assertion.
      request: requestMock as unknown as HttpClient["request"],
      getToken: () => "token",
    };
    return { http, requestMock };
  }

  it("uses PUT when cover_url is present in FormData", async () => {
    const { http, requestMock } = createMockHttp();
    const api = createApiServices(http);

    const fd = new FormData();
    fd.append("title", "T");
    fd.append("year", "2026");
    fd.append("cover_url", "https://store.public.blob.vercel-storage.com/x.png");

    await api.books.save(fd, 1);

    expect(requestMock).toHaveBeenCalledTimes(1);
    const [, opts] = requestMock.mock.calls[0]!;
    expect(opts.method).toBe("PUT");
  });

  it("uses PATCH when no cover and no cover_url", async () => {
    const { http, requestMock } = createMockHttp();
    const api = createApiServices(http);

    const fd = new FormData();
    fd.append("title", "T");
    fd.append("year", "2026");

    await api.books.save(fd, 1);

    expect(requestMock).toHaveBeenCalledTimes(1);
    const [, opts] = requestMock.mock.calls[0]!;
    expect(opts.method).toBe("PATCH");
  });
});

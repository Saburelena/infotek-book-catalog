import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import express from "express";

import { COVER_MAX_BYTES, FIELD_COVER, HTTP_STATUS, MESSAGE } from "../constants.js";
import { createErrorHandler } from "../middleware/errorHandler.js";
import { createCoverStorage } from "../storage/coverStorage.js";

function createTestServer() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "infotek-cover-storage-"));
  const uploadsDir = path.join(root, "uploads");

  const covers = createCoverStorage({ uploadsDir, blobStoreId: "" });
  const app = express();

  app.post("/upload", covers.createUploadMiddleware().single(FIELD_COVER), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "file missing" });
    }

    return res.json({
      filename: req.file.filename,
      url: covers.uploadedUrl(req.file),
    });
  });

  app.use(createErrorHandler(covers));

  const server = http.createServer(app);

  return {
    server,
    uploadsDir,
    cleanup: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function createCoverStorageWithBlob(options: { blobStoreId: string; delBlob?: (url: string) => Promise<void> }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "infotek-cover-storage-blob-"));
  const uploadsDir = path.join(root, "uploads");

  const covers = createCoverStorage({
    uploadsDir,
    blobStoreId: options.blobStoreId,
    delBlob: options.delBlob,
  });

  return {
    covers,
    uploadsDir,
    cleanup: () => {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test("accepts a valid cover upload and stores the file", async () => {
  const { server, uploadsDir, cleanup } = createTestServer();

  try {
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    assert.ok(address);
    if (typeof address === "string") {
      throw new Error("Expected server address to be an AddressInfo object");
    }

    const port = address.port;

    const form = new FormData();
    form.append(
      FIELD_COVER,
      new Blob(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], {
        type: "image/svg+xml",
      }),
      "test-cover.svg",
    );

    const response = await fetch(`http://127.0.0.1:${port}/upload`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 200);

    const result = (await response.json()) as {
      filename: string;
      url: string;
    };

    assert.match(result.filename, /^cover-\d+-\d+\.svg$/);
    assert.equal(result.url, `/uploads/${result.filename}`);

    const uploadedPath = path.join(uploadsDir, result.filename);

    assert.equal(fs.existsSync(uploadedPath), true);
    assert.equal(fs.readFileSync(uploadedPath, "utf8"), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  } finally {
    await cleanup();
  }
});

test("rejects a cover with an unsupported file type", async () => {
  const { server, uploadsDir, cleanup } = createTestServer();

  try {
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    assert.ok(address);
    if (typeof address === "string") {
      throw new Error("Expected server address to be an AddressInfo object");
    }

    const port = address.port;

    const form = new FormData();
    form.append(
      FIELD_COVER,
      new Blob(["not an image"], {
        type: "text/plain",
      }),
      "test-cover.txt",
    );

    const response = await fetch(`http://127.0.0.1:${port}/upload`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, HTTP_STATUS.unprocessable);

    const result = (await response.json()) as {
      success: boolean;
      errors: Array<{
        field: string;
        message: string;
      }>;
    };

    assert.equal(result.success, false);
    assert.deepEqual(result.errors, [
      {
        field: FIELD_COVER,
        message: MESSAGE.coverType,
      },
    ]);

    assert.deepEqual(fs.readdirSync(uploadsDir), []);
  } finally {
    await cleanup();
  }
});

test("rejects a cover larger than the configured size limit", async () => {
  const { server, uploadsDir, cleanup } = createTestServer();

  try {
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    assert.ok(address);
    if (typeof address === "string") {
      throw new Error("Expected server address to be an AddressInfo object");
    }

    const port = address.port;

    const oversizedFile = new Uint8Array(COVER_MAX_BYTES + 1);

    const form = new FormData();
    form.append(
      FIELD_COVER,
      new Blob([oversizedFile], {
        type: "image/jpeg",
      }),
      "large-cover.jpg",
    );

    const response = await fetch(`http://127.0.0.1:${port}/upload`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, HTTP_STATUS.unprocessable);

    const result = (await response.json()) as {
      success: boolean;
      errors: Array<{
        field: string;
        message: string;
      }>;
    };

    assert.equal(result.success, false);
    assert.deepEqual(result.errors, [
      {
        field: FIELD_COVER,
        message: MESSAGE.coverTooBig,
      },
    ]);

    assert.deepEqual(fs.readdirSync(uploadsDir), []);
  } finally {
    await cleanup();
  }
});

test("isBlobUrl accepts HTTPS URL with expected hostname", () => {
  const blobStoreId = "teststore";
  const { covers, cleanup } = createCoverStorageWithBlob({ blobStoreId });

  try {
    const url = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/test.jpg`;

    assert.equal(covers.isBlobUrl(url), true);
  } finally {
    cleanup();
  }
});

test("isBlobUrl rejects HTTP, foreign hostname, undefined, empty store id", () => {
  const blobStoreId = "teststore";
  const { covers, cleanup } = createCoverStorageWithBlob({ blobStoreId });

  const emptyStore = createCoverStorageWithBlob({ blobStoreId: "" });

  try {
    assert.equal(covers.isBlobUrl("http://teststore.public.blob.vercel-storage.com/x.jpg"), false);
    assert.equal(covers.isBlobUrl("https://other.public.blob.vercel-storage.com/x.jpg"), false);
    assert.equal(covers.isBlobUrl(undefined), false);
    assert.equal(covers.isBlobUrl(""), false);
    assert.equal(covers.isBlobUrl("not-a-url"), false);
    assert.equal(emptyStore.covers.isBlobUrl("https://teststore.public.blob.vercel-storage.com/x.jpg"), false);
  } finally {
    cleanup();
    emptyStore.cleanup();
  }
});

test("isLocalUploadUrl matches local upload path only", () => {
  const { covers, cleanup } = createCoverStorageWithBlob({ blobStoreId: "" });

  try {
    assert.equal(covers.isLocalUploadUrl("/uploads/cover-1.svg"), true);
    assert.equal(covers.isLocalUploadUrl("/uploads/cover-123-456.jpg"), true);
    assert.equal(covers.isLocalUploadUrl("/other/file.jpg"), false);
    assert.equal(covers.isLocalUploadUrl("https://teststore.public.blob.vercel-storage.com/x.jpg"), false);
    assert.equal(covers.isLocalUploadUrl(undefined), false);
    assert.equal(covers.isLocalUploadUrl(""), false);
  } finally {
    cleanup();
  }
});

test("removeBlobByUrl calls delBlob for valid blob URL", async () => {
  const blobStoreId = "teststore";
  const calls: string[] = [];
  const delBlob = async (url: string) => {
    calls.push(url);
  };

  const { covers, cleanup } = createCoverStorageWithBlob({
    blobStoreId,
    delBlob,
  });

  try {
    const url = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/test.jpg`;

    await covers.removeBlobByUrl(url);

    assert.deepEqual(calls, [url]);
  } finally {
    cleanup();
  }
});

test("removeBlobByUrl does not call delBlob for invalid URL", async () => {
  const calls: string[] = [];
  const delBlob = async (url: string) => {
    calls.push(url);
  };

  const { covers, cleanup } = createCoverStorageWithBlob({
    blobStoreId: "teststore",
    delBlob,
  });

  try {
    await covers.removeBlobByUrl("/uploads/cover-1.svg");
    await covers.removeBlobByUrl("https://other.public.blob.vercel-storage.com/x.jpg");
    await covers.removeBlobByUrl(undefined);

    assert.deepEqual(calls, []);
  } finally {
    cleanup();
  }
});

test("removeBlobByUrl swallows delBlob errors", async () => {
  const blobStoreId = "teststore";
  const delBlob = async () => {
    throw new Error("network error");
  };

  const { covers, cleanup } = createCoverStorageWithBlob({
    blobStoreId,
    delBlob,
  });

  try {
    const url = `https://${blobStoreId}.public.blob.vercel-storage.com/covers/test.jpg`;

    // не должно выбросить
    await covers.removeBlobByUrl(url);
  } finally {
    cleanup();
  }
});

test("ensureCovers and removeByUrl skip absolute URLs", () => {
  const { covers, uploadsDir, cleanup } = createCoverStorageWithBlob({
    blobStoreId: "teststore",
  });

  try {
    const absUrl = "https://teststore.public.blob.vercel-storage.com/covers/test.jpg";

    covers.ensureCovers([
      {
        id: 999,
        title: "Test",
        year: 2026,
        description: "",
        isbn: "",
        cover_url: absUrl,
        author_ids: [],
      },
    ]);

    assert.equal(fs.existsSync(path.join(uploadsDir, "test.jpg")), false);
    assert.deepEqual(fs.readdirSync(uploadsDir), []);

    // removeByUrl для абсолютного URL — не должен пытаться удалить локальный файл
    covers.removeByUrl(absUrl);

    assert.deepEqual(fs.readdirSync(uploadsDir), []);
  } finally {
    cleanup();
  }
});

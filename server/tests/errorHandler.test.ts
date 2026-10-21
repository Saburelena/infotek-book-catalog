import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import express from "express";
import multer from "multer";

import { createErrorHandler } from "../middleware/errorHandler.js";
import type { CoverStorage } from "../storage/coverStorage.js";
import { MESSAGE } from "../constants.js";

function createMockCovers(): CoverStorage {
  return {
    removeByUrl: () => {},
    uploadedUrl: (file: Express.Multer.File) => `/uploads/${file.filename}`,
  } as unknown as CoverStorage;
}

async function startServer(): Promise<{ port: number; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json());

  const covers = createMockCovers();
  const errorHandler = createErrorHandler(covers);

  app.get("/multer-limit", () => {
    throw new multer.MulterError("LIMIT_FILE_SIZE", "cover");
  });

  app.get("/multer-other", () => {
    throw new multer.MulterError("LIMIT_UNEXPECTED_FILE", "cover");
  });

  app.get("/json-parse", () => {
    const error = new SyntaxError("Unexpected token") as SyntaxError & { type?: string };
    error.type = "entity.parse.failed";
    throw error;
  });

  app.get("/cover-type", () => {
    throw new Error(MESSAGE.coverType);
  });

  app.get("/generic", () => {
    throw new Error("Что-то сломалось");
  });

  app.use(errorHandler);

  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  assert.ok(address);
  if (typeof address === "string") {
    throw new Error("Expected server address to be an AddressInfo object");
  }

  return {
    port: address.port,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}

function bodyAsErrors(body: unknown): Array<{ field: string; message: string }> {
  assert.ok(typeof body === "object" && body !== null);
  const record = body as { errors?: unknown };
  assert.ok(Array.isArray(record.errors));
  return record.errors as Array<{ field: string; message: string }>;
}

test("MulterError LIMIT_FILE_SIZE returns 422 with coverTooBig", async () => {
  const { port, close } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/multer-limit`);
    assert.equal(response.status, 422);
    const body = await response.json();
    const errors = bodyAsErrors(body);
    assert.equal(errors[0]?.field, "cover");
    assert.equal(errors[0]?.message, MESSAGE.coverTooBig);
  } finally {
    await close();
  }
});

test("MulterError other code returns 422 with generic cover message", async () => {
  const { port, close } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/multer-other`);
    assert.equal(response.status, 422);
    const body = await response.json();
    const errors = bodyAsErrors(body);
    assert.equal(errors[0]?.field, "cover");
    assert.equal(errors[0]?.message, "Не удалось загрузить файл");
  } finally {
    await close();
  }
});

test("JSON parse error returns 400 with body field", async () => {
  const { port, close } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json-parse`);
    assert.equal(response.status, 400);
    const body = await response.json();
    const errors = bodyAsErrors(body);
    assert.equal(errors[0]?.field, "body");
    assert.equal(errors[0]?.message, "Неверный JSON в запросе");
  } finally {
    await close();
  }
});

test("Error with coverType message returns 422 with cover field", async () => {
  const { port, close } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/cover-type`);
    assert.equal(response.status, 422);
    const body = await response.json();
    const errors = bodyAsErrors(body);
    assert.equal(errors[0]?.field, "cover");
    assert.equal(errors[0]?.message, MESSAGE.coverType);
  } finally {
    await close();
  }
});

test("generic Error returns 500 with base field", async () => {
  const { port, close } = await startServer();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/generic`);
    assert.equal(response.status, 500);
    const body = await response.json();
    const errors = bodyAsErrors(body);
    assert.equal(errors[0]?.field, "base");
    assert.equal(errors[0]?.message, "Что-то сломалось");
  } finally {
    await close();
  }
});

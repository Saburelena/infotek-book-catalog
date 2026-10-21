import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import type { handleUpload } from "@vercel/blob/client";
import express from "express";

import type { AuthService } from "../services/auth.service.js";
import { createUploadRoutes } from "../routes/upload.routes.js";

function createMockAuth(): AuthService {
  return {
    verify: (token: string) => {
      if (token === "valid-token") {
        return { id: 1, username: "test", role: "user" };
      }
      return null;
    },
  } as unknown as AuthService;
}

async function startServer(
  handleUploadMock: typeof handleUpload,
): Promise<{ port: number; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json());
  app.use(createUploadRoutes(createMockAuth(), handleUploadMock));

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

test("POST /blob-token without JWT returns 401 and does not call handleUpload", async () => {
  let handleUploadCalls = 0;
  const handleUploadMock = (async () => {
    handleUploadCalls += 1;
    return {
      type: "blob.generate-client-token" as const,
      clientToken: "mock-token",
    };
  }) as unknown as typeof handleUpload;

  const { port, close } = await startServer(handleUploadMock);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/blob-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 401);
    assert.equal(handleUploadCalls, 0);
  } finally {
    await close();
  }
});

test("POST /blob-token with valid JWT returns 200 and mock clientToken", async () => {
  let handleUploadCalls = 0;
  const handleUploadMock = (async () => {
    handleUploadCalls += 1;
    return {
      type: "blob.generate-client-token" as const,
      clientToken: "mock-token",
    };
  }) as unknown as typeof handleUpload;

  const { port, close } = await startServer(handleUploadMock);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/blob-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 200);
    assert.equal(handleUploadCalls, 1);

    const body = (await response.json()) as {
      type: string;
      clientToken: string;
    };

    assert.equal(body.type, "blob.generate-client-token");
    assert.equal(body.clientToken, "mock-token");
  } finally {
    await close();
  }
});

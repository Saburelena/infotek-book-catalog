import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import express from "express";

import type { AuthService } from "../services/auth.service.js";
import { createAuthRequired } from "../middleware/auth.js";

function createMockAuth(): AuthService {
  return {
    verify: (token: string) => {
      if (token === "valid-token") {
        return { id: 1, username: "test", role: "user" };
      }
      if (token === "valid-wrong-role") {
        return { id: 2, username: "admin", role: "admin" };
      }
      return null;
    },
  } as unknown as AuthService;
}

async function startServer(): Promise<{ port: number; close: () => Promise<void> }> {
  const app = express();
  const authRequired = createAuthRequired(createMockAuth());

  app.get("/protected", authRequired, (req, res) => {
    res.json({ success: true, user: req.user });
  });

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

test("GET /protected without Authorization returns 401", async () => {
  const { port, close } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/protected`);
    assert.equal(response.status, 401);
    const body = (await response.json()) as { success?: boolean; errors?: unknown[] };
    assert.equal(body.success, false);
    assert.ok(Array.isArray(body.errors));
  } finally {
    await close();
  }
});

test("GET /protected with invalid token returns 401", async () => {
  const { port, close } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/protected`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    assert.equal(response.status, 401);
    const body = (await response.json()) as { success?: boolean };
    assert.equal(body.success, false);
  } finally {
    await close();
  }
});

test("GET /protected with wrong role returns 403", async () => {
  const { port, close } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/protected`, {
      headers: { Authorization: "Bearer valid-wrong-role" },
    });
    assert.equal(response.status, 403);
    const body = (await response.json()) as { success?: boolean };
    assert.equal(body.success, false);
  } finally {
    await close();
  }
});

test("GET /protected with valid token returns 200 and user", async () => {
  const { port, close } = await startServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/protected`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      success?: boolean;
      user?: { id: number; username: string; role: string };
    };
    assert.equal(body.success, true);
    assert.ok(body.user);
    assert.equal(body.user?.id, 1);
    assert.equal(body.user?.username, "test");
    assert.equal(body.user?.role, "user");
  } finally {
    await close();
  }
});

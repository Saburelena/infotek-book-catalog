import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createServerConfig } from "../config/env.js";
import { SubscriptionService } from "../services/subscription.service.js";
import { StoreRepository } from "../storage/storeRepository.js";

function createSubscriptionService() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "infotek-subscription-service-"));
  const dataFile = path.join(root, "data", "store.json");
  const config = { ...createServerConfig(), dataFile };
  const repository = new StoreRepository({
    dataFile,
    onLoad: () => undefined,
  });
  const service = new SubscriptionService(repository, config);

  return {
    service,
    repository,
    dataFile,
    cleanup: async () => {
      await Promise.resolve();
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

test("creates a subscription and persists it to the store", async () => {
  const { service, repository, dataFile, cleanup } = createSubscriptionService();

  try {
    const authorId = 3;
    const phone = "79009998877";

    const initialSubscriptions = repository.snapshot().subscriptions.length;
    const initialNextSubscriptionId = repository.snapshot().next.sub;

    const result = service.subscribe(String(authorId), phone);

    assert.ok("result" in result);
    assert.ok(result.result);

    const subscriptionResult = result.result;

    assert.equal(subscriptionResult.author_id, authorId);
    assert.equal(subscriptionResult.phone, phone);
    assert.match(subscriptionResult.message, /Вы подписались на новые книги автора/);

    assert.equal(repository.snapshot().subscriptions.length, initialSubscriptions + 1);

    const subscription = repository
      .snapshot()
      .subscriptions.find((item) => item.author_id === authorId && item.phone === phone);

    assert.ok(subscription);
    assert.equal(subscription.id, initialNextSubscriptionId);
    assert.equal(subscription.author_id, authorId);
    assert.equal(subscription.phone, phone);

    assert.equal(repository.snapshot().next.sub, initialNextSubscriptionId + 1);

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      subscriptions: Array<{
        id: number;
        author_id: number;
        phone: string;
      }>;
      next: {
        sub: number;
      };
    };

    const persistedSubscription = persistedStore.subscriptions.find(
      (item) => item.author_id === authorId && item.phone === phone,
    );

    assert.ok(persistedSubscription);
    assert.equal(persistedSubscription.id, initialNextSubscriptionId);
    assert.equal(persistedSubscription.author_id, authorId);
    assert.equal(persistedSubscription.phone, phone);

    assert.equal(persistedStore.next.sub, initialNextSubscriptionId + 1);
  } finally {
    await cleanup();
  }
});

test("does not create a duplicate subscription", async () => {
  const { service, repository, dataFile, cleanup } = createSubscriptionService();

  try {
    const authorId = 3;
    const phone = "79001112233";

    const initialSubscriptions = repository.snapshot().subscriptions.length;
    const initialNextSubscriptionId = repository.snapshot().next.sub;

    const result = service.subscribe(String(authorId), phone);

    assert.ok("result" in result);
    assert.ok(result.result);

    assert.equal(repository.snapshot().subscriptions.length, initialSubscriptions);

    assert.equal(repository.snapshot().next.sub, initialNextSubscriptionId);

    const matchingSubscriptions = repository
      .snapshot()
      .subscriptions.filter((item) => item.author_id === authorId && item.phone === phone);

    assert.equal(matchingSubscriptions.length, 1);

    await Promise.resolve();

    const persistedStore = JSON.parse(fs.readFileSync(dataFile, "utf8")) as {
      subscriptions: Array<{
        id: number;
        author_id: number;
        phone: string;
      }>;
      next: {
        sub: number;
      };
    };

    const persistedMatchingSubscriptions = persistedStore.subscriptions.filter(
      (item) => item.author_id === authorId && item.phone === phone,
    );

    assert.equal(persistedMatchingSubscriptions.length, 1);
    assert.equal(persistedStore.next.sub, initialNextSubscriptionId);
  } finally {
    await cleanup();
  }
});

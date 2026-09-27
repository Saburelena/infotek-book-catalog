import { Router } from "express";

import { createAuthorController } from "../controllers/author.controller.js";
import type { AuthorService } from "../services/author.service.js";
import type { AuthService } from "../services/auth.service.js";
import { createAuthRequired } from "../middleware/auth.js";
import type { SubscriptionService } from "../services/subscription.service.js";

export function createAuthorRoutes(
  authors: AuthorService,
  subscriptions: SubscriptionService,
  auth: AuthService,
) {
  const router = Router();
  const controller = createAuthorController(authors, subscriptions);
  const authRequired = createAuthRequired(auth);

  router.get("/", controller.list);
  router.post("/", authRequired, controller.create);
  router.get("/:id", controller.get);
  router.put("/:id", authRequired, controller.update);
  router.delete("/:id", authRequired, controller.remove);
  router.post("/:id/subscribe", controller.subscribe);

  return router;
}

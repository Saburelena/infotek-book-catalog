import { Router } from "express";

import { FIELD_COVER } from "../constants.js";
import { createBookController } from "../controllers/book.controller.js";
import type { BookService } from "../services/book.service.js";
import type { CoverStorage } from "../storage/coverStorage.js";
import { createAuthRequired } from "../middleware/auth.js";
import type { AuthService } from "../services/auth.service.js";

export function createBookRoutes(
  books: BookService,
  covers: CoverStorage,
  auth: AuthService,
) {
  const router = Router();
  const controller = createBookController(books, covers);
  const authRequired = createAuthRequired(auth);
  const upload = covers.createUploadMiddleware();

  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", authRequired, upload.single(FIELD_COVER), controller.create);
  router.put(
    "/:id",
    authRequired,
    upload.single(FIELD_COVER),
    controller.update,
  );
  router.patch("/:id", authRequired, controller.patch);
  router.delete("/:id", authRequired, controller.remove);

  return router;
}

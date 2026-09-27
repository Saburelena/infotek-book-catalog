import { Router } from "express";

import type { AuthService } from "../services/auth.service.js";
import { createAuthController } from "../controllers/auth.controller.js";

export function createAuthRoutes(auth: AuthService) {
  const router = Router();
  const controller = createAuthController(auth);

  router.post("/login", controller.login);
  return router;
}

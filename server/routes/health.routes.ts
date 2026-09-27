import { Router } from "express";

import { health } from "../controllers/health.controller.js";

export function createHealthRoutes() {
  const router = Router();
  router.get("/", health);
  return router;
}

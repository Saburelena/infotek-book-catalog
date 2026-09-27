import { Router } from "express";

import type { ReportService } from "../services/report.service.js";
import { createReportController } from "../controllers/report.controller.js";

export function createReportRoutes(report: ReportService) {
  const router = Router();
  const controller = createReportController(report);

  router.get("/top-authors", controller.topAuthors);
  return router;
}

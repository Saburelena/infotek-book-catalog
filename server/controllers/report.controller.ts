import type { Request, Response } from "express";

import { HTTP_STATUS } from "../constants.js";
import type { ReportService } from "../services/report.service.js";
import { fail, ok } from "../utils/response.js";

export function createReportController(report: ReportService) {
  return {
    topAuthors(req: Request, res: Response) {
      const result = report.topAuthors(req.query.year);

      if ("invalidYear" in result) {
        return fail(res, HTTP_STATUS.badRequest, [
          { field: "year", message: "Параметр year не указан или неверен" },
        ]);
      }

      return res.json(ok(result.result));
    },
  };
}

import type { Request, Response } from "express";

import { ok } from "../utils/response.js";

export function health(_req: Request, res: Response) {
  return res.json(
    ok({
      status: "ok",
      service: "infotek-book-catalog-api",
      timestamp: new Date().toISOString(),
    }),
  );
}

import type { Request, Response } from "express";

import { HTTP_STATUS } from "../constants.js";
import type { AuthService } from "../services/auth.service.js";
import { fail, ok } from "../utils/response.js";

export function createAuthController(auth: AuthService) {
  return {
    login(req: Request, res: Response) {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const result = auth.login(username, password);

      if (!result) {
        return fail(res, HTTP_STATUS.unauthorized, [{ field: "password", message: "Неверные учётные данные" }]);
      }

      return res.json(ok(result));
    },
  };
}

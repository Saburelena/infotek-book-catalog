import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS, ROLE_USER } from "../constants.js";
import type { RequestUser } from "../domain/types.js";
import { fail } from "../utils/response.js";
import type { AuthService } from "../services/auth.service.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: RequestUser;
  }
}

export function createAuthRequired(auth: AuthService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return fail(res, HTTP_STATUS.unauthorized, ["Необходима авторизация"]);
    }

    const user = auth.verify(token);
    if (!user) {
      return fail(res, HTTP_STATUS.unauthorized, ["Необходима авторизация"]);
    }

    if (user.role !== ROLE_USER) {
      return fail(res, HTTP_STATUS.forbidden, ["Недостаточно прав"]);
    }

    req.user = user;
    next();
  };
}

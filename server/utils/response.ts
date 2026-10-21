import type { Response } from "express";

import { HTTP_STATUS } from "../constants.js";
import type { FieldError } from "../domain/types.js";

export function ok<T>(data: T) {
  return { success: true, data };
}

export function fail(res: Response, status: number, errors: Array<string | FieldError>) {
  return res.status(status).json({
    success: false,
    errors: errors.map((item) => (typeof item === "string" ? { field: "base", message: item } : item)),
  });
}

export function created<T>(res: Response, data: T) {
  return res.status(HTTP_STATUS.created).json(ok(data));
}

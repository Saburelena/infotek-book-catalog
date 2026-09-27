import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { FIELD_COVER, HTTP_STATUS, MESSAGE } from "../constants.js";
import { fail } from "../utils/response.js";
import type { CoverStorage } from "../storage/coverStorage.js";

function isJsonParseError(error: unknown) {
  return (
    error instanceof SyntaxError &&
    "type" in error &&
    typeof error.type === "string" &&
    error.type === "entity.parse.failed"
  );
}

export function createRejectUpload(covers: CoverStorage) {
  return (
    req: Request,
    res: Response,
    errors: Array<{ field: string; message: string }>,
  ) => {
    if (req.file) covers.removeByUrl(covers.uploadedUrl(req.file));
    return fail(res, HTTP_STATUS.unprocessable, errors);
  };
}

export function createErrorHandler(covers: CoverStorage) {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return fail(res, HTTP_STATUS.unprocessable, [
          { field: FIELD_COVER, message: MESSAGE.coverTooBig },
        ]);
      }

      return fail(res, HTTP_STATUS.unprocessable, [
        { field: FIELD_COVER, message: "Не удалось загрузить файл" },
      ]);
    }

    if (isJsonParseError(err)) {
      return fail(res, HTTP_STATUS.badRequest, [
        { field: "body", message: "Неверный JSON в запросе" },
      ]);
    }

    if (
      err instanceof Error &&
      ((err as { field?: string }).field === FIELD_COVER ||
        err.message === MESSAGE.coverType)
    ) {
      return fail(res, HTTP_STATUS.unprocessable, [
        { field: FIELD_COVER, message: err.message },
      ]);
    }

    if (req.file && err instanceof Error) {
      covers.removeByUrl(covers.uploadedUrl(req.file));
    }

    if (err instanceof Error) {
      return fail(res, HTTP_STATUS.internalServerError, [
        { field: "base", message: err.message || "Внутренняя ошибка сервера" },
      ]);
    }

    return next(err);
  };
}

import type { NextFunction, Request, Response } from "express";

import { HTTP_STATUS } from "../constants.js";
import type { BookService } from "../services/book.service.js";
import type { CoverStorage } from "../storage/coverStorage.js";
import { fail, created, take, ok } from "../utils/response.js";

export function createBookController(books: BookService, covers: CoverStorage) {
  return {
    list(req: Request, res: Response) {
      const { search, year, author_id, page, "per-page": perPage } = req.query;
      return res.json(
        ok(
          books.list({
            search,
            year,
            author_id,
            page,
            perPage,
          }),
        ),
      );
    },

    get(req: Request, res: Response) {
      const book = books.get(req.params.id);
      if (!book) return fail(res, HTTP_STATUS.notFound, ["Книга не найдена"]);
      return res.json(ok(book));
    },

    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await books.create(
          req.body as Record<string, unknown>,
          req.file,
        );

        if ("errors" in result) {
          if (req.file) covers.removeByUrl(covers.uploadedUrl(req.file));
          return fail(res, HTTP_STATUS.unprocessable, result.errors);
        }

        return created(res, result.book);
      } catch (error) {
        next(error);
      }
    },

    update(req: Request, res: Response) {
      const result = books.update(
        req.params.id,
        req.body as Record<string, unknown>,
        req.file,
      );

      if ("missing" in result) {
        if (req.file) covers.removeByUrl(covers.uploadedUrl(req.file));
        return fail(res, HTTP_STATUS.notFound, ["Книга не найдена"]);
      }

      if ("errors" in result) {
        if (req.file) covers.removeByUrl(covers.uploadedUrl(req.file));
        return fail(res, HTTP_STATUS.unprocessable, result.errors);
      }

      return res.json(ok(result.book));
    },

    patch(req: Request, res: Response) {
      const result = books.patch(
        req.params.id,
        req.body as Record<string, unknown>,
      );

      if ("missing" in result) {
        return fail(res, HTTP_STATUS.notFound, ["Книга не найдена"]);
      }

      if ("errors" in result) {
        return fail(res, HTTP_STATUS.unprocessable, result.errors);
      }

      return res.json(ok(result.book));
    },

    remove(req: Request, res: Response) {
      const removed = books.remove(req.params.id);
      if (!removed) {
        return fail(res, HTTP_STATUS.notFound, ["Книга не найдена"]);
      }

      return res.status(HTTP_STATUS.noContent).end();
    },
  };
}

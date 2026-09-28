import type { Request, Response } from "express";

import { HTTP_STATUS, MESSAGE } from "../constants.js";
import type { AuthorService } from "../services/author.service.js";
import type { SubscriptionService } from "../services/subscription.service.js";
import { created, fail, ok } from "../utils/response.js";

export function createAuthorController(
authors: AuthorService,
subscriptions: SubscriptionService,
) {
return {
list(req: Request, res: Response) {
const { search, page, "per-page": perPage } = req.query;
return res.json(ok(authors.list({ search, page, perPage })));
},

create(req: Request, res: Response) {
  const result = authors.create(req.body?.full_name);

  if ("error" in result && result.error) {
    return fail(res, HTTP_STATUS.unprocessable, [result.error]);
  }

  return created(res, result.author);
},

get(req: Request, res: Response) {
  const author = authors.get(req.params.id);

  if (!author) {
    return fail(res, HTTP_STATUS.notFound, ["Автор не найден"]);
  }

  return res.json(ok(author));
},

update(req: Request, res: Response) {
  const result = authors.update(req.params.id, req.body?.full_name);

  if ("missing" in result) {
    return fail(res, HTTP_STATUS.notFound, ["Автор не найден"]);
  }

  if ("error" in result && result.error) {
    return fail(res, HTTP_STATUS.unprocessable, [result.error]);
  }

  return res.json(ok(result.author));
},

remove(req: Request, res: Response) {
  const removed = authors.remove(req.params.id);

  if (!removed) {
    return fail(res, HTTP_STATUS.notFound, ["Автор не найден"]);
  }

  return res.status(HTTP_STATUS.noContent).end();
},

subscribe(req: Request, res: Response) {
  const result = subscriptions.subscribe(req.params.id, req.body?.phone);

  if ("missing" in result) {
    return fail(res, HTTP_STATUS.notFound, ["Автор не найден"]);
  }

  if ("invalidPhone" in result) {
    return fail(res, HTTP_STATUS.unprocessable, [
      { field: "phone", message: MESSAGE.phone },
    ]);
  }

  return created(res, result.result);
},

};
}
import { Router } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { COVER_MAX_BYTES, COVER_MIME, HTTP_STATUS } from "../constants.js";
import { createAuthRequired } from "../middleware/auth.js";
import type { AuthService } from "../services/auth.service.js";
import { fail } from "../utils/response.js";

export function createUploadRoutes(auth: AuthService, handleUploadFn?: typeof handleUpload) {
  const uploadFn = handleUploadFn ?? handleUpload;
  const router = Router();
  const authRequired = createAuthRequired(auth);

  router.post("/blob-token", authRequired, (req, res) => {
    void (async () => {
      const body = req.body as HandleUploadBody;
      try {
        const jsonResponse = await uploadFn({
          body,
          request: req,
          onBeforeGenerateToken: () =>
            Promise.resolve({
              allowedContentTypes: [...COVER_MIME],
              maximumSizeInBytes: COVER_MAX_BYTES,
            }),
        });
        res.json(jsonResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ошибка выдачи токена";
        fail(res, HTTP_STATUS.badRequest, [message]);
      }
    })();
  });

  return router;
}

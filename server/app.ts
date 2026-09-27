import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fs from "node:fs";
import path from "node:path";

import { HTTP_STATUS } from "./constants.js";
import type { AppContainer } from "./container.js";
import { createErrorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { createAuthorRoutes } from "./routes/author.routes.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createBookRoutes } from "./routes/book.routes.js";
import { createHealthRoutes } from "./routes/health.routes.js";
import { createReportRoutes } from "./routes/report.routes.js";
import { fail } from "./utils/response.js";

export function createApp(container: AppContainer) {
  const app = express();

  app.use(requestLogger);
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use("/uploads", express.static(container.config.uploadsDir));

  app.use(`${container.config.apiPrefix}/health`, createHealthRoutes());
  app.use(
    `${container.config.apiPrefix}/auth`,
    createAuthRoutes(container.auth),
  );
  app.use(
    `${container.config.apiPrefix}/books`,
    createBookRoutes(container.books, container.covers, container.auth),
  );
  app.use(
    `${container.config.apiPrefix}/authors`,
    createAuthorRoutes(
      container.authors,
      container.subscriptions,
      container.auth,
    ),
  );
  app.use(
    `${container.config.apiPrefix}/reports`,
    createReportRoutes(container.reports),
  );

  if (
    container.config.isProduction &&
    fs.existsSync(container.config.publicDir)
  ) {
    app.use(express.static(container.config.publicDir));

    app.get("*", (req, res, next) => {
      if (req.path.startsWith(container.config.apiPrefix)) return next();
      if (!req.accepts("html")) return next();

      return res.sendFile(path.join(container.config.publicDir, "index.html"));
    });
  }

  app.use((req, res) =>
    fail(
      res,
      HTTP_STATUS.notFound,
      req.path.startsWith(container.config.apiPrefix)
        ? ["Маршрут не найден"]
        : ["Страница не найдена"],
    ),
  );

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) =>
    createErrorHandler(container.covers)(err, req, res, next),
  );

  return app;
}

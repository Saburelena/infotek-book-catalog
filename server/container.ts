import { createServerConfig, type ServerConfig } from "./config/env.js";
import { AuthService } from "./services/auth.service.js";
import { AuthorService } from "./services/author.service.js";
import { BookService } from "./services/book.service.js";
import { NotificationService } from "./services/notification.service.js";
import { ReportService } from "./services/report.service.js";
import { SubscriptionService } from "./services/subscription.service.js";
import {
  createCoverStorage,
  type CoverStorage,
} from "./storage/coverStorage.js";
import { StoreRepository } from "./storage/storeRepository.js";

export type AppContainer = {
  config: ServerConfig;
  repository: StoreRepository;
  covers: CoverStorage;
  auth: AuthService;
  authors: AuthorService;
  books: BookService;
  notifications: NotificationService;
  subscriptions: SubscriptionService;
  reports: ReportService;
};

export function createContainer(): AppContainer {
  const config = createServerConfig();
  const covers = createCoverStorage({ uploadsDir: config.uploadsDir });
  const repository = new StoreRepository({
    dataFile: config.dataFile,
    onLoad: covers.ensureCovers,
  });

  const auth = new AuthService(repository, config);
  const notifications = new NotificationService(repository, config);
  const authors = new AuthorService(repository, config);
  const subscriptions = new SubscriptionService(repository, config);
  const reports = new ReportService(repository);
  const books = new BookService(repository, covers, notifications, config);

  return {
    config,
    repository,
    covers,
    auth,
    authors,
    books,
    notifications,
    subscriptions,
    reports,
  };
}

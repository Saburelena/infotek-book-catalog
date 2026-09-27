import type { ServerConfig } from "../config/env.js";
import type { StoreRepository } from "../storage/storeRepository.js";
import { isValidPhone, normalizePhone } from "../utils/validation.js";

export class SubscriptionService {
  constructor(
    private readonly repository: StoreRepository,
    private readonly config: ServerConfig,
  ) {}

  subscribe(authorId: string | undefined, rawPhone: unknown) {
    const author = this.repository.findAuthor(authorId);
    if (!author) return { missing: true } as const;

    const phone = normalizePhone(rawPhone);
    if (!isValidPhone(phone)) return { invalidPhone: true } as const;

    const store = this.repository.snapshot();
    const exists = store.subscriptions.some(
      (item) => item.author_id === author.id && item.phone === phone,
    );

    if (!exists) {
      store.subscriptions.push({
        id: this.repository.nextSubscriptionId(),
        author_id: author.id,
        phone,
      });
      this.repository.persist(this.config.dataFile);
    }

    return {
      result: {
        author_id: author.id,
        phone,
        message: `Вы подписались на новые книги автора «${author.full_name}». SMS придёт через SMSPilot (эмулятор).`,
      },
    } as const;
  }
}

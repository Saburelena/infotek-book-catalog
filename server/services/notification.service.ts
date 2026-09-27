import type { BookRecord } from "../domain/types.js";
import type { ServerConfig } from "../config/env.js";
import type { StoreRepository } from "../storage/storeRepository.js";

export class NotificationService {
  constructor(
    private readonly repository: StoreRepository,
    private readonly config: ServerConfig,
  ) {}

  async notifySubscribers(book: BookRecord) {
    const store = this.repository.snapshot();
    const phones = new Set<string>();

    for (const subscription of store.subscriptions) {
      if (book.author_ids.includes(subscription.author_id)) {
        phones.add(subscription.phone);
      }
    }

    const authorNames = store.authors
      .filter((author) => book.author_ids.includes(author.id))
      .map((author) => author.full_name)
      .join(", ");

    const text = `Новая книга «${book.title}» (${book.year}), авторы: ${authorNames}`;

    for (const phone of phones) {
      try {
        await this.sendSms(phone, text);
      } catch (error) {
        store.smsLog.push({
          at: new Date().toISOString(),
          phone,
          text,
          ok: false,
          response: { error: String(error) },
        });
        this.repository.persist(this.config.dataFile);
      }
    }
  }

  private async sendSms(phone: string, text: string) {
    if (!this.config.smsApiKey) {
      return {
        ok: false,
        skipped: true,
        reason: "SMS_API_KEY is not configured",
      } as const;
    }

    const url = new URL("https://smspilot.ru/api.php");
    url.searchParams.set("send", text);
    url.searchParams.set("to", phone);
    url.searchParams.set("apikey", this.config.smsApiKey);
    url.searchParams.set("format", "json");

    const response = await fetch(url);
    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    this.repository.snapshot().smsLog.push({
      at: new Date().toISOString(),
      phone,
      text,
      ok: Boolean(payload.send || payload.success || !payload.error),
      response: payload,
    });
    this.repository.persist(this.config.dataFile);

    return payload;
  }
}

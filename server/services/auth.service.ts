import jwt from "jsonwebtoken";

import type { DemoUser, RequestUser } from "../domain/types.js";
import type { StoreRepository } from "../storage/storeRepository.js";
import type { ServerConfig } from "../config/env.js";

export type LoginResult = {
  token: string;
  expires_at: string;
  user: RequestUser;
};

export class AuthService {
  constructor(
    private readonly repository: StoreRepository,
    private readonly config: ServerConfig,
  ) {}

  login(username: string, password: string): LoginResult | null {
    const user = this.repository
      .snapshot()
      .users.find(
        (item: DemoUser) =>
          item.username === username && item.password === password,
      );

    if (!user) return null;

    const expiresAt = new Date(Date.now() + this.config.jwtTtlMs).toISOString();

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn },
    );

    return {
      token,
      expires_at: expiresAt,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  verify(token: string): RequestUser | null {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        algorithms: ["HS256"],
      }) as RequestUser;
    } catch {
      return null;
    }
  }
}

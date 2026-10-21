import jwt from "jsonwebtoken";
import { ROLE_USER } from "../constants.js";

import type { DemoUser, RequestUser } from "../domain/types.js";
import type { StoreRepository } from "../storage/storeRepository.js";
import type { ServerConfig } from "../config/env.js";

type LoginResult = {
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
      .users.find((item: DemoUser) => item.username === username && item.password === password);

    if (!user) return null;

    const expiresAt = new Date(Date.now() + this.config.jwtTtlMs).toISOString();

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
    });

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
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ["HS256"],
      });
      if (typeof decoded === "string") return null;
      if (typeof decoded.id !== "number" || typeof decoded.username !== "string" || decoded.role !== ROLE_USER) {
        return null;
      }
      return {
        id: decoded.id,
        username: decoded.username,
        role: ROLE_USER,
      };
    } catch {
      return null;
    }
  }
}

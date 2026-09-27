import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  API_PREFIX,
  DEFAULT_PORT,
  JWT_EXPIRES_IN,
  JWT_TTL_MS,
} from "../constants.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const isCompiled = path.basename(path.dirname(moduleDir)) === "dist";
const serverRoot = isCompiled
  ? path.resolve(moduleDir, "..", "..")
  : path.resolve(moduleDir, "..");

export type ServerConfig = {
  port: number;
  apiPrefix: string;
  jwtSecret: string;
  jwtExpiresIn: typeof JWT_EXPIRES_IN;
  jwtTtlMs: number;
  smsApiKey: string;
  dataFile: string;
  uploadsDir: string;
  publicDir: string;
  isProduction: boolean;
};

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  return "infotek-book-catalog-dev-secret";
}

export function createServerConfig(): ServerConfig {
  return {
    port: Number(process.env.PORT || DEFAULT_PORT),
    apiPrefix: API_PREFIX,
    jwtSecret: getJwtSecret(),
    jwtExpiresIn: JWT_EXPIRES_IN,
    jwtTtlMs: JWT_TTL_MS,
    smsApiKey: process.env.SMSPILOT_API_KEY || "",
    dataFile: path.join(serverRoot, "data", "store.json"),
    uploadsDir: path.join(serverRoot, "uploads"),
    publicDir: path.join(serverRoot, "public"),
    isProduction: process.env.NODE_ENV === "production",
  };
}

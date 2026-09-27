import fs from "node:fs";
import path from "node:path";
import multer from "multer";

import {
  COVER_EXT as COVER_EXT_LIST,
  COVER_FALLBACK_EXT,
  COVER_MAX_BYTES,
  COVER_MIME as COVER_MIME_LIST,
  FIELD_COVER,
  MESSAGE,
} from "../constants.js";
import type { BookRecord } from "../domain/types.js";

type CoverStorageConfig = {
  uploadsDir: string;
};

const MATERIALS = [
  { leather: "#4a1c16", dark: "#24100c", gold: "#edd9a0", cloth: "#6b2a22" },
  { leather: "#5c1018", dark: "#2a080c", gold: "#f0dca8", cloth: "#8a1e32" },
  { leather: "#2c2014", dark: "#14100a", gold: "#e6d08a", cloth: "#3d3224" },
  { leather: "#5a3214", dark: "#2c180a", gold: "#f3e0b0", cloth: "#7a4a1c" },
  { leather: "#3a1614", dark: "#1a0c0a", gold: "#e8d4a0", cloth: "#5c2420" },
  { leather: "#1f1610", dark: "#0e0a08", gold: "#ead9b4", cloth: "#2c241c" },
] as const;

function wrapTitle(title: string, size: number) {
  const words = String(title).split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > size && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 5);
}

function escapeXml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgCover(id: number, title: string) {
  const palette = MATERIALS[(id - 1) % MATERIALS.length] ?? MATERIALS[0];
  const lines = wrapTitle(title, 15);
  const startY = 210 - (lines.length - 1) * 14;
  const text = lines
    .map(
      (line, i) =>
        `<text x="150" y="${startY + i * 28}" text-anchor="middle" fill="${palette.gold}" font-family="Times New Roman, serif" font-size="21">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.cloth}"/>
      <stop offset="0.5" stop-color="${palette.leather}"/>
      <stop offset="1" stop-color="${palette.dark}"/>
    </linearGradient>
    <linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.dark}"/>
      <stop offset="1" stop-color="${palette.leather}" stop-opacity="0"/>
    </linearGradient>
    <filter id="n${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/>
      <feColorMatrix type="luminanceToAlpha"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.14"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
  </defs>
  <rect width="300" height="420" fill="url(#g${id})"/>
  <rect width="300" height="420" fill="${palette.leather}" filter="url(#n${id})" opacity="0.5"/>
  <rect width="20" height="420" fill="url(#s${id})"/>
  <rect x="38" y="38" width="224" height="344" rx="14" fill="none" stroke="${palette.gold}" stroke-width="1.6" stroke-opacity="0.92"/>
  <rect x="48" y="48" width="204" height="324" rx="10" fill="none" stroke="${palette.gold}" stroke-width="1" stroke-opacity="0.5"/>
  <text x="150" y="88" text-anchor="middle" fill="${palette.gold}" fill-opacity="0.75" font-family="Times New Roman, serif" font-size="10" letter-spacing="5">BIBLIOTHECA</text>
  <path d="M78 106h144" stroke="${palette.gold}" stroke-opacity="0.4"/>
  ${text}
  <path d="M78 314h144" stroke="${palette.gold}" stroke-opacity="0.4"/>
  <text x="150" y="348" text-anchor="middle" fill="${palette.gold}" fill-opacity="0.75" font-family="Times New Roman, serif" font-size="11" letter-spacing="3">INFOTEK</text>
</svg>`;
}

function coverExt(name: string) {
  const ext = path.extname(name || "").toLowerCase();
  const allowed = new Set<string>(COVER_EXT_LIST);
  return allowed.has(ext) ? ext : "";
}

function extractUploadFilename(url?: string) {
  if (!url) return "";
  const safe = decodeURIComponent(String(url).split("?")[0].split("#")[0]);
  const file = path.basename(safe.replace(/\\/g, "/"));
  if (!file || file === "." || file === ".." || file.includes("..")) return "";
  return file;
}

export function createCoverStorage(config: CoverStorageConfig) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });

  function ensureCovers(books: BookRecord[]) {
    for (const book of books) {
      const file = path.basename(book.cover_url || `cover-${book.id}.svg`);
      const full = path.join(config.uploadsDir, file);
      if (file.endsWith(".svg")) {
        fs.writeFileSync(full, svgCover(book.id, book.title), "utf8");
      } else if (!fs.existsSync(full)) {
        fs.writeFileSync(full, svgCover(book.id, book.title), "utf8");
      }
    }
  }

  function uploadedUrl(file: Express.Multer.File) {
    return `/uploads/${file.filename}`;
  }

  function removeByUrl(url?: string) {
    const file = extractUploadFilename(url);
    if (!file || /^cover-\d+\.svg$/.test(file)) return;

    const uploadsRoot = path.resolve(config.uploadsDir);
    const target = path.resolve(uploadsRoot, file);
    const relative = path.relative(uploadsRoot, target);

    if (relative.startsWith("..") || path.isAbsolute(relative)) return;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        if (fs.existsSync(target)) fs.unlinkSync(target);
        if (!fs.existsSync(target)) return;
      } catch {
        // Cleanup is best-effort; the route remains deterministic.
      }

      if (attempt < 4) {
        const wait = 25 * (attempt + 1);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait);
      }
    }

    try {
      fs.rmSync(target, { force: true, maxRetries: 5, retryDelay: 50 });
    } catch {
      // Ignore a final cleanup failure.
    }
  }

  function createUploadMiddleware() {
    const mimeTypes = new Set<string>(COVER_MIME_LIST);

    return multer({
      storage: multer.diskStorage({
        destination: config.uploadsDir,
        filename: (_req, file, cb) => {
          cb(
            null,
            `cover-${Date.now()}-${Math.round(Math.random() * 1e6)}${coverExt(file.originalname) || COVER_FALLBACK_EXT}`,
          );
        },
      }),
      limits: { fileSize: COVER_MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        const ext = coverExt(file.originalname);
        if (
          ext &&
          (mimeTypes.has(file.mimetype) ||
            file.mimetype === "application/octet-stream")
        ) {
          cb(null, true);
        } else {
          cb(
            Object.assign(new Error(MESSAGE.coverType), { field: FIELD_COVER }),
          );
        }
      },
    });
  }

  return {
    ensureCovers,
    createUploadMiddleware,
    uploadedUrl,
    removeByUrl,
  };
}

export type CoverStorage = ReturnType<typeof createCoverStorage>;

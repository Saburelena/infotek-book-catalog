# syntax=docker/dockerfile:1

# === Stage 1: build (frontend + server) ===
FROM node:22-alpine AS build

WORKDIR /app

# 1. Копируем только манифесты (для кэша слоёв)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY server/package.json ./server/
COPY tools/e2e/package.json ./tools/e2e/

# 2. Устанавливаем все зависимости (workspaces)
RUN npm ci --no-audit --no-fund

# 3. Копируем исходники
COPY frontend/ ./frontend/
COPY server/ ./server/

# 4. Собираем frontend + server
RUN npm run build --workspace frontend
RUN npm run build --workspace server


# === Stage 2: runtime ===
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# 5. Копируем манифесты
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# 6. Устанавливаем только production-зависимости server
RUN npm ci --omit=dev --no-audit --no-fund --workspace server

# 7. Копируем собранные артефакты
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/frontend/dist ./server/public
COPY --from=build /app/server/uploads ./server/uploads

RUN mkdir -p ./server/data ./server/uploads

WORKDIR /app/server
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
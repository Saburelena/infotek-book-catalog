# Инфотек — каталог книг

Тестовый fullstack-проект каталога книг: Vue 3 + TypeScript + Vite на клиенте и Express + TypeScript на сервере. Проект показывает не только UI, но и архитектуру, API-слой, авторизацию, CRUD, загрузку обложек, тестирование и production-oriented tooling.

**Демо:** https://infotek-book-catalog-h6vkasbvq-saburelena.vercel.app/
**GitHub:** https://github.com/Saburelena/infotek-book-catalog

## Что реализовано

* каталог книг и авторов;
* поиск, фильтры и пагинация;
* страницы книги, автора и отчёта ТОП-10;
* CRUD книг и авторов;
* JWT-аутентификация;
* загрузка и удаление обложек;
* подписка на новые книги автора с эмуляцией SMSPilot;
* клиентский API-layer с нормализацией ответов;
* TanStack Vue Query для server-state;
* DI composition root на фронтенде и backend dependency container;
* Feature-Sliced Design на фронтенде;
* TypeScript strict mode;
* Vitest + Vue Test Utils;
* backend unit tests на `node:test` + `tsx`;
* Playwright E2E + автоматический axe accessibility smoke-check;
* dependency-cruiser для проверки FSD-зависимостей;
* GitHub Actions CI;
* production Docker image с frontend + API;
* health endpoint и структурированный HTTP request logging.

## Стек

### Frontend

* Vue 3
* TypeScript
* Vite
* Vue Router
* TanStack Vue Query
* Vitest
* Vue Test Utils
* ESLint + eslint-plugin-vue
* Prettier
* dependency-cruiser

### Backend

* Node.js
* Express
* TypeScript
* JWT
* Multer
* JSON storage для тестового окружения

### Quality / delivery

* Playwright
* axe-core
* GitHub Actions
* Docker / Docker Compose

## Архитектура frontend

```text
frontend/src/

├── app/          # composition root, providers, router, global styles
├── pages/        # route-level screens
├── widgets/      # крупные UI-композиции
├── features/     # пользовательские сценарии и use cases
├── entities/     # доменные сущности
└── shared/       # UI, API, config, DI, utils, types
```

В проекте **нет отдельного `index`-слоя**: точка входа приложения относится к `app`.

### FSD dependency rule

Направление зависимостей:

```text
app
 ↓
pages
 ↓
widgets
 ↓
features
 ↓
entities
 ↓
shared
```

Нижний слой не импортирует верхний. Циклические зависимости запрещены dependency-cruiser.

## Архитектура backend

```text
server/

├── config/          # environment/config
├── controllers/     # HTTP input/output
├── middleware/      # auth, errors, request telemetry
├── routes/          # route composition
├── services/        # business/use-case logic
├── storage/         # JSON repository + cover storage
├── utils/           # validation, pagination, response
├── domain/          # domain types
├── tests/           # backend unit tests
├── app.ts           # Express composition
├── container.ts     # backend composition root
└── index.ts         # process bootstrap
```

Главная цель разбиения — чтобы `index.ts` занимался только bootstrap, а маршруты, HTTP-контроллеры, бизнес-логика и storage имели отдельные ответственности.

## Запуск

Требуется Node.js 20+.

### Первичная установка

```bash
npm install
npm run install:all
```

### Запуск frontend + API

```bash
npm run dev
```

Адреса:

* Frontend: http://localhost:5173
* API: http://localhost:3001/api/v1
* Health: http://localhost:3001/api/v1/health

### Демо-учётная запись

```text
user / user123
```

## Проверки

Основная локальная проверка:

```bash
npm run verify
```

Она выполняет:

```text
lint → typecheck → frontend/backend tests → FSD dependency check → frontend/backend build
```

### E2E

Установка E2E-зависимостей:

```bash
npm run e2e:install
npx playwright install chromium
```

Запуск E2E:

```bash
npm run e2e
```

### Полная проверка

```bash
npm run verify:all
```

E2E-пакет специально отделён в `tools/e2e`, чтобы браузерный test tooling не попадал в production/runtime dependencies приложения.

## Environment

### Frontend

```text
VITE_API_BASE=/api/v1
```

### Backend

```text
PORT=3001
JWT_SECRET=your_secret
SMSPILOT_API_KEY=your_key_if_needed
NODE_ENV=development|production
```

В production `JWT_SECRET` обязателен.

## Runtime data

`server/data/` и загружаемые пользователем файлы в `server/uploads/` — runtime-состояние и не входят в репозиторий.

В репозитории хранятся только 20 исходных SVG-обложек `cover-1.svg` … `cover-20.svg`, которые используются seed-данными.

При чистом запуске API автоматически создаёт `server/data/store.json` из `server/seed.ts`.

Пользовательские PNG/JPEG-файлы появляются только после загрузки обложек через UI.

## Production / Docker

Создайте `.env` на основе `.env.example` и задайте уникальный `JWT_SECRET`.

Production-сборка объединяет собранный Vue frontend и Express API в один контейнер.

```bash
docker compose up --build
```

После запуска:

```text
http://localhost:3001
```

Данные и загруженные обложки можно сохранить через bind volumes, описанные в `docker-compose.yml`.

Healthcheck контейнера использует:

```text
GET /api/v1/health
```

## Accessibility / E2E

Playwright smoke tests проверяют:

* открытие каталога;
* переход между основными разделами;
* авторизацию демо-пользователя;
* базовый accessibility audit через axe.

## Styling

Стили находятся в `frontend/src/app/styles/` и организованы как глобальные CSS-слои:

```text
tokens → base → shell → catalog → forms → overlays
```

Design tokens вынесены в `tokens.css`.

Это не CSS Modules.

## Почему JSON storage

JSON storage оставлен намеренно как инфраструктура тестового задания: он позволяет показать API, CRUD, авторизацию и работу с файлами без внедрения отдельной БД.

Для production-системы следующий шаг — PostgreSQL + migrations + repository implementation с тем же service/controller API.

## Portfolio notes

Проект демонстрирует:

* архитектурное мышление;
* разделение transport/business/UI concerns;
* работу с async server-state;
* dependency injection;
* строгую типизацию;
* обработку ошибок и edge cases;
* accessibility-oriented markup;
* автоматизированные проверки;
* контейнеризацию и CI.

При этом проект является **тестовым заданием**, поэтому JSON storage и эмулятор SMSPilot используются как часть инфраструктуры тестового проекта и не выдаются за production infrastructure.

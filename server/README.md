# Vandrounik API

Node + Hono + SQLite. Контракт: [`docs/api.md`](../docs/api.md).

## Быстрый старт

```bash
cd server
cp .env.example .env   # уже есть пример секретов для dev
npm install
npm run dev
```

API: `http://localhost:8787/api/v1`  
Health: `GET /api/v1/health`

В корневом Vite (`npm run dev`) путь `/api/v1` проксируется на этот порт.

## Dev-вход

Без `RESEND_API_KEY` код пишется в консоль сервера. По умолчанию `DEV_LOGIN_CODE=0000`.

1. `POST /api/v1/auth/email/start` `{ "email": "you@example.com" }`
2. `POST /api/v1/auth/email/verify` `{ "email": "you@example.com", "code": "0000" }`

## Env

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт (8787) |
| `DATABASE_PATH` | Файл SQLite |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Секреты JWT |
| `ACCESS_TTL_SECONDS` | TTL access (900) |
| `REFRESH_TTL_SECONDS` | TTL refresh (30d) |
| `RESEND_API_KEY` | Если задан — письма через Resend |
| `EMAIL_FROM` | From для Resend (prod: `noreply@vandrounik.of.by`) |
| `CORS_ORIGINS` | Разрешённые origin через запятую |
| `DEV_LOGIN_CODE` | Фиксированный код без Resend (в prod не задавать) |
| `ALLOWED_EMAILS` | Invite-only, через запятую (пусто = все) |
| `STATIC_DIR` | Каталог Vite `dist` (Docker: `/app/dist`) |

Не коммитьте `server/.env` и `server/data/`.

Прод на Railway: один контейнер отдаёт API + статику + прокси Nominatim/OSRM. Инструкция: [`docs/deploy.md`](../docs/deploy.md).

## Реализовано в этой волне

- `POST /auth/email/start|verify`
- `POST /auth/refresh|logout`
- `POST /auth/google` → 501
- `GET|PATCH /me`, `POST /me/email/start|verify`
- `GET|POST|PATCH|DELETE /trips`, `POST /trips/import`
- `GET|PUT /visited`, `POST|DELETE /visited/:placeId`

После логина клиент один раз импортирует локальные trips/visited на сервер.

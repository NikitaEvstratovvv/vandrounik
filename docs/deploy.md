# Деплой на Railway

Один сервис: API + собранный фронт + прокси Nominatim/OSRM. SQLite на volume `/data`.

## Подготовка репозитория

1. Закоммитьте и запушьте `main` на GitHub (`NikitaEvstratovvv/vandrounik`).
2. Аккаунт: [railway.app](https://railway.app) → Login with GitHub.

## Создание проекта

1. **New Project** → **Deploy from GitHub repo** → выберите `vandrounik`.
2. Railway подхватит [`Dockerfile`](../Dockerfile) и [`railway.toml`](../railway.toml).
3. Дождитесь первого билда (может занять несколько минут из‑за `better-sqlite3`).

## Volume

1. Сервис → **Settings** → **Volumes** (или правый клик на canvas → Volume).
2. Mount path: **`/data`**
3. Redeploy после создания volume.

Без volume база пропадёт при каждом редеплое.

## Variables

Сервис → **Variables** (подставьте свои значения):

| Variable | Пример |
|----------|--------|
| `DATABASE_PATH` | `/data/vandrounik.sqlite` |
| `STATIC_DIR` | `/app/dist` (уже в Docker; можно не дублировать) |
| `JWT_ACCESS_SECRET` | длинная случайная строка |
| `JWT_REFRESH_SECRET` | другая длинная случайная строка |
| `RESEND_API_KEY` | ключ из Resend |
| `EMAIL_FROM` | `Vandrounik <noreply@vandrounik.of.by>` |
| `CORS_ORIGINS` | `https://YOUR-APP.up.railway.app` |
| `ALLOWED_EMAILS` | `you@mail.com,friend@mail.com` |
| `PORT` | задаёт Railway автоматически |

**Не задавайте** `DEV_LOGIN_CODE` в production (код только через Resend).

Сгенерировать секреты локально:

```bash
openssl rand -hex 32
```

После смены Variables — Redeploy.

## Домен

1. Сервис → **Settings** → **Networking** → **Generate Domain**.
2. Откройте `https://YOUR-APP.up.railway.app/api/v1/health` → `{"ok":true}`.
3. Обновите `CORS_ORIGINS` на этот URL (и при необходимости добавьте `https://vandrounik.of.by`).

### Свой домен (позже)

1. Railway → **Custom Domain** → `vandrounik.of.by`.
2. В DNS hoster.by добавьте CNAME/A, как покажет Railway.
3. Добавьте origin в `CORS_ORIGINS`.

## Invite-only

Пока задан `ALLOWED_EMAILS`, войти могут только эти адреса. Ссылку на приложение можно слать всем; без почты в списке API ответит «Доступ пока только по приглашению».

## Проверка

1. Открыть корневой URL → экран входа.
2. Email из allowlist → код приходит на почту (Resend) или смотрите логи Railway, если ключ не задан.
3. После входа: создать маршрут (Nominatim/OSRM через тот же хост).

## Локальная проверка образа (опционально)

```bash
docker build -t vandrounik .
docker run --rm -p 8787:8787 \
  -e JWT_ACCESS_SECRET=test \
  -e JWT_REFRESH_SECRET=test \
  -e DEV_LOGIN_CODE=0000 \
  -v vand-data:/data \
  vandrounik
```

Открыть http://localhost:8787

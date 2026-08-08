# API contract (v1)

Контракт бэкенда для Vandrounik. Согласован с клиентскими типами в [`src/types/index.ts`](../src/types/index.ts), [`src/lib/storage/auth.ts`](../src/lib/storage/auth.ts), [`src/lib/storage/trips.ts`](../src/lib/storage/trips.ts), [`src/lib/storage/visited.ts`](../src/lib/storage/visited.ts), [`src/lib/profile/avatar.ts`](../src/lib/profile/avatar.ts).

**Статус:** auth, `/me`, trips и visited реализованы в [`server/`](../server/).  
**Цель волны 1:** auth + профиль + trips + visited.  
**Вне волны 1:** генерация маршрутов, Nominatim/OSRM, каталог POI, CDN аватаров, публичный шаринг, push.

## Decisions

| Тема | Выбор v1 |
|------|----------|
| Auth transport | `Authorization: Bearer <accessToken>` |
| Refresh | `refreshToken` в ответе логина + `POST /auth/refresh` |
| ID | UUID strings |
| Время | ISO-8601 UTC |
| Владение | все `/trips` и `/visited` только для текущего пользователя |

## Base

- Base path: `/api/v1`
- `Content-Type: application/json; charset=utf-8`
- Успешные мутации без тела: `204 No Content` где указано
- Ошибка:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Некорректный email"
  }
}
```

| HTTP | `error.code` | Когда |
|------|--------------|--------|
| 400 | `validation_error` | Невалидное тело / код |
| 401 | `unauthorized` | Нет / протухший токен |
| 403 | `forbidden` | Чужой ресурс |
| 404 | `not_found` | Нет сущности |
| 409 | `conflict` | Конфликт (например email занят) |
| 429 | `rate_limited` | Лимит кодов / запросов |
| 500 | `internal` | Сервер |

---

## Shared types

Совпадают с фронтом; сервер не переименовывает поля без миграции клиента.

### `Transport` / `DurationUnit` / `InterestId` / `TypeGroupId`

Как в `src/types/index.ts`.

### `ProfileAvatar`

```ts
type ProfileAvatar =
  | { kind: 'preset'; id: AvatarPresetId }
  | { kind: 'custom'; dataUrl: string }

type AvatarPresetId =
  | 'stork' | 'fox' | 'bison' | 'frog' | 'snake' | 'beaver' | 'mouse'
```

В v1 custom avatar — JPEG data URL (как сейчас). Лимит размера тела запроса: **512 KB** на `PATCH /me` с custom avatar. CDN — позже.

### `RouteStop`

```ts
type RouteStop = {
  placeId: string
  order: number
  name: string
  type: string
  typeGroup: TypeGroupId
  typeGroupLabel: string
  interests: InterestId[]
  primaryInterest: InterestId
  lat: number
  lng: number
  description?: string
  wikipediaUrl?: string
  imageUrl?: string
  driveMinutesToNext?: number
}
```

### `RouteVariant`

```ts
type RouteVariant = {
  id: string
  title: string
  stops: RouteStop[]
  geometry?: { lat: number; lng: number }[]  // опционально; клиент часто шлёт без polyline
  totalKm: number
  totalMinutes: number
  interestLabels: string[]
}
```

### `GenerationParams`

```ts
type GenerationParams = {
  originTitle: string
  originLat: number | null
  originLng: number | null
  destinationTitle: string
  destinationLat: number | null
  destinationLng: number | null
  circular: boolean
  transport: Transport
  durationUnit: DurationUnit | null
  durationHours: number | null
  durationKm: number | null
  interests: InterestId[]
}
```

### `User`

```ts
type User = {
  id: string
  email: string
  username: string
  displayName: string
  avatar: ProfileAvatar
  provider: 'email' | 'google'
  createdAt: string
}
```

### `TripStatus` / `Trip`

```ts
type TripStatus = 'new' | 'in-progress' | 'completed'

type Trip = {
  id: string
  status: TripStatus
  visitedPlaceIds: string[]
  variant: RouteVariant
  params: GenerationParams | null
  savedAt: string
  updatedAt: string
}
```

### `AuthTokens`

```ts
type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number  // access TTL, seconds
}
```

### `AuthResponse`

```ts
type AuthResponse = {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```

---

## Auth

Код из письма: **≥ 4** символа (как UI). Dev/mock: код можно логировать или фиксировать (`0000`) — поведение описать в README бэка.

### `POST /auth/email/start`

Старт входа / регистрации по email.

**Body:** `{ "email": string }`  
**Response `200`:** `{ "ok": true }`  
**Errors:** `validation_error`, `rate_limited`

Создаёт/обновляет pending challenge; не выдаёт токен.

### `POST /auth/email/verify`

**Body:** `{ "email": string, "code": string }`  
**Response `200`:** `AuthResponse`  
**Errors:** `validation_error`, `unauthorized` (неверный код), `rate_limited`

Новый пользователь: `provider: "email"`, `displayName` / `username` из local-part email, `avatar` preset `stork`.

### `POST /auth/google`

**Body:** `{ "idToken": string }`  
**Response `200`:** `AuthResponse`  
**Errors:** `validation_error`, `unauthorized`

### `POST /auth/refresh`

**Body:** `{ "refreshToken": string }`  
**Response `200`:** `AuthTokens` (+ опционально свежий `user` не требуется)  
**Errors:** `unauthorized`

### `POST /auth/logout`

**Headers:** Bearer  
**Body (optional):** `{ "refreshToken": string }` — revoke  
**Response:** `204`

### `GET /me`

**Headers:** Bearer  
**Response `200`:** `User`

### `PATCH /me`

**Headers:** Bearer  
**Body (частично):** `{ "displayName"?: string, "avatar"?: ProfileAvatar }`  
**Response `200`:** `User`  
**Errors:** `validation_error`

### `POST /me/email/start`

Смена email (как Profile email flow).

**Body:** `{ "email": string }`  
**Response `200`:** `{ "ok": true }`  
**Errors:** `validation_error`, `conflict`, `rate_limited`

### `POST /me/email/verify`

**Body:** `{ "email": string, "code": string }`  
**Response `200`:** `User`  
**Errors:** `validation_error`, `unauthorized`, `conflict`

---

## Trips

Все эндпоинты требуют Bearer. Чужой `id` → `404` или `403` (предпочтительно **404**, чтобы не светить существование).

### `GET /trips`

Список поездок пользователя, **newest first** (`savedAt` desc).

**Response `200`:** `{ "trips": Trip[] }`

### `GET /trips/:id`

**Response `200`:** `Trip`  
**Errors:** `not_found`

### `POST /trips`

Создать поездку (экран E4 «Сохранить»).

**Body:**

```json
{
  "variant": { /* RouteVariant */ },
  "params": { /* GenerationParams */ }
}
```

`params` может быть `null`.

**Сервер выставляет:**

- `id` — новый UUID
- `status` — `"new"`
- `visitedPlaceIds` — `[]`
- `savedAt` / `updatedAt` — now
- `variant.geometry` можно отбросить при сохранении (как slim на клиенте), если слишком тяжёлая

**Response `201`:** `Trip`

### `PATCH /trips/:id`

Частичное обновление статуса / прогресса (E6).

**Body:**

```json
{
  "status": "in-progress",
  "visitedPlaceIds": ["osm-n-123", "mir"]
}
```

Оба поля опциональны; минимум одно обязательно.

**Правила (клиент + сервер согласованы):**

| Действие UI | PATCH |
|-------------|--------|
| «Поехали» | `{ "status": "in-progress" }` |
| «Был здесь» / undo | `{ "visitedPlaceIds": [...] }` |
| Cancel поездки | `{ "status": "new", "visitedPlaceIds": [] }` |
| Все POI visited | `{ "status": "completed", "visitedPlaceIds": [...] }` |

При добавлении placeId в `visitedPlaceIds` сервер **также** добавляет его в глобальный `/visited` пользователя (idempotent).

**Response `200`:** `Trip`  
**Errors:** `validation_error`, `not_found`

### `DELETE /trips/:id`

**Response:** `204`  
**Errors:** `not_found`

### `POST /trips/import`

Одноразовая миграция с клиента после первого логина.

**Body:**

```json
{
  "trips": [
    {
      "id": "optional-client-uuid",
      "status": "new",
      "visitedPlaceIds": [],
      "variant": { },
      "params": null,
      "savedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Правила мержа:**

- если `id` уже есть у пользователя — не затирать более новый серверный (`updatedAt` / `savedAt`);
- если `id` нет — создать с переданным `id` (если валидный UUID) или выдать новый;
- ответ: итоговый список после импорта.

**Response `200`:** `{ "trips": Trip[] }`

---

## Visited

Глобальный список «был здесь» для профиля (не путать с per-trip `visitedPlaceIds`).

### `GET /visited`

**Response `200`:** `{ "placeIds": string[] }`

### `PUT /visited`

Полная замена набора (удобно для sync с клиента).

**Body:** `{ "placeIds": string[] }`  
**Response `200`:** `{ "placeIds": string[] }`

### `POST /visited/:placeId`

Idempotent add.

**Response `200`:** `{ "placeIds": string[] }`

### `DELETE /visited/:placeId`

Idempotent remove.

**Response `200`:** `{ "placeIds": string[] }`

---

## Mapping: localStorage → API

| Клиент сейчас | API |
|---------------|-----|
| `vandrounik.auth.session.v1` | `GET /me` + tokens |
| `vandrounik.auth.pending.v1` | серверный pending после `/auth/email/start` |
| `vandrounik.auth.email-change.v1` | `/me/email/*` |
| `vandrounik.trips.v1` | `/trips` |
| `vandrounik.visited-places.v1` | `/visited` |
| `vandrounik.wizard.v1` | остаётся на клиенте |
| `vandrounik.generation.v3` | остаётся на клиенте |

---

## Out of scope (v1 API)

- `POST /generations` / job queue для маршрутов
- Proxy Nominatim / OSRM (можно отдельным infra-слоем без этого контракта)
- Catalog / POI admin
- Публичные ссылки на trip
- Удаление аккаунта
- Upload аватара на object storage

---

## Implementation order (после этого документа)

1. Скелет сервера + health + этот контракт как источник правды.
2. Auth email start/verify + `/me` (+ refresh/logout).
3. Trips CRUD + import.
4. Visited.
5. Клиент: `api/client.ts`, заменить storage-обёртки, один import local trips после логина.

## Changelog

| Дата | Изменение |
|------|-----------|
| 2026-08-09 | Первая версия контракта (auth, trips, visited) |

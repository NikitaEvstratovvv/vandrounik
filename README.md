# Vandrounik

PWA для планирования автопутешествий по Беларуси: генерация маршрутов и трекер «был здесь».

- **UI spec (implementation):** [docs/ui/](docs/ui/) — канон для реализованных экранов
- **API contract (v1):** [docs/api.md](docs/api.md) — auth, trips, visited (бэк ещё не реализован)
- **POI / routing data:** [docs/DATA-POI.md](docs/DATA-POI.md)
- **Figma (новые / redesign):** [Vandrounik-design](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=64-208)

## Стек

- React 19 + TypeScript
- Vite
- Chakra UI v3 (тема в `src/theme/system.ts`)
- React Router v7

## Запуск

```bash
npm install
npm --prefix server install
npm --prefix server run dev   # API :8787
npm run dev                   # Vite :5173 (проксирует /api/v1)
```

Открыть `http://localhost:5173`. Viewport — **360×800**; на десктопе экран центрируется как «телефон».

Вход: email → код. В dev без Resend код в логе API (по умолчанию `0000`). Подробнее: [server/README.md](server/README.md), контракт [docs/api.md](docs/api.md).

**Деплой (Railway):** [docs/deploy.md](docs/deploy.md).

## Скрипты

| Команда | Что делает |
|---------|------------|
| `npm run dev` | Dev-сервер Vite |
| `npm run dev:server` | API (Hono) на :8787 |
| `npm run build` | Type-check + production-сборка |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run preview` | Превью production-сборки |
| `npm run import:osm-belarus` | Импорт POI из OSM |
| `npm run enrich:place-images` | Превью фото мест (Wikidata/Commons) |

## Реализованный flow (v1)

```
A0 Auth email (/)
  → A1 Код (/auth/code)
      → TabShell
          ├── E1 Создать (/plan)          + меню
          ├── E5 Мои маршруты (/trips)    + меню
          │     └── E6 маршрут            overlay  /trips/:tripId
          └── Профиль (/profile)          + меню
                ├── Настройки             /profile/settings
                ├── Фото / Имя / Почта    /profile/settings/…
                E1 overlays (без меню):
                ├── S1  Выбор направления     overlay  /plan/location?point=…
                ├── S2  Что посмотреть        overlay  /plan/interests
                ├── BS1 Длительность          sheet (state)
                └── L1  Загрузка              /plan/loading
                      → E2  Выбор маршрута    overlay  /plan/results
                          → sheet preview → Сохранить
                          → E4  Сохранён      overlay  /plan/results/saved?id=
                          → E3  Детали        overlay  /plan/results/:variantId (deep-link)
```

Авторизация: email + код через API ([docs/api.md](docs/api.md)); в UI Google пока «скоро». Authenticated routes закрыты без сессии. Нижнее меню (Создать / Мои маршруты / Профиль) — только на корневых табах. Подробнее: [docs/ui/navigation.md](docs/ui/navigation.md).

### Экраны

| ID | Файл | Назначение |
|----|------|------------|
| A0 | `src/pages/Auth.tsx` | Email + Google (вместо Splash) |
| A1 | `src/pages/Auth.tsx` | Код из письма (mock) |
| E1 | `src/pages/Plan.tsx` | Хаб: транспорт, направление, интересы, длительность |
| E5 | `src/pages/Trips.tsx` | Мои маршруты (пусто / список / деталь) |
| E8 | `src/pages/Profile.tsx` | Профиль + настройки (фото / имя / почта) |
| S1 | `src/pages/Location.tsx` | Поиск Nominatim (откуда/куда) |
| S2 | `src/pages/Interests.tsx` | 5 категорий интересов |
| BS1 | `src/components/DurationSheet.tsx` | Длительность (часы / км) |
| L1 | `src/pages/Loading.tsx` | Генерация маршрута (OSRM) |
| E2 | `src/pages/Results.tsx` | Карта + 3 варианта; preview-sheet → сохранить |
| E3 | `src/pages/RouteDetail.tsx` | Детали варианта (deep-link с generation) |
| E4 | `src/pages/RouteSaved.tsx` | Успех после сохранения маршрута |
| E6 | `src/pages/TripRoute.tsx` | Управление поездкой: Поехали, «Был здесь», карта/список |

### Генерация маршрута

- **Поиск:** Nominatim (`/api/nominatim`), Беларусь
- **Маршрут:** OSRM Trip (`/api/osrm`) + POI из `ROUTE_PLACES`
- **Варианты:** 3 (`MIN_ROUTE_VARIANTS`)
- **Круговой:** если origin ≈ destination (≤ 0.1 км)

Подробнее: [docs/DATA-POI.md](docs/DATA-POI.md)

### CTA «Подобрать маршрут»

Требует: origin + destination (с координатами) + ≥1 интерес. Длительность опциональна.

### Состояние

- Auth: API ([server/](server/), [docs/api.md](docs/api.md)); локальный кэш сессии `vandrounik.auth.session.v1`
- Wizard: `src/store/wizard.tsx` → `localStorage` `vandrounik.wizard.v1`
- Результат генерации: `src/lib/storage/generation.ts` → `vandrounik.generation.v3`
- Сохранённые поездки: `src/lib/storage/trips.ts` → `vandrounik.trips.v1`
- Visited: `src/lib/storage/visited.ts`

## Дизайн-токены

`src/theme/system.ts` — neutral palette, Inter + Oswald. Спека: [docs/ui/design-tokens.md](docs/ui/design-tokens.md). Figma nodes: [docs/ui/figma-nodes.md](docs/ui/figma-nodes.md).

## Не реализовано (v2+)

- Google OAuth; удаление аккаунта / CDN аватаров
- Каталог (E7)
- Push, шаринг маршрута
- Кастомный домен / верификация Resend (база деплоя: [docs/deploy.md](docs/deploy.md))
# Vandrounik

PWA для планирования автопутешествий по Беларуси: генерация маршрутов и трекер «был здесь».

Спеки: `Design Process/projects/Vandrounik/05-ui/` (синхронизированы с этим репозиторием).

## Стек

- React 19 + TypeScript
- Vite
- Chakra UI v3 (тема в `src/theme/system.ts`)
- React Router v7

## Запуск

```bash
npm install
npm run dev
```

Открыть `http://localhost:5173`. Viewport — **360×800**; на десктопе экран центрируется как «телефон».

## Скрипты

| Команда | Что делает |
|---------|------------|
| `npm run dev` | Dev-сервер Vite |
| `npm run build` | Type-check + production-сборка |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run preview` | Превью production-сборки |
| `npm run import:osm-belarus` | Импорт POI из OSM |

## Реализованный flow (v1)

```
E0 Splash (/)
  → E1 Хаб (/plan)
      ├── S1  Выбор направления     overlay  /plan/location?point=origin|destination
      ├── S2  Что посмотреть        overlay  /plan/interests
      ├── BS1 Длительность          sheet (state)
      └── L1  Загрузка              /plan/loading
            → E2  Выбор маршрута    overlay  /plan/results
                → E3  Детали        overlay  /plan/results/:variantId
```

Архитектура: `Plan.tsx` рендерит overlay-панели по URL; child routes — для deep-link.

### Экраны

| ID | Файл | Назначение |
|----|------|------------|
| E0 | `src/pages/Splash.tsx` | Splash, авто-переход на /plan |
| E1 | `src/pages/Plan.tsx` | Хаб: транспорт, направление, интересы, длительность |
| S1 | `src/pages/Location.tsx` | Поиск Nominatim (откуда/куда) |
| S2 | `src/pages/Interests.tsx` | 4 категории интересов |
| BS1 | `src/components/DurationSheet.tsx` | Длительность (часы / км) |
| L1 | `src/pages/Loading.tsx` | Генерация маршрута (OSRM) |
| E2 | `src/pages/Results.tsx` | Карта + 3 варианта маршрута |
| E3 | `src/pages/RouteDetail.tsx` | Список остановок, «был здесь» |

### Генерация маршрута

- **Поиск:** Nominatim (`/api/nominatim`), Беларусь
- **Маршрут:** OSRM Trip (`/api/osrm`) + POI из `ROUTE_PLACES`
- **Варианты:** 3 (`MIN_ROUTE_VARIANTS`)
- **Круговой:** если origin ≈ destination (≤ 0.1 км)

Подробнее: [docs/DATA-POI.md](docs/DATA-POI.md)

### CTA «Подобрать маршрут»

Требует: origin + destination (с координатами) + ≥1 интерес. Длительность опциональна.

### Состояние

- Wizard: `src/store/wizard.tsx` → `localStorage` `vandrounik.wizard.v1`
- Результат генерации: `src/lib/storage/generation.ts` → `vandrounik.generation.v3`
- Visited: `src/lib/storage/visited.ts`

## Дизайн-токены

`src/theme/system.ts` — neutral palette, Inter + Oswald. См. `Design Process/.../05-ui/design-tokens.md`.

## Не реализовано (v2+)

- Tab bar (План / Поездки / Каталог / Профиль)
- Сохранение поездки (E3 — stub)
- E4 карточка места, E5/E6 поездки, E7 каталог, E8/E9 профиль
- Внешний навигатор (Яндекс / Google)
- Push, шаринг маршрута

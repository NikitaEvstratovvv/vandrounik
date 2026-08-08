# E5 — Мои маршруты

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Trips.tsx`](../../../src/pages/Trips.tsx), [`src/components/TripCard.tsx`](../../../src/components/TripCard.tsx) |
| Route | `/trips` · detail overlay `/trips/:tripId` |
| Figma | empty [`272:1124`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=272-1124) · list [`272:1309`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=272-1309) · cards [`304:1924`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=304-1924) · section [`272:1021`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=272-1021) |

## Behavior

- Tab root with `Header` title «Мои маршруты» + TabBar.
- Empty: stork `/figma/trips-empty-stork.png`, copy «Пока еще нет созданных маршрутов», CTA «Создать маршрут» → `/plan`.
- List: saved trips from `loadTrips()` (`vandrounik.trips.v1`), newest first; `TripCard` shows title, origin→destination, km / time / places, savedAt.
- Card badges (Figma): none (`new`), «Завершен» (`completed`), «В пути» (`in-progress`). New saves default to `new`.
- Tap card → `SlideOverlay` with `RouteDetailPanel` (variant from trip, `hideSave`); URL `/trips/:tripId`.
- E4 «Перейти к моим маршрутам» → `/trips`; «Открыть маршрут» → `/trips/:tripId`.

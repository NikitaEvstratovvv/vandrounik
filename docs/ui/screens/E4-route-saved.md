# E4 — Route saved

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/RouteSaved.tsx`](../../../src/pages/RouteSaved.tsx) (`RouteSavedPanel`) |
| Route | `/plan/results/saved?id={tripId}` |
| Figma | [`301:1140`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=301-1140) |

## Behavior

- Overlay stacked above E2 (`zIndex={16}`, no enter animation).
- Shown after «Сохранить» in the route details sheet; trip written via `saveTrip` (`vandrounik.trips.v1`).
- CTAs «Открыть маршрут» / «Перейти к моим маршрутам» temporarily dismiss the overlay (target screens not built yet).

## Components

- Stork illustration `/figma/route-saved-stork.png`, `PrimaryButton`, filled secondary CTA

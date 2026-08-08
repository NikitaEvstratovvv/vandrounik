# E2 — Results

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Results.tsx`](../../../src/pages/Results.tsx) (`ResultsPanel`) |
| Route | `/plan/results` |
| Figma | [`215:907`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=215-907) / sheet+preview [`216:1056`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=216-1056) |

## Behavior

- Full-screen overlay over E1 (`animateEnter={false}`).
- Interactive map + up to 3 route variants (`RouteVariantPanel` / `RouteCard`).
- Map frost bars: `mapFrostedGradientLayer` (nodes `215:908` / `215:913`).
- Card click or footer «Выбрать» → `RouteDetailsSheet` preview (Yandex/Google chips + «Сохранить»).
- «Сохранить» → `saveTrip` + E4 `/plan/results/saved?id=…`.

## Components

- `InteractiveRouteMap`, `MapZoomControls`, `RouteVariantPanel`, `RouteDetailsSheet`, `PlacePopover`, `Header`

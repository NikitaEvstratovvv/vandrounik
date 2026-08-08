# E1 — Plan hub

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Plan.tsx`](../../../src/pages/Plan.tsx) |
| Route | `/plan` |
| Figma | [`137:204`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=137-204) |

## Layout

- `Header` variant `main` (logo).
- Content: intro text → `Segmented` (Авто / Велосипед) → `MapWidget` → `ViewWidget` → `DurationWidget`.
- Footer: `PrimaryButton` «Подобрать маршрут» → `/plan/loading` when `canGenerate`.
- Hosted in `TabShell` with TabBar on `/plan` root (hidden while overlays/sheets open).
- Padding / gap: 16px.

## Overlays hosted here

S1, S2, BS1, E2, E3 — see [navigation.md](../navigation.md).

Hub chrome is `visibility: hidden` while results stack is open.

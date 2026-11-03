# E1 — Plan hub

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Plan.tsx`](../../../src/pages/Plan.tsx) |
| Route | `/plan` |
| Figma | [`137:204`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=137-204) |

## Layout

- Сначала выбор на `/plan`: две карточки, `Header` `main`. TabBar остаётся.
- **Поездка по Беларуси** — `SlideOverlay` `/plan/trip`: intro → `Segmented` (Авто / Велосипед) → `MapWidget` → `ViewWidget` → `DurationWidget`. `Header` `back` закрывает панель к выбору.
- **Погулять по городу** — `SlideOverlay` `/plan/walk`: город (один поиск S1), те же интересы, `Segmented` «3 места / 5 мест / 8 мест». Длительность не спрашиваем: время видно уже на готовом маршруте. Маршрут в одну сторону: старт в городе, финиш на последнем месте. В результаты попадает только прогулка на выбранное число мест; вариант короче не показываем. Подпись «Пешком».
- Footer на поездке и прогулке: `PrimaryButton` «Подобрать маршрут» → `/plan/loading` when `canGenerate`.
- Hosted in `TabShell`. TabBar on the chooser; trip/walk panels cover it (opaque SlideOverlay). Interests/location/results/sheets hide the bar via `forceHidden`.
- Padding / gap: 16px.

## Overlays hosted here

Trip form, walk form, S1, S2, BS1, E2, E3 — see [navigation.md](../navigation.md).

Hub chrome is `visibility: hidden` while results stack is open.

# S1 — Location

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Location.tsx`](../../../src/pages/Location.tsx) → [`LocationMapPanel`](../../../src/pages/LocationMapPanel.tsx) |
| Route | `/plan/location?point=origin\|destination` |
| Figma | composed (map-first); legacy list nodes `138:330` / `142:545` |

## Behavior

- Slide overlay from E1; `point` selects origin vs destination (walk «Город» = origin + title override).
- Map-first: frosted back header + full-bleed map; bottom card — search field + «Выбрать».
- Tap search → fullHeight `BottomSheet` (`dragToDismiss`) with [`searchPlaces`](../../../src/data/places.ts); pick result → pin on map, confirm with «Выбрать».
- Tap map → [`resolvePlaceAt`](../../../src/data/places.ts); loader — `RingSpinner` in the field.
- «Куда» with origin: search biased `near` + subtitle `… · N км`.
- Idle / nothing: `/figma/illustration.png` / `nothing-found.png` inside the sheet.
- Writes place into wizard (`setOrigin` / `setDestination`).

## Components

- `LocationPanel` thin wrapper; `LocationMapPanel` `enableSearch` + `BottomSheet` search

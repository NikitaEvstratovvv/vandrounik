# S1 — Location

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Location.tsx`](../../../src/pages/Location.tsx) (`LocationPanel`) |
| Route | `/plan/location?point=origin\|destination` |
| Figma | [`138:330`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=138-330) / [`142:545`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=142-545) |

## Behavior

- Slide overlay from E1; `point` selects origin vs destination field focus.
- Nominatim search via `/api/nominatim` (Belarus).
- Idle: `/figma/illustration.png`; empty results: `/figma/nothing-found.png`.
- Writes place into wizard (`setOrigin` / `setDestination`).

## Components

- `Header` back, search field (`pill` radius), result list, `EmblemLoader` where applicable

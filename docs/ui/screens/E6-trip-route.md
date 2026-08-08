# E6 — Trip route (manage saved trip)

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/TripRoute.tsx`](../../../src/pages/TripRoute.tsx) (`TripRoutePanel`), [`TripStopRow`](../../../src/components/TripStopRow.tsx), [`TripPlaceSheet`](../../../src/components/TripPlaceSheet.tsx), [`TripManageSheets`](../../../src/components/TripManageSheets.tsx), [`TripCompletedPanel`](../../../src/components/TripCompletedPanel.tsx) |
| Route | `/trips/:tripId` (SlideOverlay hosted by E5) |
| Figma | section [`305:2280`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=305-2280) · idle list `305:2281` · map `305:2355` · in-progress `305:2722` · place `306:1997` · delete `305:2665` · menu `317:1883` · cancel `317:1963` · completed `305:2410` |

## Behavior

Entry: E4 «Открыть маршрут» or E5 trip card → `/trips/:tripId`.

| Status | Header | List | Bottom |
|--------|--------|------|--------|
| `new` | trash → delete confirm | tap → place sheet (no «Был здесь») | List/Map + «Поехали» |
| `in-progress` | ⋮ → cancel / delete | «Был здесь» / undo + timeline | List/Map only |
| `completed` | trash → delete | visited actions; celebration once on transition | List/Map only |

- Per-trip `visitedPlaceIds` on `SavedTrip`; mark also syncs global visited (Profile).
- «Поехали» → `in-progress`. All POI stops visited → `completed` + celebration overlay.
- Cancel → `new` + clear trip visited (global kept). Delete removes trip and closes overlay.
- External map chips: full route (header) / single point (place sheet).

## Components

- `Segmented` List/Map, `InteractiveRouteMap`, map chips (`/figma/map-*.svg`)
- Celebration reuses `/figma/route-saved-stork.png`

## Motion

- E5 → E6: `SlideOverlay` enter/exit 280ms
- List/map swap + status chrome: `vandr-fade-in` / opacity 280ms
- Place / manage / confirm: existing sheet slide + dim
- Completed: opacity enter/exit 280ms + content fade-in
- Micro: chips, header icons, CTAs `opacity 150ms`

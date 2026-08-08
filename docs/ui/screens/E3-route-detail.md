# E3 — Route detail

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/RouteDetail.tsx`](../../../src/pages/RouteDetail.tsx) (`RouteDetailPanel`) |
| Route | `/plan/results/:variantId` |
| Figma | **TBD** (no node ID in code comment; related sheet `217:948`) |

## Behavior

- Overlay stacked above E2 (`zIndex={16}`, no enter animation).
- Map + stop list; toggle «был здесь» via visited storage.
- Deep-link / legacy path only — happy-path select is E2 sheet → E4 saved.
- Save trip CTA on this screen remains a stub (persistence lives on E2 sheet → `saveTrip`).

## Components

- `InteractiveRouteMap`, `MapZoomControls`, `RouteDetailStopRow`, `PrimaryButton`, `Header` back

## Follow-up

Add primary Figma frame node to this doc and to [`figma-nodes.md`](../figma-nodes.md) when identified.

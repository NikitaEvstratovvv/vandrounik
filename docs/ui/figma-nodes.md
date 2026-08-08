# Figma nodes

File: [Vandrounik-design](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=64-208)  
File key: `mAysLALLcMDA07FqvFno5B`

URL form: `https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id={id with -}`  
MCP / code form: `nodeId` with `:`.

## Spot-check (2026-08-08)

Verified via Figma MCP `get_screenshot` — nodes resolve and match implemented screens:

| ID | Node | Result |
|----|------|--------|
| A0 | `320:1635` | Auth email; error under field `320:1734` |
| A1 | `332:1521` | Auth code from email |
| E1 | `137:204` | Hub: transport, map widget, interests, duration, CTA |
| S2 | `147:667` | Interests list with checkboxes |
| L1 | `149:838` | Loading / ornament |
| E2 | `215:907` | Map + route variant carousel |

Auth section overview: [`304:2246`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=304-2246).  
Profile section overview: [`304:2279`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=304-2279).

## Screens (implemented)

| ID | Status | Node(s) | Code | Figma link |
|----|--------|---------|------|------------|
| A0 Auth email | implemented | `320:1635` / error `320:1711`+`320:1734` | `src/pages/Auth.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=320-1635) |
| A1 Auth code | implemented | `332:1521` | `src/pages/Auth.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=332-1521) |
| E0 Splash | retired | `120:361` | — (replaced by A0) | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=120-361) |
| E1 Plan | implemented | `137:204` | `src/pages/Plan.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=137-204) |
| E5 Trips | implemented | empty `272:1124` / list `272:1309` / cards `304:1924` / section `272:1021` | `src/pages/Trips.tsx` + `TripCard` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=272-1021) |
| E8 Profile | implemented | `308:2061` | `src/pages/Profile.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=308-2061) |
| Profile settings | implemented | `350:2045` / filled `351:2148` | `src/pages/ProfileSettings.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=351-2148) |
| Profile photo | implemented | `351:2207` / `351:2310` | `src/pages/ProfilePhoto.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=351-2207) |
| Profile name | implemented | `350:2088` / success `350:2114` | `src/pages/ProfileName.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=350-2088) |
| Profile email | implemented | `332:1568` / code `332:1642` / done `332:1673` | `src/pages/ProfileEmail.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=332-1568) |
| S1 Location | implemented | `138:330` / `142:545` | `src/pages/Location.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=138-330) |
| S2 Interests | implemented | `147:667` | `src/pages/Interests.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=147-667) |
| BS1 Duration | implemented | `148:447` | `src/components/DurationSheet.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=148-447) |
| L1 Loading | implemented | `149:838` | `src/pages/Loading.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=149-838) |
| E2 Results | implemented | `215:907` / preview sheet `216:1056` | `src/pages/Results.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=216-1056) |
| E3 Route detail | implemented | **TBD** (generation deep-link) | `src/pages/RouteDetail.tsx` | — (plan `/plan/results/:variantId` only) |
| E4 Route saved | implemented | `301:1140` | `src/pages/RouteSaved.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=301-1140) |
| E6 Trip route | implemented | section `305:2280` / idle `305:2281` / map `305:2355` / active `305:2722` / place `306:1997` / delete `305:2665` / menu `317:1883` / cancel `317:1963` / done `305:2410` | `src/pages/TripRoute.tsx` | [open](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=305-2280) |

## Components / fragments

| Piece | Node(s) | Code |
|-------|---------|------|
| Tab bar | `271:1300` / `271:1255` | `TabBar.tsx` |
| Header main / back | `126:129` / `145:443` | `Header.tsx` |
| PrimaryButton | `137:213` / `147:700` | `PrimaryButton.tsx` |
| Segmented | `132:290` | `Segmented.tsx` |
| MapWidget | `137:261` / `132:173` | `MapWidget.tsx` |
| ViewWidget empty/filled | `132:218` / `132:209` | `ViewWidget.tsx` |
| DurationWidget empty/filled | `132:246` / `132:237` | `DurationWidget.tsx` |
| Emblem loader | `85:458` | `EmblemLoader.tsx` |
| Sheet overlay dim | `238:988` | `SheetOverlay.tsx` |
| Map frost bars | `215:908` / `215:913` | `theme/mapOverlay.ts` |
| Route variant panel | `216:1055` | `RouteVariantPanel.tsx` |
| Route details sheet | `217:948` / frame `216:1056` | `RouteDetailsSheet.tsx` |
| Map export chips | `272:1091` / `272:1097` | `RouteDetailsSheet.tsx` |
| Stop row | `217:1014` | `StopRow.tsx` |
| Trip stop row | `305:2309` / active `305:2750` / stepper `306:1601` | `TripStopRow.tsx` |
| Trip place sheet | `306:1997` | `TripPlaceSheet.tsx` |
| Map zoom | `217:1100` / `217:1101` | `MapZoomControls.tsx` |
| Place popover | `220:1326` | `PlacePopover.tsx` |
| Waypoint marker | `263:808` | `map/MapWaypointMarker.tsx` |
| Racing flag icon | `264:930` | `icons.tsx` (`RacingFlagIcon`, map) |
| Flag icon (start/finish) | shadcn `1529:32769` | `icons.tsx` (`FlagIcon`, stop badges) |

## Figma-only (v2+, not in app yet)

Figma contains more screens than v1 (catalog, place card, full trips history, …). Treat as `figma-only` until implemented. When adding one:

1. Pick the frame node in Figma.
2. Add a row here with status `figma-only` → then `implemented`.
3. Add `docs/ui/screens/…` and follow `vandrounik-ui` skill.

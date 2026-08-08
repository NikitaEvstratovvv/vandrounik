# UI primitives

Prefer these over one-off markup. Tokens: [design-tokens.md](../design-tokens.md).

## Shell / navigation chrome

| Component | File | Notes |
|-----------|------|-------|
| `Screen` | `src/components/Screen.tsx` | Full viewport column, `bg=screen` |
| `TabShell` | `src/components/TabShell.tsx` | Auth layout: Outlet + TabBar on root tabs |
| `TabBar` | `src/components/TabBar.tsx` | Создать / Мои маршруты / Профиль (Figma 271:1300) |
| `tab-chrome` | `src/components/tab-chrome.tsx` | `useTabChrome` hide flag for overlays |
| `AuthShell` | `src/components/AuthShell.tsx` | Splash art + frosted auth card |
| `Header` | `src/components/Header.tsx` | `main` logo / `title` Oswald / `back` + title; h=80 |
| `TripCard` | `src/components/TripCard.tsx` | E5 saved trip row (new / in-progress / completed) |
| `RequireAuth` | `src/components/RequireAuth.tsx` | Gate tab routes + loading behind mock session |
| `SlideOverlay` | `src/components/SlideOverlay.tsx` | Full-screen slide from right |
| `BottomSheet` | `src/components/BottomSheet.tsx` | Sheet + backdrop (`flush` \| `inset` floating 8px) |
| `SheetOverlay` | `src/components/SheetOverlay.tsx` | Dim layer (popover/sheet) |

## Controls

| Component | File | Notes |
|-----------|------|-------|
| `PrimaryButton` | `src/components/PrimaryButton.tsx` | h=48, `radius.card`; `primary` / `secondary` |
| `SquareButton` | `src/components/SquareButton.tsx` | 36×36, `radius.btn` |
| `Segmented` | `src/components/Segmented.tsx` | Transport / unit toggles |

## E1 widgets

| Component | File | States |
|-----------|------|--------|
| `MapWidget` | `src/components/MapWidget.tsx` | Origin / destination / swap |
| `ViewWidget` | `src/components/ViewWidget.tsx` | empty / filled |
| `DurationWidget` | `src/components/DurationWidget.tsx` | empty / filled |
| `DurationSheet` | `src/components/DurationSheet.tsx` | BS1 |

## Map / results

| Component | File |
|-----------|------|
| `InteractiveRouteMap` | `src/components/InteractiveRouteMap.tsx` |
| `MapZoomControls` | `src/components/MapZoomControls.tsx` |
| `MapWaypointMarker` | `src/components/map/MapWaypointMarker.tsx` |
| `MapStopLabel` | `src/components/map/MapStopLabel.tsx` |
| `RouteVariantPanel` | `src/components/RouteVariantPanel.tsx` |
| `RouteCard` | `src/components/RouteCard.tsx` |
| `RouteDetailsSheet` | `src/components/RouteDetailsSheet.tsx` |
| `StopRow` | `src/components/StopRow.tsx` |
| `RouteDetailStopRow` | `src/components/RouteDetailStopRow.tsx` |
| `TripStopRow` | `src/components/TripStopRow.tsx` |
| `TripPlaceSheet` | `src/components/TripPlaceSheet.tsx` |
| `TripManageMenu` / `TripConfirmSheet` | `src/components/TripManageSheets.tsx` |
| `TripCompletedPanel` | `src/components/TripCompletedPanel.tsx` |
| `PlacePopover` | `src/components/PlacePopover.tsx` |
| `RouteMapPreview` | `src/components/RouteMapPreview.tsx` |

## Profile

| Component | File | Notes |
|-----------|------|-------|
| `ProfileNavRow` | `src/components/ProfileChrome.tsx` | Settings row + chevron |
| `ProfileStatCard` | `src/components/ProfileChrome.tsx` | Hub stat tile |
| `ProfileSuccess` | `src/components/ProfileChrome.tsx` | Name/email success + CTA |
| `ProfileFadeIn` | `src/components/ProfileChrome.tsx` | `vandr-fade-in` 280ms for hub / steps |

## Brand / motion

| Component | File |
|-----------|------|
| `EmblemLoader` | `src/components/EmblemLoader.tsx` |
| `Spinner` | `src/components/Spinner.tsx` |
| Icons | `src/components/icons.tsx` |

## Chakra provider

`src/components/ui/provider.tsx` wraps app with `system` from `theme/system.ts`.

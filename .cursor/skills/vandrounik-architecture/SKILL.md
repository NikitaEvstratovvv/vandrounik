---
name: vandrounik-architecture
description: >-
  Vandrounik app navigation, overlay pattern, wizard state, and screen flow.
  Use when adding or changing screens, routes, deep links, overlays, sheets,
  wizard fields, generation storage, or Plan hub behavior.
---

# Vandrounik architecture

## Before coding

1. Read [docs/ui/navigation.md](../../../docs/ui/navigation.md).
2. For UI chrome / layout, also follow skill `vandrounik-ui` and [docs/ui/](../../../docs/ui/).
3. For POI / OSRM / interests data, see [docs/DATA-POI.md](../../../docs/DATA-POI.md) — do not duplicate that logic here.

## Flow (v1)

```
A0 Auth email (/)
  → A1 Auth code (/auth/code)
      → TabShell (RequireAuth)
          ├── E1 Создать (/plan)        + TabBar
          ├── E5 Trips (/trips)         + TabBar
          │     └── E6 trip route SlideOverlay /trips/:tripId
          └── E8 Profile (/profile)     + TabBar
                ├── Settings  SlideOverlay  /profile/settings
                ├── Photo     SlideOverlay  /profile/settings/photo
                ├── Name      SlideOverlay  /profile/settings/name
                └── Email     SlideOverlay  /profile/settings/email…
                E1 overlays (no TabBar):
                ├── S1 Location     SlideOverlay  /plan/location?point=origin|destination
                ├── S2 Interests    SlideOverlay  /plan/interests
                ├── BS1 Duration    BottomSheet   local state (no URL)
                └── L1 Loading      /plan/loading   (outside TabShell)
                      → E2 Results  /plan/results
                          → sheet preview → Сохранить
                          → E4 Saved /plan/results/saved?id=
                          → E3 Detail /plan/results/:variantId (deep-link)
```

Auth is mock (`src/lib/storage/auth.ts`). Session includes `displayName` + `avatar` (preset id or custom JPEG data URL). Email errors: red text under field (Figma `320:1734`), no tooltip. Authenticated app uses `RequireAuth` + `TabShell`. Profile settings are SlideOverlays hosted by `Profile.tsx` (same URL-sync pattern as Plan; no TabBar while open); edits use `updateSession`. Motion: skill `vandrounik-motion`.

**TabBar** (Figma `271:1300`): only on exact `/plan`, `/trips`, `/profile`. Hidden on overlay URLs, `/trips/:tripId`, `/profile/*` nested routes, when Plan/Profile/Trips `setForceHidden(true)`, and on `/plan/loading` / auth.

Screen docs: [docs/ui/screens/](../../../docs/ui/screens/).

## Overlay pattern (required)

Hubs: [`Plan.tsx`](../../../src/pages/Plan.tsx) and [`Profile.tsx`](../../../src/pages/Profile.tsx) inside [`TabShell`](../../../src/components/TabShell.tsx). Child routes under `/plan` and `/profile` exist for **URL sync only** (no separate route elements).

1. Local `*Open` state drives `SlideOverlay` / sheet.
2. `onEntered` → `navigate(url, { replace: true })` if URL not already matching.
3. Close → set open false → `onExited` → navigate back to hub or previous stack level.
4. `useTabChrome().setForceHidden(panelOpen)` so the tab bar does not show under overlays/sheets.

Do **not** add a top-level page for a panel that should stack over Plan/Profile unless it is a full-screen step like Loading.

| Pattern | Use |
|---------|-----|
| `SlideOverlay` | Full-screen stack (S1, S2, E2, E4 saved, E3 deep-link, E6 trip route, profile settings) |
| `BottomSheet` | Transient sheet (BS1 Duration, E6 manage/confirm) |
| Full route | Auth (A0–A1), TabShell tabs, Loading |

## State

| Concern | Module | Storage key |
|---------|--------|-------------|
| Auth session | `src/lib/storage/auth.ts` | `vandrounik.auth.session.v1` |
| Auth pending | `src/lib/storage/auth.ts` | `vandrounik.auth.pending.v1` |
| Email-change pending | `src/lib/storage/auth.ts` | `vandrounik.auth.email-change.v1` |
| Wizard | `src/store/wizard.tsx` | `vandrounik.wizard.v1` |
| Generation | `src/lib/storage/generation.ts` | `vandrounik.generation.v3` |
| Saved trips | `src/lib/storage/trips.ts` | `vandrounik.trips.v1` (status + per-trip `visitedPlaceIds`) |
| Visited | `src/lib/storage/visited.ts` | global places for Profile; also updated on trip mark |
| Avatar helpers | `src/lib/profile/avatar.ts` | presets + resize |

CTA «Подобрать маршрут» needs origin + destination (coords) + ≥1 interest. Duration optional.

## Adding a screen checklist

1. Decide overlay vs full page vs sheet vs root tab.
2. Add path in [`src/routes.tsx`](../../../src/routes.tsx) if deep-link needed.
3. Root tabs go under `TabShell`; plan overlays stay in `Plan.tsx`, profile settings overlays in `Profile.tsx`.
4. Reuse `Screen`, `Header`, `TabBar`, `SlideOverlay`, `BottomSheet`, `PrimaryButton`.
5. Document: `docs/ui/screens/…`, row in `docs/ui/figma-nodes.md`, Figma node if known.
6. Update README flow table if it is a user-facing step.

## Do not

- Invent parallel navigators or duplicate wizard state in component-local storage for fields already on the wizard.
- Break deep links by forgetting `replace: true` URL sync.
- Show TabBar on overlays, loading, or auth.
- Put new hub widgets outside the existing E1 padding/gap conventions without updating docs.

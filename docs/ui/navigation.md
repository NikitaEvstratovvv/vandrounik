# Navigation

Router: [`src/routes.tsx`](../../src/routes.tsx).  
Hub + overlays: [`src/pages/Plan.tsx`](../../src/pages/Plan.tsx).  
Tab shell: [`src/components/TabShell.tsx`](../../src/components/TabShell.tsx).

## Flow (v1)

```
A0 Auth email (/)
  → A1 Auth code (/auth/code)
      → TabShell (RequireAuth)
          ├── E1 Создать (/plan)          + TabBar
          ├── E5 Trips (/trips)           + TabBar
          │     └── E6 trip route  SlideOverlay  /trips/:tripId
          └── E8 Profile (/profile)       + TabBar
                ├── Settings   SlideOverlay  /profile/settings
                ├── Photo      SlideOverlay  /profile/settings/photo  (zIndex 16)
                ├── Name       SlideOverlay  /profile/settings/name   (zIndex 16)
                └── Email      SlideOverlay  /profile/settings/email… (zIndex 16; code/done = content fade)
                E1 overlays (no TabBar):
                ├── S1  Location     SlideOverlay  /plan/location?point=origin|destination
                ├── S2  Interests    SlideOverlay  /plan/interests
                ├── BS1 Duration     BottomSheet   local state (no URL)
                └── L1  Loading      full page     /plan/loading  (вне TabShell)
                      → E2 Results   SlideOverlay  /plan/results
                          → sheet preview → Сохранить
                          → E4 Saved   SlideOverlay /plan/results/saved?id=
                          → E3 Detail  SlideOverlay /plan/results/:variantId  (deep-link; not select path)

Google (mock) с любого auth-экрана → /plan
```


## Tab bar

- Figma: [`271:1300`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=271-1300)
- Tabs: Создать `/plan` · Мои маршруты `/trips` · Профиль `/profile`
- Visible only when pathname is exactly one of those three roots **and** hub has not forced hide (Plan/Profile/Trips overlays / duration sheet).
- Auth, `/plan/loading`, `/plan/*` overlays, `/trips/:tripId`, and `/profile/*` nested settings: no bar.


## Routes

| Path | Element | Notes |
|------|---------|-------|
| `/` | `AuthEmailPage` | Entry; email error under field (Figma 320:1734) |
| `/auth/code` | `AuthCodePage` | Needs pending email; then session → `/plan` |
| `/plan` | `Plan` inside `TabShell` + `RequireAuth` | Hub + TabBar |
| `/plan/interests` | child of Plan | Opens interests overlay; no TabBar |
| `/plan/location` | child of Plan | Query `?point=origin\|destination` |
| `/plan/results` | child of Plan | Results overlay |
| `/plan/results/saved` | child of Plan | Route saved success (`?id=`); zIndex 16 |
| `/plan/results/:variantId` | child of Plan | Route detail overlay (zIndex 16; deep-link) |
| `/plan/loading` | `Loading` + `RequireAuth` | Full-screen generation; no TabShell |
| `/trips` | `Trips` | TabBar; empty or list of saved trips |
| `/trips/:tripId` | child of Trips | E6 trip manage SlideOverlay; no TabBar |
| `/profile` | `Profile` | TabBar; hub E8 + settings stack overlays |
| `/profile/settings` | child of Profile | Settings SlideOverlay; no TabBar |
| `/profile/settings/photo` | child of Profile | Photo SlideOverlay (zIndex 16) |
| `/profile/settings/name` | child of Profile | Name SlideOverlay (zIndex 16) |
| `/profile/settings/email` | child of Profile | Email SlideOverlay (zIndex 16) |
| `/profile/settings/email/code` | child of Profile | Same overlay; step fade |
| `/profile/settings/email/done` | child of Profile | Same overlay; success fade |
| `/results`, `/results/:variantId` | redirects | Legacy → `/plan/results…` |

Child routes under `/plan` and `/profile` have **no separate page elements** — they exist for deep-link / URL sync. `Plan` / `Profile` read `location.pathname` and toggle overlay open state.

## Overlay pattern

1. User action sets local `*Open` state → `SlideOverlay` mounts / animates in.
2. `onEntered` → `navigate(..., { replace: true })` to the matching URL (if not already there).
3. Close → set `*Open` false → on exit animation `onExited` → navigate back to hub (or previous stack level).
4. Hub (`Plan` / `Profile`) calls `useTabChrome().setForceHidden(panelOpen)` so TabBar hides while any panel/sheet is open.

| Overlay | Component | Animate enter |
|---------|-----------|---------------|
| Interests | `InterestsPanel` | yes |
| Location | `LocationPanel` | yes |
| Results | `ResultsPanel` | no (`animateEnter={false}`) |
| Route saved | `RouteSavedPanel` | yes; `zIndex={16}` |
| Route detail | `RouteDetailPanel` | no; `zIndex={16}` |
| Profile settings | `ProfileSettingsPanel` | yes |
| Profile photo / name / email | panels in `Profile` | yes; `zIndex={16}` |

Duration uses `DurationSheet` → `BottomSheet` (sheet from bottom), not `SlideOverlay`.

Profile stack is hosted by [`Profile.tsx`](../../src/pages/Profile.tsx) the same way Plan hosts overlays (`setForceHidden` while open).

## Wizard / storage

| Concern | Module | Key |
|---------|--------|-----|
| Auth session (mock) | `src/lib/storage/auth.ts` | `vandrounik.auth.session.v1` (`displayName`, `avatar`, …) |
| Auth pending email | `src/lib/storage/auth.ts` | `vandrounik.auth.pending.v1` |
| Email-change pending | `src/lib/storage/auth.ts` | `vandrounik.auth.email-change.v1` |
| Wizard form | `src/store/wizard.tsx` | `vandrounik.wizard.v1` |
| Generation result | `src/lib/storage/generation.ts` | `vandrounik.generation.v3` |
| Saved trips | `src/lib/storage/trips.ts` | `vandrounik.trips.v1` |
| Visited places | `src/lib/storage/visited.ts` | (see module) |

CTA «Подобрать маршрут» enabled when `canGenerate`: origin + destination (with coords) + ≥1 interest. Duration optional.

## Adding a new overlay screen

1. Add a child path under `/plan` in `routes.tsx` (if deep-link needed).
2. Render panel inside `Plan` via `SlideOverlay` (or `BottomSheet`).
3. Sync open/close with pathname like existing handlers.
4. Document the screen under `docs/ui/screens/` and add a row to `figma-nodes.md`.

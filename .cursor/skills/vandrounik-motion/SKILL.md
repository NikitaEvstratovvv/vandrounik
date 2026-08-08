---
name: vandrounik-motion
description: >-
  Vandrounik screen and overlay motion using existing CSS/Chakra patterns
  (SlideOverlay, BottomSheet, fades, micro transitions). Use when implementing
  or restyling screens, overlays, sheets, loaders, or when the user mentions
  animation, motion, or transitions.
---

# Vandrounik motion

## Canon

No Framer Motion / extra animation libs. CSS `transition` + occasional
`@keyframes` via Chakra `css` / props only.

| Tier | Duration | Easing | Use |
|------|----------|--------|-----|
| Overlay | `280ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | SlideOverlay, sheets, carousel, chrome fade |
| Micro | `150ms` | default | opacity hover/disabled, border/bg on chips/tabs |
| Fade-in | `200–300ms` | `ease-out` | ephemeral text (`vandr-fade-in`) |
| Emblem | `700ms` frame / `500ms` fade | `ease-in-out` | `EmblemLoader` only |
| Spinner | `0.9s` | `steps(8)` | `Spinner` only |

## Reuse first

| Need | Primitive |
|------|-----------|
| Full-screen stack L→R | `SlideOverlay` |
| Sheet from bottom + dim | `BottomSheet` |
| Dim only | `SheetOverlay` |
| Map place card | `PlacePopover` / `RouteDetailsSheet` |
| Brand loading | `EmblemLoader` |
| Generic busy | `Spinner` |
| Segment thumb | `Segmented` (already animated) |

Do not reimplement overlay enter/exit in a page.

## Overlay recipe (required for new overlays)

Copy the existing pattern from [`SlideOverlay`](../../../src/components/SlideOverlay.tsx) / [`BottomSheet`](../../../src/components/BottomSheet.tsx):

1. State: `visible`, `motionReady`
2. On open: reset → double `requestAnimationFrame` → set both true
3. `transition={motionReady ? TRANSITION : 'none'}`
4. Drive with `transform: translate3d(...)` (prefer) or opacity for dimmers
5. `willChange` on the animated property
6. `onTransitionEnd` filtered by `propertyName` (+ `event.target === currentTarget` for sheets)
7. Keep `pointerEvents` / `aria-hidden` correct during exit
8. Wire `onEntered` / `onExited` for URL sync (see skill `vandrounik-architecture`)

Constants (local to the primitive is fine today):

```ts
const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
```

`animateEnter={false}` when the panel should appear instantly (Results, Route detail) but still animate out.

## Screen checklist (every new / restyled screen)

- [ ] Navigation container uses an existing overlay/sheet (or justified full route)
- [ ] Interactive controls have micro feedback (`opacity` / `border-color` / `background` `150ms`) where peers do
- [ ] If content swaps in place (hints, loader copy), use short `vandr-fade-in` — do not invent new keyframe names unless needed
- [ ] Chrome show/hide uses opacity `280ms` + the same ease (see Results)
- [ ] Loading / brand wait uses `EmblemLoader`, not a custom ornament animation
- [ ] No layout jump without transition when hiding TabBar/chrome

Minimum bar: **do not ship a static screen** if it stacks, sheets, or has primary CTAs — those already have motion in v1 primitives; wire them.

## Anti-patterns

- New animation library
- Spring/bounce/glow by default
- Hardcoded theme colors inside motion styles (use tokens)
- Per-page duplicate of `motionReady` overlay logic when a shared primitive fits
- Staggered list fireworks / hero parallax unless Figma explicitly specifies
- Skipping exit animation when using overlays (breaks `onExited` navigation)

## Coupling

- Layout/tokens: skill `vandrounik-ui`
- Routes/overlays URL sync: skill `vandrounik-architecture` + [docs/ui/navigation.md](../../../docs/ui/navigation.md)

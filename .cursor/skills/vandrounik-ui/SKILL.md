---
name: vandrounik-ui
description: >-
  Pixel-perfect Vandrounik UI from Figma using Chakra tokens and existing
  primitives. Use when the user pastes a Figma URL/node, or when building a
  new product surface with no sibling screen in the app. For finishing an
  existing flow without a Figma frame, use skill vandrounik-compose instead.
---

# Vandrounik UI (Figma → code)

## Canon

| Case | Source of truth |
|------|-----------------|
| Already implemented (v1) | Code + [docs/ui/](../../../docs/ui/) |
| Доработка существующего флоу / состояния | Skill `vandrounik-compose` — код + примитивы + ближайший экран. **Не** вызывать Figma MCP |
| New product surface (no sibling, e.g. E7) or user pasted a Figma node | Figma first, then map to tokens/primitives |

Figma: [Vandrounik-design](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=64-208)  
File key: `mAysLALLcMDA07FqvFno5B`

## Workflow

If this is an existing-flow extension without a Figma URL, stop and follow skill `vandrounik-compose`.

1. Find node in [docs/ui/figma-nodes.md](../../../docs/ui/figma-nodes.md) (or user URL → convert `node-id=137-204` → `137:204`).
2. Load Figma design-to-code skill, then call `get_design_context` / `get_screenshot` for that `fileKey` + `nodeId`.
3. Treat MCP output as a **reference**, not final code — adapt to this codebase.
4. Map colors/type/radii/shadows to [docs/ui/design-tokens.md](../../../docs/ui/design-tokens.md) / [`src/theme/system.ts`](../../../src/theme/system.ts).
5. Reuse primitives from [docs/ui/components/index.md](../../../docs/ui/components/index.md).
6. Apply motion — follow skill `vandrounik-motion` (overlays, fades, micro transitions). Do not ship static screens that stack/sheet/CTA without wiring existing motion.
7. Export new assets to `public/figma/` and list them in [docs/ui/assets.md](../../../docs/ui/assets.md).
8. Update screen doc + `figma-nodes.md` status when shipping.

## Hard rules

- **No hardcoded theme colors** (`#171717`, `#e5e5e5`, …) in `src/components` / `src/pages` — use tokens (`primary`, `line`, `muted`, …).
- **No inventing radii/shadows** — use `card`, `sheet`, `pill`, `btn`, `lg`, `btn`, … or extend `system.ts` + design-tokens.md.
- Fonts: `body` (Inter) / `heading` (Oswald) only.
- Mobile-first; design frames are ~360×800. App uses full viewport (`Screen` / `100dvh`), not a forced phone shell in CSS.
- Prefer existing `PrimaryButton`, `Header`, `Screen`, `SlideOverlay`, `BottomSheet`, widgets — do not clone one-off CTAs.

## Allowed exceptions

- `rgba(...)` for frost/blur overlays when no token exists (see map frost / splash). Document if reused.
- Emblem loader may use explicit muted gray matching Figma ornament — prefer token `muted` when possible.

## Architecture / motion coupling

New screens that change navigation must follow skill `vandrounik-architecture` and [docs/ui/navigation.md](../../../docs/ui/navigation.md).

Motion (enter/exit, chrome fade, micro feedback) must follow skill `vandrounik-motion` — reuse `SlideOverlay` / `BottomSheet` / existing timings; no new animation libraries.

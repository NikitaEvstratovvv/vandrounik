# UI recipes

Layout patterns to copy when composing without a Figma frame. Tokens: [design-tokens.md](design-tokens.md). Primitives: [components/index.md](components/index.md).

If a sibling screen already exists, copy its padding/gap from code. Do not invent a second scale.

## Shared density

| Token / value | Use |
|---------------|-----|
| `16px` page padding and hub gap | E1, overlays, sheets |
| `Header` `h=80` `px=16` `py=20` `gap=12` | All headers |
| `PrimaryButton` `h=48` `radius.card` | Primary / secondary CTA |
| Search / duration field `h=48` `radius.pill` `border=line` | S1, BS1 |
| List row gap `8px`, divider `1px` `line` | S1 results |
| Screen titles Oswald `title` (28) | Overlay / tab titles |
| Sheet titles Oswald `sheetTitle` (24) uppercase | Bottom sheets |

Fonts: `body` Inter, `heading` Oswald. Colors: `primary` / `primaryFg` / `muted` / `line` / `screen` / `destructive`.

## Hub tab

**Neighbors:** E1 Plan, E5 Trips, E8 Profile.

- `Screen` + `Header` (`main` logo on E1; `title` on E5).
- Content column: `px=16`, vertical `gap=16`.
- Footer CTA sits above TabBar when the hub has a generate/create action.
- TabBar only on exact `/plan`, `/trips`, `/profile`.

## Overlay form

**Neighbors:** S1 Location, S2 Interests, profile settings.

- Host in hub via `SlideOverlay` (URL sync — skill `vandrounik-architecture`).
- `Header` `back` + Oswald title. No TabBar.
- Body `px=16`. Optional sticky footer `p=16` + `PrimaryButton`.
- Focus the first field after `onEntered` (see S1 `focusSeq`).

## Search + list

**Neighbor:** S1 `Location.tsx`.

- Pill field: icon 24 left `11px`, clear `CloseCircleIcon` right when query ≠ ''.
- Placeholder `muted` `sm`. Focus border `primary`.
- Idle / nothing / error: centered column `gap=16`, illustration 160 + caption `sm` (~160px wide).
  - Idle: `/figma/illustration.png`
  - Nothing / error: `/figma/nothing-found.png`
- Loading: `EmblemLoader` size 64, same centered slot — not a custom spinner.
- Results: title `sm semibold` `primary`, subtitle `xs` `muted`, `py=5`, hover opacity `0.7`, `line` between rows.

## Bottom sheet

**Neighbor:** BS1 `DurationSheet.tsx`.

- `BottomSheet` (`flush` or `inset`).
- Header row `p=16` `gap=16`: Oswald `sheetTitle` uppercase + `SquareButton` close.
- Body `px=16` `gap=16`. Footer `p=16` + `PrimaryButton`.
- Inputs reuse the pill field (not a new control).

## Empty / success

**Neighbors:** E5 empty, E4 saved, profile name/email success.

- Centered illustration from `public/figma/` (reuse stork / nothing-found — do not add a new asset unless none fits).
- One short sentence. CTA: `PrimaryButton` and optional `secondary`.
- Success overlays stack with `zIndex={16}` when they sit above another overlay (E4, profile steps).

## Settings row

**Neighbor:** `ProfileNavRow` in `ProfileChrome.tsx`.

- Full-width row + chevron. Do not invent a new list-item component.
- Field errors: `destructive` text under the field (A0), never a tooltip.

## States

| State | Pattern |
|-------|---------|
| Brand wait | `EmblemLoader` (L1, S1 search) |
| Generic busy | `Spinner` only if the neighbor already uses it |
| Empty | Illustration + muted/primary caption + optional CTA |
| Inline error | Red pill border + `destructive` under field (A0) |
| Disabled CTA | `PrimaryButton disabled` — same size, no extra chrome |

## Copy

Short, on «ты», product not marketing. Mirror the neighbor screen. Examples already in app: «Ничего не найдено», «Пока еще нет созданных маршрутов», «Укажите место, откуда хотите начать поездку».

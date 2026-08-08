# Design tokens

Source of truth in code: [`src/theme/system.ts`](../../src/theme/system.ts).  
Map frost styles: [`src/theme/mapOverlay.ts`](../../src/theme/mapOverlay.ts).

Figma file: `mAysLALLcMDA07FqvFno5B` (variables extracted via `get_variable_defs`).

Use **semantic token names** in JSX (`bg="primary"`, `borderRadius="card"`). Do not hardcode hex for theme colors, radii, or shadows.

## Colors

| Token | Value | Figma / notes |
|-------|-------|---------------|
| `background` | `#ffffff` | `--background` |
| `foreground` | `#0a0a0a` | `--foreground` |
| `primary` | `#171717` | `--primary` |
| `primaryFg` | `#fafafa` | `--primary-foreground` |
| `secondary` | `#f5f5f5` | `--secondary` / `--accent` |
| `secondaryFg` | `#0a0a0a` | `--secondary-foreground` |
| `muted` | `#737373` | `--muted-foreground` |
| `line` | `#e5e5e5` | `--border` |
| `destructive` | `#dc2626` | `--destructive` (auth validation) |
| `screen` | `#f6f6f6` | Frame / screen canvas |
| `canvas` | `#000000` | Desktop letterbox outside app |

Global body: `bg=canvas`, `color=foreground`, `fontFamily=body`.

## Fonts

| Token | Value |
|-------|-------|
| `body` | Inter, system-ui, … |
| `heading` | Oswald, system-ui, … |

Loaded in [`index.html`](../../index.html) (Inter 400/500/600, Oswald 400/600/700).

## Font sizes

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 12px | Captions |
| `sm` | 14px | Secondary labels |
| `base` | 16px | Body / CTA |
| `title` | 28px | Screen titles (Oswald) |
| `sheetTitle` | 24px | Bottom sheet title |
| `wordmark` | 48px | Splash wordmark |
| `tagline` | 18px | Splash tagline |

## Line heights

| Token | Value |
|-------|-------|
| `xs` | 16px |
| `sm` | 20px |
| `base` | 24px |
| `title` | 36px |

## Font weights

| Token | Value |
|-------|-------|
| `normal` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |

## Radii

| Token | Value | Use |
|-------|-------|-----|
| `checkbox` / `sm` | 6px | Checkboxes |
| `btn` | 10px | Square 36px buttons |
| `seg` | 16px | Active segmented control |
| `card` | 20px | Cards / primary CTA |
| `sheet` | 24px | Bottom sheet top corners / active tab item |
| `tab` | 28px | Bottom tab bar pill (Figma 271:1247) |
| `pill` | 32px | Search / duration inputs |
| `full` | 999px | Pills |

## Shadows

| Token | Value | Use |
|-------|-------|-----|
| `xs` | `0px 1px 2px rgba(0,0,0,0.1)` | Light elevation |
| `tab` | `0px 1px 3px rgba(0,0,0,0.1)` | Bottom tab bar |
| `lg` | shadow-lg stack | E2 cards, popovers |
| `btn` | `0px 1px 1px rgba(0,0,0,0.1)` | Primary button, active segment |
| `check` | `0px 1.25px 2.5px rgba(0,0,0,0.1)` | Selected checkbox |

## Map frost (non-token)

In [`mapOverlay.ts`](../../src/theme/mapOverlay.ts): `blur(12px)` with gradient mask on top/bottom bars (Figma `215:908` / `215:913`). Prefer `mapFrostedGradientLayer` over legacy `mapFrostedBarStyle`.

## Allowed exceptions

Occasional `rgba(...)` for overlays/blur (splash frosted bar, map frost) is OK when no semantic token exists. Prefer documenting new cases here if repeated.

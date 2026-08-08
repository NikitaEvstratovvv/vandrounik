# Assets (`public/figma/`)

Static UI assets served at `/figma/…`.

## Present

| File | Used by |
|------|---------|
| `splash.png` | Auth screens background (ex-Splash) |
| `google.svg` | Google sign-in icon (remix/google) |
| `google.png` | Figma raster export of remix/google (backup) |
| `tab-plus.svg` | Tab bar plus glyph export (inline `PlusIcon` preferred) |
| `tab-route.svg` | Tab bar route glyph export (inline `RouteIcon` preferred) |
| `tab-user.svg` | Tab bar user glyph export (inline `UserIcon` preferred) |
| `logo.svg` | `Header` (main) |
| `emblem-frame-1.svg` … `emblem-frame-4.svg` | `EmblemLoader` animation |
| `loading.svg` | loading / spinner contexts |
| `nothing-found.png` | `Location` empty search |
| `illustration.png` | `Location` idle illustration |
| `emblem.png` | (available; prefer frame SVGs for animation) |
| `avatars/stork.png` … `mouse.png` | Profile preset avatars (7) |
| `success-check.png` | Name / email change success art |
| `route-saved-stork.png` | E4 route saved + E6 trip completed illustration |
| `trips-empty-stork.png` | E5 empty state stork (Figma 302:1178) |
| `arrow-right-long.svg` | E5 trip card A→B glyph export (inline `ArrowRightLong` preferred) |
| `map-yandex.svg` | Yandex Maps chip icon (Figma 272:1107) |
| `map-google.svg` | Google Maps chip icon (Figma 272:1108) |

## Conventions

- Export new raster/SVG from Figma into `public/figma/` with kebab-case names.
- Prefer SVG for logos/icons; PNG for photos/illustrations.
- Reference as `/figma/<filename>` (Vite `public/`).

## Gaps / notes

- No known missing referenced assets as of this write-up (PNG + SVG set present on disk).
- If a code path references a file that is not listed above, add it here in the same PR.

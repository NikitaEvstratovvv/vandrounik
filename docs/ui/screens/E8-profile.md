# E8 — Профиль

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Profile.tsx`](../../../src/pages/Profile.tsx) |
| Route | `/profile` (+ TabBar) |
| Figma | [`308:2061`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=308-2061) |
| Section | [`304:2279`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=304-2279) |

## Layout

- No logo header (Figma header opacity 0) — 80px spacer.
- Avatar 128px circle from session (`avatarSrc`).
- Display name: Oswald 20 uppercase; email muted `sm`.
- Stat tiles: «Посещено мест» ← `loadVisitedPlaceIds().size`; «Создано маршрутов» ← `loadGeneration() ? 1 : 0`.
- Row «Настройки» → `/profile/settings`.
- Text CTA «Выйти из аккаунта» → `clearSession` + `/`.

## Nested settings (SlideOverlay stack, no TabBar)

Hosted by `Profile.tsx` (Plan-style overlays + URL sync). Motion: skill `vandrounik-motion`.

| Screen | Route | Panel | Figma | Motion |
|--------|-------|-------|-------|--------|
| Settings | `/profile/settings` | `ProfileSettingsPanel` | `350:2045` / filled [`351:2148`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=351-2148) | Slide in/out; Имя/Почта show session values under labels |
| Photo | `/profile/settings/photo` | `ProfilePhotoPanel` | `351:2207` / `351:2310` | Slide `zIndex={16}`; avatar micro `150ms` |
| Name | `/profile/settings/name` | `ProfileNamePanel` | `350:2088` → success `350:2114` | Slide `zIndex={16}`; success fade |
| Email | `/profile/settings/email` | `ProfileEmailPanel` | `332:1568` | Slide `zIndex={16}` |
| Email code | `/profile/settings/email/code` | same panel, step `code` | `332:1642` | Content `vandr-fade-in` |
| Email done | `/profile/settings/email/done` | same panel, step `done` | `332:1673` | Success fade |

Hub: content enter fade `280ms`; logout opacity `150ms`.

Session fields: `displayName`, `avatar` (`preset` \| `custom` data URL) in `src/lib/storage/auth.ts`. Trash icons not rendered.

## Photo rules

- 7 presets in `public/figma/avatars/` + upload (`PlusIcon`).
- Grid: 4 equal columns (`1fr`), gap `16px`, cells `aspect-ratio: 1` (Figma `351:2207`).
- Selected = 3px `foreground` ring (transparent border when idle so size stays stable).
- Uploaded custom: photo + `canvas` overlay @ 30% + centered white `PenIcon` 20px (Figma `351:2328`); tap reopens file picker.
- Save disabled until draft ≠ session avatar; custom images resized ~256px JPEG.

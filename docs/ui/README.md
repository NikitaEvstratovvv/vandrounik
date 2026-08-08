# UI spec (Vandrounik)

Implementation spec for the PWA UI. Lives next to the code so agents and PRs stay in sync.

## Links

| Resource | URL |
|----------|-----|
| Figma | [Vandrounik-design](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=64-208) |
| File key | `mAysLALLcMDA07FqvFno5B` |
| Repo | https://github.com/NikitaEvstratovvv/vandrounik |

## Canon rules

1. **Implemented screens (v1)** — source of truth is the code + this folder (`docs/ui/`).
2. **New or redesigned screens** — start from Figma (`get_design_context` / screenshot), then map to Chakra tokens and existing primitives.
3. Do not invent a second token set; extend [`src/theme/system.ts`](../../src/theme/system.ts) when Figma introduces new variables.

## Index

| Doc | Purpose |
|-----|---------|
| [design-tokens.md](design-tokens.md) | Colors, type, radii, shadows |
| [navigation.md](navigation.md) | Routes, overlays, deep links |
| [figma-nodes.md](figma-nodes.md) | Screen / component → Figma node ID |
| [assets.md](assets.md) | Files under `public/figma/` |
| [screens/](screens/) | Per-screen notes (A0–A1 auth, E1–E6, E8 profile + settings, S1–S2, BS1, L1) |
| [components/index.md](components/index.md) | Reusable UI primitives |

## Related

- App flow overview: [README.md](../../README.md)
- POI / routing data: [docs/DATA-POI.md](../DATA-POI.md)
- Agent skills: `.cursor/skills/vandrounik-ui`, `.cursor/skills/vandrounik-architecture`

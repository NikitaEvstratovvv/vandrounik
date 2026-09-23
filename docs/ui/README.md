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
2. **Extend an existing flow** (missing state, extra field, same-pattern overlay) — compose from the nearest screen + [recipes.md](recipes.md). Do not open Figma. Skill: `vandrounik-compose`. Status in [figma-nodes.md](figma-nodes.md): `composed` until a node exists.
3. **New product surface** with no sibling (e.g. catalog E7), or the user pasted a Figma URL — start from Figma (`get_design_context` / screenshot), then map to Chakra tokens and existing primitives. Skill: `vandrounik-ui`.
4. Do not invent a second token set; extend [`src/theme/system.ts`](../../src/theme/system.ts) when a new value is needed.

## Index

| Doc | Purpose |
|-----|---------|
| [design-tokens.md](design-tokens.md) | Colors, type, radii, shadows |
| [recipes.md](recipes.md) | Layout patterns to copy when composing without Figma |
| [navigation.md](navigation.md) | Routes, overlays, deep links |
| [figma-nodes.md](figma-nodes.md) | Screen / component → Figma node ID |
| [assets.md](assets.md) | Files under `public/figma/` |
| [screens/](screens/) | Per-screen notes (A0–A1 auth, E1–E6, E8 profile + settings, S1–S2, BS1, L1) |
| [components/index.md](components/index.md) | Reusable UI primitives |

## Related

- App flow overview: [README.md](../../README.md)
- POI / routing data: [docs/DATA-POI.md](../DATA-POI.md)
- Agent skills: `.cursor/skills/vandrounik-compose`, `.cursor/skills/vandrounik-ui`, `.cursor/skills/vandrounik-architecture`

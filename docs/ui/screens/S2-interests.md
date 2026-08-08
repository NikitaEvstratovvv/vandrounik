# S2 — Interests

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Interests.tsx`](../../../src/pages/Interests.tsx) (`InterestsPanel`) |
| Route | `/plan/interests` |
| Figma | [`147:667`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=147-667) |

## Behavior

- Multi-select of **5** categories from [`src/data/interests.ts`](../../../src/data/interests.ts): estates, castles, temples, reserves, dots.
- Titles match Figma; descriptions in code.
- Persist via wizard `setInterests`.

## Components

- `Header` back, checkbox rows (`radius.checkbox`, `shadow.check`), `PrimaryButton` confirm

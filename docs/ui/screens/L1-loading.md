# L1 — Loading

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Loading.tsx`](../../../src/pages/Loading.tsx) |
| Route | `/plan/loading` |
| Figma | [`149:838`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=149-838) |

## Behavior

- Full-screen generation (OSRM + POI selection).
- On success → `/plan/results` with generation stored.
- Uses `EmblemLoader` (muted `#737373` / token `muted` ornament vs black on splash).

## Related

- Routing details: [docs/DATA-POI.md](../../DATA-POI.md)

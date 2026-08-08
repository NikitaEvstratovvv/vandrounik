# A1 — Auth code

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Auth.tsx`](../../../src/pages/Auth.tsx) (`AuthCodePage`) |
| Route | `/auth/code` |
| Figma | [`332:1521`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=332-1521) |

## Behavior

- Requires pending email from A0; otherwise → `/`.
- Hint «Введите код из письма», field «Код».
- Mock: код ≥4 символов → session → `/plan` (шага username нет).
- Google (mock) → session → `/plan`.

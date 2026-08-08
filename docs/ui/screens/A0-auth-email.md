# A0 — Auth email

| | |
|--|--|
| Status | `implemented` |
| Code | [`src/pages/Auth.tsx`](../../../src/pages/Auth.tsx) (`AuthEmailPage`) |
| Route | `/` |
| Figma default | [`320:1635`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=320-1635) |
| Figma error | [`320:1711`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=320-1711) / field [`320:1734`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=320-1734) |
| Section | [`304:2246`](https://www.figma.com/design/mAysLALLcMDA07FqvFno5B/Vandrounik-design?node-id=304-2246) |

## Behavior

- Splash background + frosted card: wordmark, email, «Войти», Google.
- Invalid email → red pill border + red text under field (no tooltip): «Используйте латиницу, цифры, точку и дефис».
- Valid email → pending → `/auth/code`.
- Google (mock) → session → `/plan`.

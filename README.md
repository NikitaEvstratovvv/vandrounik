# Vandrounik

PWA для планирования автопутешествий по Беларуси: генерация маршрутов и трекер «был здесь».

Реализация flow создания маршрута по макетам Figma и спекам из `Design Process/projects/Vandrounik/05-ui/`.

## Стек

- React 19 + TypeScript
- Vite
- Chakra UI v3 (кастомная тема в `src/theme/system.ts`)
- React Router v7

## Запуск

```bash
npm install
npm run dev
```

Открыть `http://localhost:5173`. Базовый viewport — 360×800 (Android baseline); на десктопе экран центрируется как «телефон».

## Скрипты

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Dev-сервер Vite |
| `npm run build` | Type-check (`tsc -b`) + production-сборка |
| `npm run lint` | ESLint |
| `npm run preview` | Превью production-сборки |

## Реализованный flow

```
E0 Splash (/)
  → E1 Хаб (/plan)
      ├── S1 Выбор направления (/plan/location?point=origin|destination)
      ├── S2 Что посмотреть      (/plan/interests)
      ├── BS1 Длительность        (bottom sheet поверх /plan)
      └── L1 Загрузка             (/plan/loading) → E2 (заглушка, /results)
```

### Экраны

| Экран | Файл | Назначение |
|-------|------|-----------|
| E0 | `src/pages/Splash.tsx` | Загрузка PWA, авто-переход на /plan |
| E1 | `src/pages/Plan.tsx` | Хаб: режим, направление, интересы, длительность, CTA |
| S1 | `src/pages/Location.tsx` | Поиск направления (states: empty/loading/results/nothing) |
| S2 | `src/pages/Interests.tsx` | Выбор категорий (checkbox cards) |
| BS1 | `src/components/DurationSheet.tsx` | Длительность (часы / км) |
| L1 | `src/pages/Loading.tsx` | Спиннер + анимированный текст |
| E2 | `src/pages/ResultsStub.tsx` | Заглушка (не спроектирован в Figma) |

### Состояние

Параметры мастера хранятся в `src/store/wizard.tsx` (React Context + reducer) с персистом в `localStorage`.

## Дизайн-токены

См. `src/theme/system.ts` — соответствуют `05-ui/design-tokens.md` (палитра, типографика, радиусы, тени).

## Не реализовано (out of scope текущего flow)

- E2 Результаты, E3 Детали маршрута (не спроектированы в Figma)
- Реальная карта (Яндекс JS API), реальная генерация и API
- Поиск мест — мок-данные (`src/data/places.ts`)

---
name: vandrounik-compose
description: >-
  Extends existing Vandrounik flows by composing screens and states from
  shipped primitives, tokens, and the nearest implemented screen. Use when
  finishing a flow, adding a missing state, empty/error/success UI, or
  designing without a Figma frame. Skip Figma MCP unless the user pastes a
  node URL or the surface has no sibling in the app.
---

# Vandrounik compose (без Figma)

## Когда этот скилл, а не vandrounik-ui

| Задача | Скилл |
|--------|--------|
| Доделать шаг или состояние в существующем флоу | **этот** |
| Новый экран того же паттерна (ещё один overlay, sheet, список) | **этот** |
| Пользователь дал Figma URL / node | `vandrounik-ui` |
| Нет соседнего экрана в приложении (E7 Каталог и т.п.) | `vandrounik-ui` |

**Запрет:** не вызывать `get_design_context` / `get_screenshot` / `get_metadata` на compose-задаче.

## Workflow

1. Найти **ближайший экран** в том же флоу (`docs/ui/navigation.md`, `docs/ui/screens/`).
2. Прочитать его код и screen-doc — отступы, header, footer, empty/error. Не угадывать 12 vs 16.
3. Собрать из [docs/ui/recipes.md](../../../docs/ui/recipes.md) и [docs/ui/components/index.md](../../../docs/ui/components/index.md).
4. Токены — [docs/ui/design-tokens.md](../../../docs/ui/design-tokens.md) / `src/theme/system.ts`. Новый hex → новый токен, не в JSX.
5. Навигация — скилл `vandrounik-architecture`. Motion — `vandrounik-motion`.
6. Copy — короткий тон соседнего экрана (на «ты», без маркетинга).
7. Документировать: `docs/ui/screens/…`, строка в `figma-nodes.md` со статусом `composed` (без выдуманного node).

## Выбор оболочки

| Нужно | Примитив |
|-------|----------|
| Полноэкранный шаг поверх хаба | `SlideOverlay` + `Header` `back` / `title` |
| Короткий выбор | `BottomSheet` |
| Корневой таб | `Screen` + `Header` + TabBar |
| Ожидание бренда | `EmblemLoader` |
| CTA | `PrimaryButton` (`primary` / `secondary`) |
| 36×36 иконка | `SquareButton` |
| Переключатель | `Segmented` |

Не клонировать одноразовые кнопки и хедеры.

## Примеры

- Тип объекта в результатах S1 → сосед `Location.tsx`: title `sm semibold` + subtitle `xs muted`, разделитель `line`.
- «Отправили код на {email}» на A1 → сосед `Auth.tsx`: primary `sm` под заголовком, без нового баннера.
- Empty для нового списка → сосед E5: иллюстрация из `public/figma/` + короткий текст + `PrimaryButton`.

## Чеклист

- [ ] Есть сосед-референс в коде (файл + что скопировали)
- [ ] Нет новых цветов / радиусов / теней вне токенов
- [ ] Empty / error / loading / disabled как у соседа
- [ ] Overlay / sheet / CTA с motion из `vandrounik-motion`
- [ ] Статус `composed` в docs, не выдуманный Figma node

# База точек маршрута (POI)

## Структура

| Файл | Роль |
|---|---|
| `src/data/place-taxonomy.json` | Канон: `type` → interest, typeGroup, цвета маркеров |
| `src/data/placeTaxonomy.ts` | Хелперы таксономии для приложения |
| `src/data/interests.ts` | 5 категорий фильтра S2 «Что посмотреть» |
| `src/data/routePlaces.ts` | Объединяет seed и OSM-данные в `ROUTE_PLACES` |
| `src/data/belarus-osm-places.json` | Точки из Overpass (вся Беларусь) |
| `scripts/data/belarus-osm-raw.json` | Сырой ответ Overpass для проверки |
| `src/lib/geocoding/photon.ts` | Поиск «Откуда» / «Куда» через Photon (префикс от 3 символов) |
| `src/lib/geocoding/beRu.ts` | Варианты запроса ru↔be и локализация подписей в русский |
| `src/lib/routing/osrm.ts` | Дорожный маршрут и geometry через OSRM |

## Категории интересов (фильтр S2)

| ID | Название | OSM-теги (основные) |
|---|---|---|
| `estates` | Усадьбы | `historic=manor` |
| `castles` | Замки | `historic=castle`, `castle_type=*` |
| `temples` | Храмы | `building=cathedral/church/chapel/monastery`, `amenity=place_of_worship` |
| `reserves` | Заповедники | `boundary=national_park`, `leisure=nature_reserve`, `boundary=protected_area` + `protect_class=1–6` |
| `dots` | ДОТы | `historic=bunker`, `military=bunker`, `man_made=bunker`, `building=bunker` |

## Группы типов (typeGroup)

Промежуточный слой между interest и подписью `type` в UI:

| interest | typeGroup | typeGroupLabel | type |
|---|---|---|---|
| castles | fortresses | Крепости | Замок |
| estates | manors | Поместья | Усадьба |
| estates | palaces | Дворцы | Дворец |
| temples | christian | Христианские храмы | Храм, Собор, Монастырь |
| temples | jewish | Синагоги | Синагога |
| temples | muslim | Мечети | Мечеть |
| reserves | national_parks | Национальные парки | Нац. парк |
| reserves | nature_reserves | Заповедники и заказники | Заповедник |
| dots | dots | ДОТы | ДОТ |

Кухня и прочие категории намеренно исключены из Overpass-выгрузки.

## Обновить базу POI

```bash
npm run import:osm-belarus
```

Скрипт обращается к `https://overpass-api.de/api/interpreter`, сохраняет сырые данные в `scripts/data/belarus-osm-raw.json` и обновляет `src/data/belarus-osm-places.json`.

При timeout странового запроса скрипт последовательно выгружает области и г. Минск, затем мержит результаты.

Для бункеров без `name` в OSM генерируется fallback: `ДОТ (lat, lng)` или `ДОТ {ref}`.

После выполнения рекомендуется вручную проверить 10–15 точек на соответствие координат.

Превью фото для карточек мест:

```bash
npm run enrich:place-images
```

Скрипт пишет `imageUrl` в `belarus-osm-places.json` из OSM Commons-тегов, Wikidata P18 и (fallback) Wikipedia summary. Без фото блок картинки в UI не показывается.

## Контракт поиска мест

Единые правила для любого UI, где пользователь ищет точку на карте Беларуси (S1 «Откуда»/«Куда», будущие каталог / тап на карте / геолокация).

**Публичный API для страниц:** только [`searchPlaces`](../src/data/places.ts) из `@/data/places`. Не вызывать `@/lib/geocoding/photon` или `routePlacesSearch` напрямую из UI. Reverse geocode (карта, «моё местоположение») должен возвращать тот же тип [`Place`](../src/types/index.ts) и те же правила подписи.

| Правило | Детали |
|---|---|
| Вход | Строка ≥3 символов; для «Куда» опционально `near` (bias + расстояние в UI) |
| Источники | Photon (`/api/photon`, bbox Беларуси) + локальный `ROUTE_PLACES` |
| Язык | ru↔be в [`beRu.ts`](../src/lib/geocoding/beRu.ts): варианты запроса и локализация подписей |
| Фильтр Photon | `place` / `highway` / `railway` / `boundary` / `waterway` + `building` с улицей и номером; без магазинов/кафе |
| Ранг | Населённые пункты выше улиц; сильные совпадения POI сверху |
| Дедуп | По `title\|subtitle` и близости ~200 м |
| Подсказка | `title` + `subtitle`: `Тип · город, область` (тип только если уверенный: Город, Улица, Река…); POI — тип из каталога; для «Куда» UI добавляет `· N км` |

Сейчас контракт использует только S1 ([`Location.tsx`](../src/pages/Location.tsx)).

## Построение маршрута

Точки «Откуда» / «Куда» задаются через контракт выше. Генератор выбирает POI из локальной базы `ROUTE_PLACES` по выбранным интересам и близости к коридору A→B, затем строит дорожный маршрут через публичный OSRM demo server.

На карте E2/E3 маркеры POI окрашиваются по `primaryInterest`; старт и финиш — нейтральные.

Публичные Photon / OSRM имеют rate limits и подходят для разработки. Для production потребуется собственный инстанс или коммерческий routing/geocoding provider.

## Лицензия данных OSM

Данные OpenStreetMap распространяются под лицензией **ODbL**.  
При показе точек в приложении необходимо указывать: `© OpenStreetMap`.  
Атрибуция уже присутствует в `InteractiveRouteMap.tsx`.

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
| `src/lib/geocoding/nominatim.ts` | Поиск «Откуда» / «Куда» через Nominatim |
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

## Построение маршрута

Пользовательские точки «Откуда» и «Куда» геокодируются через Nominatim (`countrycodes=by`).  
Генератор выбирает POI из локальной базы `ROUTE_PLACES` по выбранным интересам и близости к коридору A→B, затем строит дорожный маршрут через публичный OSRM demo server.

На карте E2/E3 маркеры POI окрашиваются по `primaryInterest`; старт и финиш — нейтральные.

Публичные Nominatim / OSRM имеют rate limits и подходят для разработки. Для production потребуется собственный инстанс или коммерческий routing/geocoding provider.

## Лицензия данных OSM

Данные OpenStreetMap распространяются под лицензией **ODbL**.  
При показе точек в приложении необходимо указывать: `© OpenStreetMap`.  
Атрибуция уже присутствует в `InteractiveRouteMap.tsx`.

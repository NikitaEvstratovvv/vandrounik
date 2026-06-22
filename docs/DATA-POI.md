# База точек маршрута (POI)

## Структура

| Файл | Роль |
|---|---|
| `src/data/routePlaces.ts` | Объединяет seed и OSM-данные в `ROUTE_PLACES` |
| `src/data/belarus-osm-places.json` | Точки из Overpass (вся Беларусь) |
| `scripts/data/belarus-osm-raw.json` | Сырой ответ Overpass для проверки |
| `src/lib/geocoding/nominatim.ts` | Поиск «Откуда» / «Куда» через Nominatim |
| `src/lib/routing/osrm.ts` | Дорожный маршрут и geometry через OSRM |

## Категории

| ID | Название | OSM-теги |
|---|---|---|
| `castles` | Замки | `historic=castle`, `castle_type=*` |
| `estates` | Усадьбы | `historic=manor` |
| `temples` | Храмы | `building=cathedral/church/chapel/monastery`, `amenity=place_of_worship` |
| `reserves` | Заповедники | `boundary=national_park`, `leisure=nature_reserve`, `boundary=protected_area` + `protect_class=1–6` |

Кухня и прочие категории намеренно исключены из Overpass-выгрузки.

## Обновить базу POI

```bash
npm run import:osm-belarus
```

Скрипт обращается к `https://overpass-api.de/api/interpreter`, сохраняет сырые данные в `scripts/data/belarus-osm-raw.json` и обновляет `src/data/belarus-osm-places.json`.

При timeout странового запроса скрипт последовательно выгружает области и г. Минск, затем мержит результаты.

После выполнения рекомендуется вручную проверить 10–15 точек на соответствие координат.

## Построение маршрута

Пользовательские точки «Откуда» и «Куда» геокодируются через Nominatim (`countrycodes=by`).  
Генератор выбирает POI из локальной базы `ROUTE_PLACES` по выбранным интересам и близости к коридору A→B, затем строит дорожный маршрут через публичный OSRM demo server.

Публичные Nominatim / OSRM имеют rate limits и подходят для разработки. Для production потребуется собственный инстанс или коммерческий routing/geocoding provider.

## Лицензия данных OSM

Данные OpenStreetMap распространяются под лицензией **ODbL**.  
При показе точек в приложении необходимо указывать: `© OpenStreetMap`.  
Атрибуция уже присутствует в `InteractiveRouteMap.tsx`.

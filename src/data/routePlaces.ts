import type { RoutePlace } from '@/types'
import { enrichRoutePlace } from '@/data/placeTaxonomy'
import osmPlaces from '@/data/belarus-osm-places.json'

/** Seed-точки (куратированные). */
const SEED_PLACES_RAW: Omit<RoutePlace, 'typeGroup' | 'typeGroupLabel'>[] = [
  {
    id: 'mir',
    name: 'Мирский замок',
    type: 'Замок',
    lat: 53.4514,
    lng: 26.473,
    interests: ['estates', 'castles'],
    description:
      'Мирский замок — памятник архитектуры XVI века и объект Всемирного наследия ЮНЕСКО. Комплекс включает жилой корпус, башни, фортификационные сооружения и живописный прудовый парк в городе Мир.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%9C%D0%B8%D1%80%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mir%20Castle%202018.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'nesvizh',
    name: 'Несвижский дворец',
    type: 'Дворец',
    lat: 53.2226,
    lng: 26.6912,
    interests: ['estates'],
    description:
      'Несвижский дворец — резиденция рода Радзивиллов, один из первых дворцов в стиле ренессанса в Восточной Европе. В ансамбль входят дворец, городская ратуша, костёл и обширный ландшафтный парк.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%9D%D0%B5%D1%81%D0%B2%D0%B8%D0%B6%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Niasvi%C5%BE%20Castle%2C%20courtyard.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'lida',
    name: 'Лидский замок',
    type: 'Замок',
    lat: 53.8883,
    lng: 25.2997,
    interests: ['castles'],
    description:
      'Лидский замок XIV века — один из старейших каменных замков Великого княжества Литовского. Сохранились стены с башнями и внутренний двор, откуда открывается вид на исторический центр Лиды.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%9B%D0%B8%D0%B4%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Lida_Castle.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'novogrudok',
    name: 'Новогрудский замок',
    type: 'Замок',
    lat: 53.5942,
    lng: 25.8191,
    interests: ['castles'],
    description:
      'Руины Новогрудского замка на Замковой горе — одна из древнейших точек Беларуси. С высоты открывается панорама города, а рядом проходят туристические маршруты по историческому центру.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%9D%D0%BE%D0%B2%D0%BE%D0%B3%D1%80%D1%83%D0%B4%D1%81%D0%BA%D0%B8%D0%B9_%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Navahrudak_Castle.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'slutsk',
    name: 'Костёл Святого Антония',
    type: 'Храм',
    lat: 53.0279,
    lng: 27.5497,
    interests: ['temples'],
    description:
      'Костёл Святого Антония в Слуцке — барочный храм с выразительным фасадом и богатым внутренним убранством. Один из главных архитектурных символов города и остановка на маршрутах по Минской области.',
    source: 'seed',
  },
  {
    id: 'grodno',
    name: 'Старый замок в Гродно',
    type: 'Замок',
    lat: 53.6778,
    lng: 23.829,
    interests: ['castles', 'temples'],
    description:
      'Старый замок в Гродно — резиденция польских королей и важный оборонительный объект на Немане. Сегодня здесь музей, а рядом — Новый замок и историческая застройка центра города.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%A1%D1%82%D0%B0%D1%80%D1%8B%D0%B9_%D0%B7%D0%B0%D0%BC%D0%BE%D0%BA_(%D0%93%D1%80%D0%BE%D0%B4%D0%BD%D0%BE)',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Old_Castle_in_Hrodna.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'braslav',
    name: 'Браславские озёра',
    type: 'Заповедник',
    lat: 55.6406,
    lng: 27.0469,
    interests: ['reserves'],
    description:
      'Браславские озёра — крупнейший национальный парк Беларуси с сотнями озёр, сосновыми лесами и смотровыми точками. Популярное место для однодневных поездок на природу и фотопрогулок.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%9D%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9_%D0%BF%D0%B0%D1%80%D0%BA_%C2%AB%D0%91%D1%80%D0%B0%D1%81%D0%BB%D0%B0%D0%B2%D1%81%D0%BA%D0%B8%D0%B5_%D0%BE%D0%B7%D1%91%D1%80%D0%B0%C2%BB',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Braslau_Lakes_National_Park.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'belovezh',
    name: 'Беловежская пуща',
    type: 'Заповедник',
    lat: 52.5719,
    lng: 23.8,
    interests: ['reserves'],
    description:
      'Беловежская пуща — древний лесной массив и объект Всемирного наследия ЮНЕСКО. Здесь можно увидеть зубров, пройти экологические тропы и посетить музей природы.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%91%D0%B5%D0%BB%D0%BE%D0%B2%D0%B5%D0%B6%D1%81%D0%BA%D0%B0%D1%8F_%D0%BF%D1%83%D1%89%D0%B0',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bia%C5%82owie%C5%BCa_National_Park.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'polotsk',
    name: 'Софийский собор',
    type: 'Собор',
    lat: 55.4869,
    lng: 28.7686,
    interests: ['temples'],
    description:
      'Софийский собор в Полоцке — один из первых каменных храмов Древней Руси. В ансамбль входят колокольня и музей, а рядом находятся другие памятники древней столицы Полоцкого княжества.',
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/%D0%A1%D0%BE%D1%84%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80_(%D0%9F%D0%BE%D0%BB%D0%BE%D1%86%D0%BA)',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/St_Sophia_Cathedral_in_Polotsk.jpg?width=640',
    source: 'seed',
  },
  {
    id: 'dot-grodno-fort',
    name: 'ДОТ у форта №1',
    type: 'ДОТ',
    lat: 53.7265,
    lng: 23.9128,
    interests: ['dots'],
    description:
      'Долговременная огневая точка в районе Гродненского укрепрайона — пример полевого фортификационного сооружения времён Второй мировой войны.',
    source: 'seed',
  },
  {
    id: 'dot-astalovichi',
    name: 'ДОТ у Астоловичей',
    type: 'ДОТ',
    lat: 53.5284,
    lng: 25.7651,
    interests: ['dots'],
    description:
      'Сохранившийся бункер на маршруте между Гродно и Минском — ориентир для маршрутов по военной истории региона.',
    source: 'seed',
  },
]

const SEED_PLACES: RoutePlace[] = SEED_PLACES_RAW.map((place) => enrichRoutePlace(place))

function mergePlaces(primary: RoutePlace[], fallback: RoutePlace[]): RoutePlace[] {
  const byId = new Map<string, RoutePlace>()
  for (const place of primary) byId.set(place.id, place)
  for (const place of fallback) {
    if (!byId.has(place.id)) byId.set(place.id, place)
  }
  return [...byId.values()]
}

function normalizeOsmPlace(place: RoutePlace): RoutePlace {
  return enrichRoutePlace({
    ...place,
    interests: place.interests ?? [],
  })
}

// OSM-места идут первыми — актуальная база по всей Беларуси.
// Seed-места добавляются как дополнение, если точки нет в OSM.
export const ROUTE_PLACES: RoutePlace[] = mergePlaces(
  (osmPlaces as RoutePlace[]).map((p) => normalizeOsmPlace({ ...p, source: 'osm' as const })),
  SEED_PLACES,
)

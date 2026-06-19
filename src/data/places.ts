import type { Place } from '@/types'

/**
 * Мок-данные для поиска направлений (S1).
 * v1: локальный seed; позже — Яндекс Search API / OSM.
 */
const PLACES: Place[] = [
  { id: 'grodno', title: 'Гродно', subtitle: 'Гродненская область', distanceKm: 104.45 },
  { id: 'grodno-bus', title: 'Автовокзал Гродно', subtitle: 'Остановка общественного транспорта', distanceKm: 105.1 },
  { id: 'sovetskaya', title: 'Советская улица', subtitle: 'Гродно', distanceKm: 104.0 },
  { id: 'grodno-airport', title: 'Международный аэропорт Гродно', subtitle: 'Гродненский район', distanceKm: 118.7 },
  { id: 'grodno-rail', title: 'Железнодорожный вокзал Гродно', subtitle: 'улица Будённого, 37', distanceKm: 104.9 },
  { id: 'lenin-square', title: 'Площадь Ленина', subtitle: 'Гродно', distanceKm: 104.2 },
  { id: 'minsk', title: 'Минск', subtitle: 'Минская область', distanceKm: 0 },
  { id: 'mir', title: 'Мирский замок', subtitle: 'Мир, Гродненская область', distanceKm: 94.3 },
  { id: 'nesvizh', title: 'Несвижский замок', subtitle: 'Несвиж, Минская область', distanceKm: 112.0 },
  { id: 'brest', title: 'Брест', subtitle: 'Брестская область', distanceKm: 346.0 },
  { id: 'vitebsk', title: 'Витебск', subtitle: 'Витебская область', distanceKm: 280.0 },
  { id: 'gomel', title: 'Гомель', subtitle: 'Гомельская область', distanceKm: 302.0 },
]

/** Имитация сетевого поиска с задержкой. */
export function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim().toLowerCase()
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!q) {
        resolve([])
        return
      }
      resolve(PLACES.filter((p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)))
    }, 450)
  })
}

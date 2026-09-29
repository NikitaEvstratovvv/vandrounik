import { haversineKm } from '@/lib/geo/distance'
import {
  isStrongPoiMatch,
  searchRoutePlacesLocal,
} from '@/lib/geocoding/routePlacesSearch'
import { searchPlaces as searchPhoton } from '@/lib/geocoding/photon'
import type { LatLng, Place } from '@/types'

const RESULT_LIMIT = 8
/** Treat as same map point when merging Photon + POI hits. */
const DEDUPE_KM = 0.2

function labelKey(place: Place): string {
  return `${place.title}|${place.subtitle}`
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

function isDuplicate(a: Place, b: Place): boolean {
  if (labelKey(a) === labelKey(b)) return true
  return haversineKm(a, b) < DEDUPE_KM
}

/**
 * Canonical place search for any UI (S1 origin/destination, future catalog / map / geolocation).
 * Combines Photon (cities, streets, addresses in Belarus) with the local POI catalog
 * (`ROUTE_PLACES`: castles, temples, estates, reserves, DOTs).
 * Pages must import this — not `@/lib/geocoding/photon` or `routePlacesSearch` directly.
 * See docs/DATA-POI.md «Контракт поиска мест».
 */
export async function searchPlaces(
  query: string,
  options: { near?: LatLng; signal?: AbortSignal } = {},
): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const [geo, pois] = await Promise.all([
    searchPhoton(q, options),
    Promise.resolve(searchRoutePlacesLocal(q)),
  ])

  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  const strongPois = pois.filter((p) => isStrongPoiMatch(p, q))
  const weakPois = pois.filter((p) => !isStrongPoiMatch(p, q))

  const out: Place[] = []

  const push = (place: Place) => {
    if (out.some((existing) => isDuplicate(existing, place))) return
    out.push(place)
  }

  // Strong POI hits first (e.g. «Мирский замок»), then geo, then weaker POIs.
  for (const place of strongPois) push(place)
  for (const place of geo) push(place)
  for (const place of weakPois) push(place)

  return out.slice(0, RESULT_LIMIT)
}

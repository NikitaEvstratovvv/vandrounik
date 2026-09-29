import { ROUTE_PLACES } from '@/data/routePlaces'
import { expandQuery } from '@/lib/geocoding/beRu'
import type { Place, RoutePlace } from '@/types'

const MIN_QUERY_LENGTH = 3
const MAX_POI_RESULTS = 5

type ScoredPoi = Place & { _score: number }

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[«»""]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreName(name: string, variants: string[]): number {
  const n = normalize(name)
  const words = n.split(/[\s/|,.—–-]+/).filter(Boolean)
  let best = 99

  for (const variant of variants) {
    const q = normalize(variant)
    if (q.length < MIN_QUERY_LENGTH) continue
    if (n === q) best = Math.min(best, 0)
    else if (n.startsWith(q)) best = Math.min(best, 1)
    else if (words.some((w) => w.startsWith(q))) best = Math.min(best, 2)
    else if (q.length >= 5 && n.includes(q)) best = Math.min(best, 4)
  }

  return best
}

function toPlace(place: RoutePlace, score: number): ScoredPoi {
  return {
    id: `poi:${place.id}`,
    title: place.name,
    subtitle: place.type,
    lat: place.lat,
    lng: place.lng,
    _score: score,
  }
}

/**
 * Search curated / OSM POI catalog for S1 origin-destination suggestions.
 * Matches on place name only (not description).
 */
export function searchRoutePlacesLocal(query: string): Place[] {
  const q = query.trim()
  if (q.length < MIN_QUERY_LENGTH) return []

  const variants = expandQuery(q)
  const scored: ScoredPoi[] = []

  for (const place of ROUTE_PLACES) {
    const score = scoreName(place.name, variants)
    if (score >= 99) continue
    scored.push(toPlace(place, score))
  }

  scored.sort(
    (a, b) => a._score - b._score || a.title.localeCompare(b.title, 'ru'),
  )

  return scored.slice(0, MAX_POI_RESULTS).map(({ _score: _, ...place }) => place)
}

/** Exact / prefix POI matches (for merge priority). */
export function isStrongPoiMatch(place: Place, query: string): boolean {
  const score = scoreName(place.title, expandQuery(query.trim()))
  return score <= 2
}

import { ROUTE_PLACES } from '@/data/routePlaces'
import type { Place, RoutePlace } from '@/types'

const MIN_QUERY_LENGTH = 3
const MAX_POI_RESULTS = 5

type ScoredPoi = Place & { _score: number }

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[«»""']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreName(name: string, query: string): number {
  const n = normalize(name)
  const q = normalize(query)
  if (q.length < MIN_QUERY_LENGTH) return 99

  const words = n.split(/[\s/|,.—–-]+/).filter(Boolean)
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (words.some((w) => w.startsWith(q))) return 2
  if (q.length >= 5 && n.includes(q)) return 4
  return 99
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
 * Matches on place name only (not description). Catalog names are Russian.
 */
export function searchRoutePlacesLocal(query: string): Place[] {
  const q = query.trim()
  if (q.length < MIN_QUERY_LENGTH) return []

  const scored: ScoredPoi[] = []

  for (const place of ROUTE_PLACES) {
    const score = scoreName(place.name, q)
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
  return scoreName(place.title, query.trim()) <= 2
}

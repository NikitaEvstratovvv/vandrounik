import { haversineKm } from '@/lib/geo/distance'
import type { LatLng, Place } from '@/types'

const SEARCH_ENDPOINT = '/api/nominatim/search'
const MIN_QUERY_LENGTH = 3
const MIN_REQUEST_INTERVAL_MS = 1100
const FETCH_LIMIT = 20
const RESULT_LIMIT = 8

/** Drop shops/cafes/services; keep places, streets, addresses, waterways, stations. */
const BLOCKED_CATEGORIES = new Set(['shop', 'craft', 'amenity'])

type NominatimAddress = {
  house_number?: string
  road?: string
  pedestrian?: string
  suburb?: string
  neighbourhood?: string
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
  country_code?: string
}

type NominatimResult = {
  place_id: number
  osm_type?: string
  osm_id?: number
  lat: string
  lon: string
  name?: string
  display_name: string
  category?: string
  type?: string
  class?: string
  /** jsonv2: city / town / village / road / … — more reliable than category for settlements. */
  addresstype?: string
  address?: NominatimAddress
}

type RankedPlace = Place & { _rank: number }

const cache = new Map<string, Place[]>()
let lastRequestAt = 0
let requestQueue: Promise<void> = Promise.resolve()

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
}

function runRateLimited<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  const run = requestQueue.then(async () => {
    throwIfAborted(signal)
    const elapsed = Date.now() - lastRequestAt
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await wait(MIN_REQUEST_INTERVAL_MS - elapsed)
    }
    throwIfAborted(signal)
    lastRequestAt = Date.now()
    return task()
  })
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function categoryOf(result: NominatimResult): string {
  return (result.category ?? result.class ?? '').trim().toLowerCase()
}

function typeOf(result: NominatimResult): string {
  return (result.type ?? '').trim().toLowerCase()
}

function addressTypeOf(result: NominatimResult): string {
  return (result.addresstype ?? '').trim().toLowerCase()
}

function settlementName(address?: NominatimAddress): string | undefined {
  if (!address) return undefined
  return (
    address.city?.trim() ||
    address.town?.trim() ||
    address.village?.trim() ||
    address.hamlet?.trim() ||
    address.municipality?.trim() ||
    undefined
  )
}

function roadName(address?: NominatimAddress): string | undefined {
  return address?.road?.trim() || address?.pedestrian?.trim() || undefined
}

/** Human-readable object kind for S1 subtitle — only confident labels. */
export function objectTypeLabel(result: NominatimResult): string | undefined {
  const category = categoryOf(result)
  const value = typeOf(result)
  const addressType = addressTypeOf(result)
  const kind = addressType || value

  if (kind === 'city' || kind === 'town') return 'Город'
  if (kind === 'village' || kind === 'hamlet') return 'Деревня'
  if (kind === 'locality' || kind === 'isolated_dwelling') return 'Населённый пункт'
  if (kind === 'suburb' || kind === 'neighbourhood' || kind === 'quarter') return 'Район'
  if (category === 'waterway' || kind === 'river' || kind === 'stream') return 'Река'
  if (category === 'railway' || kind === 'station' || kind === 'halt') return 'Станция'
  if (category === 'highway' && (kind === 'bus_stop' || kind === 'platform')) return 'Остановка'
  if (category === 'highway' || kind === 'road') return 'Улица'
  if (kind === 'state') return 'Область'
  if (kind === 'county') return 'Район'
  // building / house / unknown — omit type rather than guess «Адрес»
  return undefined
}

function buildSubtitle(result: NominatimResult, title: string): string {
  const type = objectTypeLabel(result)
  const settlement = settlementName(result.address)
  const state = result.address?.state?.trim()

  const locationParts: string[] = []
  if (settlement && settlement !== title) locationParts.push(settlement)
  if (state && state !== title && state !== settlement) locationParts.push(state)

  const location = locationParts.join(', ')
  if (type && location) return `${type} · ${location}`
  if (type) return type
  return location
}

function typeRank(result: NominatimResult): number {
  const category = categoryOf(result)
  const value = typeOf(result)
  const addressType = addressTypeOf(result)
  const kind = addressType || value

  if (kind === 'city' || kind === 'town') return 0
  if (kind === 'village' || kind === 'hamlet' || kind === 'locality' || kind === 'isolated_dwelling')
    return 1
  if (kind === 'suburb' || kind === 'neighbourhood' || kind === 'quarter') return 2
  if (category === 'place') return 3
  if (category === 'highway' || category === 'railway' || kind === 'road') return 10
  if (category === 'waterway') return 11
  if (kind === 'state' || kind === 'county') return 12
  if (category === 'boundary' && !addressType) return 12
  if (category === 'building' || value === 'house' || value === 'apartments' || value === 'yes') return 13
  return 14
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleFormsForMatch(title: string): string[] {
  const normalized = normalizeForMatch(title)
  const withoutStreetType = normalized.replace(
    /^(улица|переулок|проспект|площадь|шоссе|кольцо)\s+/i,
    '',
  )
  return normalized === withoutStreetType
    ? [normalized]
    : [normalized, withoutStreetType]
}

/** Lower is better: exact title = 0, prefix = 2, contains = 8, none = 20. */
function matchScore(title: string, query: string): number {
  const forms = titleFormsForMatch(title)
  const q = normalizeForMatch(query)
  if (!q) return 20
  let best = 20
  for (const form of forms) {
    if (form === q) best = Math.min(best, 0)
    else if (form.startsWith(q)) best = Math.min(best, 2)
    else if (q.length > 3 && form.includes(q)) best = Math.min(best, 8)
    else if (q.length > 3 && form.split(/\s+/).some((w) => w.startsWith(q))) best = Math.min(best, 4)
  }
  return best
}

function isBlocked(result: NominatimResult): boolean {
  const category = categoryOf(result)
  if (BLOCKED_CATEGORIES.has(category)) return true
  // Keep building/house with street+number; drop bare POI buildings without address.
  return false
}

function buildTitle(result: NominatimResult): string {
  const road = roadName(result.address)
  const house = result.address?.house_number?.trim()
  const category = categoryOf(result)
  const value = typeOf(result)
  const isAddressHit =
    Boolean(road && house) &&
    (category === 'building' ||
      value === 'house' ||
      value === 'apartments' ||
      value === 'yes' ||
      value === 'residential')

  // Prefer «улица Суворова, 15» over generic building names («Многоквартирный дом 15»).
  if (isAddressHit && road && house) {
    return `${road}, ${house}`
  }

  const name = result.name?.trim()
  if (name) return name

  if (road) {
    return house ? `${road}, ${house}` : road
  }

  return (
    settlementName(result.address) ||
    result.address?.state?.trim() ||
    result.display_name.split(',')[0]?.trim() ||
    ''
  )
}

function mapResult(result: NominatimResult, query: string): RankedPlace | null {
  if (isBlocked(result)) return null

  const country = result.address?.country_code?.trim().toLowerCase()
  if (country && country !== 'by') return null

  const lat = Number(result.lat)
  const lng = Number(result.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const title = buildTitle(result)
  if (!title) return null

  const osmType = result.osm_type ?? 'node'
  const osmId = result.osm_id ?? result.place_id
  const rank = typeRank(result) * 20 + matchScore(title, query)

  return {
    id: `osm:${osmType}:${osmId}`,
    title,
    subtitle: buildSubtitle(result, title),
    lat,
    lng,
    _rank: rank,
  }
}

function placeLabelKey(place: Pick<Place, 'title' | 'subtitle'>): string {
  return `${place.title}|${place.subtitle}`
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeByLabel(places: RankedPlace[]): RankedPlace[] {
  const byLabel = new Map<string, RankedPlace>()
  for (const place of places) {
    const key = placeLabelKey(place)
    const prev = byLabel.get(key)
    if (!prev || place._rank < prev._rank) {
      byLabel.set(key, place)
    }
  }
  return [...byLabel.values()]
}

function rankResults(results: NominatimResult[], query: string): RankedPlace[] {
  const byId = new Map<string, RankedPlace>()

  for (const result of results) {
    const place = mapResult(result, query)
    if (!place) continue
    const prev = byId.get(place.id)
    if (!prev || place._rank < prev._rank) {
      byId.set(place.id, place)
    }
  }

  return dedupeByLabel([...byId.values()])
    .sort((a, b) => a._rank - b._rank || a.title.localeCompare(b.title, 'ru'))
    .slice(0, RESULT_LIMIT)
}

function stripRank(places: RankedPlace[]): Place[] {
  return places.map(({ _rank: _, ...place }) => place)
}

/** Exported for tests. */
export function mapNominatimResults(
  results: NominatimResult[],
  queryForRank = '',
): Place[] {
  return stripRank(rankResults(results, queryForRank))
}

export async function searchPlaces(
  query: string,
  options: { near?: LatLng; signal?: AbortSignal } = {},
): Promise<Place[]> {
  const q = query.trim()
  if (q.length < MIN_QUERY_LENGTH) return []

  throwIfAborted(options.signal)

  const nearKey = options.near
    ? `|${options.near.lat.toFixed(2)},${options.near.lng.toFixed(2)}`
    : ''
  const cacheKey = `${q.toLowerCase()}${nearKey}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  return runRateLimited(async () => {
    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      addressdetails: '1',
      'accept-language': 'ru',
      countrycodes: 'by',
      limit: String(FETCH_LIMIT),
    })

    if (options.near) {
      // Soft bias: viewbox around near point (~50 km), without hard restrict.
      const { lat, lng } = options.near
      const d = 0.45
      params.set('viewbox', `${lng - d},${lat + d},${lng + d},${lat - d}`)
    }

    const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
      signal: options.signal,
    })
    if (!response.ok) {
      throw new Error('Не удалось найти место')
    }

    const data = (await response.json()) as NominatimResult[]
    let ranked = rankResults(Array.isArray(data) ? data : [], q)

    if (options.near) {
      const near = options.near
      ranked = [...ranked].sort((a, b) => {
        const bandA = Math.floor(a._rank / 20)
        const bandB = Math.floor(b._rank / 20)
        if (bandA !== bandB) return bandA - bandB
        return haversineKm(near, a) - haversineKm(near, b)
      })
    }

    const places = stripRank(ranked)
    cache.set(cacheKey, places)
    return places
  }, options.signal)
}

/** Clears in-memory search cache (tests). */
export function clearNominatimCache(): void {
  cache.clear()
  lastRequestAt = 0
}

import { haversineKm } from '@/lib/geo/distance'
import { expandQuery, localizeLabel } from '@/lib/geocoding/beRu'
import type { LatLng, Place } from '@/types'

const SEARCH_ENDPOINT = '/api/photon'
const MIN_QUERY_LENGTH = 3
const MIN_REQUEST_INTERVAL_MS = 1100
const RESULT_LIMIT = 8
/** Belarus bbox: minLon,minLat,maxLon,maxLat (Photon). */
const BELARUS_BBOX = '23.178,51.262,32.777,56.172'

/** Keep origin/destination-like hits; drop shops/cafes named «Мин*». */
const ALLOWED_OSM_KEYS = new Set(['place', 'highway', 'railway', 'boundary', 'waterway'])

type PhotonProperties = {
  osm_id?: number
  osm_type?: string
  osm_key?: string
  osm_value?: string
  type?: string
  name?: string
  street?: string
  housenumber?: string
  city?: string
  town?: string
  village?: string
  locality?: string
  district?: string
  county?: string
  state?: string
  countrycode?: string
}

type PhotonFeature = {
  type: 'Feature'
  geometry?: {
    type: string
    coordinates?: [number, number]
  }
  properties?: PhotonProperties
}

type PhotonResponse = {
  features?: PhotonFeature[]
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

/** Re-export for existing tests. Prefer expandQuery from beRu. */
export { expandQuery as queryVariants } from '@/lib/geocoding/beRu'

function settlementName(props: PhotonProperties): string | undefined {
  return (
    props.city?.trim() ||
    props.town?.trim() ||
    props.village?.trim() ||
    props.locality?.trim() ||
    undefined
  )
}

/** Photon often returns housenumber hits as `building`, not `highway`. */
function isAddressBuilding(osmKey: string, props: PhotonProperties): boolean {
  return (
    osmKey === 'building' &&
    Boolean(props.street?.trim()) &&
    Boolean(props.housenumber?.trim())
  )
}

/** Human-readable object kind for S1 subtitle — only confident labels. */
export function objectTypeLabel(props: PhotonProperties): string | undefined {
  const key = props.osm_key?.trim() ?? ''
  const value = props.osm_value ?? props.type ?? ''

  if (value === 'city' || value === 'town') return 'Город'
  if (value === 'village' || value === 'hamlet') return 'Деревня'
  if (value === 'locality' || value === 'isolated_dwelling') return 'Населённый пункт'
  if (value === 'suburb' || value === 'neighbourhood' || value === 'quarter') return 'Район'
  if (key === 'waterway' || value === 'river' || value === 'stream') return 'Река'
  if (key === 'railway') return 'Станция'
  if (key === 'highway' && (value === 'bus_stop' || value === 'platform')) return 'Остановка'
  if (key === 'highway') return 'Улица'
  if (key === 'boundary' || value === 'state') return 'Область'
  if (value === 'county') return 'Район'
  // building / house / unknown place — omit type rather than guess «Адрес» / «Место»
  return undefined
}

function buildSubtitle(props: PhotonProperties, title: string): string {
  const type = objectTypeLabel(props)
  const settlementRaw = settlementName(props)
  const settlement = settlementRaw ? localizeLabel(settlementRaw) : undefined
  const stateRaw = props.state?.trim()
  const state = stateRaw ? localizeLabel(stateRaw) : undefined

  const locationParts: string[] = []
  if (settlement && settlement !== title) locationParts.push(settlement)
  if (state && state !== title && state !== settlement) locationParts.push(state)

  const location = locationParts.join(', ')
  if (type && location) return `${type} · ${location}`
  if (type) return type
  return location
}

function typeRank(props: PhotonProperties): number {
  const value = props.osm_value ?? props.type ?? ''
  // Settlements first — cities/towns, then villages, then city parts.
  if (value === 'city' || value === 'town') return 0
  if (value === 'village' || value === 'hamlet' || value === 'locality' || value === 'isolated_dwelling')
    return 1
  if (value === 'suburb' || value === 'neighbourhood' || value === 'quarter') return 2
  if (props.osm_key === 'place') return 3
  if (props.osm_key === 'highway' || props.osm_key === 'railway') return 10
  if (props.osm_key === 'waterway') return 11
  if (props.osm_key === 'boundary' || value === 'state' || value === 'county') return 12
  if (props.osm_key === 'building') return 13
  return 14
}

function normalizeForMatch(text: string): string {
  return localizeLabel(text)
    .toLowerCase()
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

function titleMatchesQuery(title: string, variants: string[]): boolean {
  return matchScore(title, variants) < 20
}

/** Lower is better: exact title = 0, prefix = 2, contains = 8, none = 20. */
function matchScore(title: string, variants: string[]): number {
  const forms = titleFormsForMatch(title)
  let best = 20
  for (const variant of variants) {
    const q = normalizeForMatch(variant)
    if (!q) continue
    for (const form of forms) {
      if (form === q) best = Math.min(best, 0)
      else if (form.startsWith(q)) best = Math.min(best, 2)
      else if (q.length > 3 && form.includes(q)) best = Math.min(best, 8)
    }
  }
  return best
}

function mapFeature(feature: PhotonFeature, variants: string[]): RankedPlace | null {
  const props = feature.properties
  const coords = feature.geometry?.coordinates
  if (!props || !coords || coords.length < 2) return null

  const country = props.countrycode?.trim().toLowerCase()
  if (country && country !== 'by') return null

  const osmKey = props.osm_key?.trim()
  if (
    osmKey &&
    !ALLOWED_OSM_KEYS.has(osmKey) &&
    !isAddressBuilding(osmKey, props)
  ) {
    return null
  }

  const [lng, lat] = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const street = props.street?.trim()
  const housenumber = props.housenumber?.trim()
  const name = props.name?.trim()

  let title = name || ''
  if (!title && street) {
    title = housenumber ? `${street}, ${housenumber}` : street
  }
  if (!title) {
    title = settlementName(props) || props.state?.trim() || ''
  }
  if (!title) return null

  const osmType = props.osm_type ?? 'N'
  const osmId = props.osm_id ?? 0
  // type × 20 + match quality: exact city ≈ 0, street prefix ≈ 200+.
  const rank = typeRank(props) * 20 + matchScore(title, variants)
  const localizedTitle = localizeLabel(title)

  return {
    id: `osm:${osmType}:${osmId}`,
    title: localizedTitle,
    subtitle: buildSubtitle(props, localizedTitle),
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

/** Collapse street segments / duplicate Photon hits with the same label. */
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

function rankPhotonFeatures(
  features: PhotonFeature[],
  queryForRank = '',
): RankedPlace[] {
  const variants = expandQuery(queryForRank || 'x')
  const byId = new Map<string, RankedPlace>()

  for (const feature of features) {
    const place = mapFeature(feature, queryForRank ? variants : [''])
    if (!place) continue
    const prev = byId.get(place.id)
    if (!prev || place._rank < prev._rank) {
      byId.set(place.id, place)
    }
  }

  const ranked = dedupeByLabel([...byId.values()]).sort(
    (a, b) => a._rank - b._rank || a.title.localeCompare(b.title, 'ru'),
  )

  const filtered =
    queryForRank && ranked.some((place) => titleMatchesQuery(place.title, variants))
      ? ranked.filter((place) => titleMatchesQuery(place.title, variants))
      : ranked

  return filtered.slice(0, RESULT_LIMIT)
}

function stripRank(places: RankedPlace[]): Place[] {
  return places.map(({ _rank: _, ...place }) => place)
}

/** Exported for tests. */
export function mapPhotonFeatures(
  features: PhotonFeature[],
  queryForRank = '',
): Place[] {
  return stripRank(rankPhotonFeatures(features, queryForRank))
}

async function fetchPhotonQuery(
  q: string,
  options: { near?: LatLng; signal?: AbortSignal },
): Promise<PhotonFeature[]> {
  const params = new URLSearchParams({
    q,
    limit: '20',
    bbox: BELARUS_BBOX,
  })
  if (options.near) {
    params.set('lat', String(options.near.lat))
    params.set('lon', String(options.near.lng))
  }

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error('Не удалось найти место')
  }

  const data = (await response.json()) as PhotonResponse
  return data.features ?? []
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
    const variants = expandQuery(q)
    const featureLists = await Promise.all(
      variants.map((variant) => fetchPhotonQuery(variant, options)),
    )
    let ranked = rankPhotonFeatures(featureLists.flat(), q)
    // Near bias only within the same type/match band — settlements stay first.
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
export function clearPhotonCache(): void {
  cache.clear()
  lastRequestAt = 0
}

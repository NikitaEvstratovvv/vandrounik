import { haversineKm } from '@/lib/geo/distance'
import type { LatLng, Place } from '@/types'

const SEARCH_ENDPOINT = '/api/nominatim/search'
const MIN_REQUEST_INTERVAL_MS = 1100

type NominatimResult = {
  place_id: number
  osm_type?: string
  osm_id?: number
  display_name: string
  name?: string
  lat: string
  lon: string
}

const cache = new Map<string, Place[]>()
let lastRequestAt = 0
let requestQueue: Promise<void> = Promise.resolve()

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function runRateLimited<T>(task: () => Promise<T>): Promise<T> {
  const run = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestAt
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await wait(MIN_REQUEST_INTERVAL_MS - elapsed)
    }
    lastRequestAt = Date.now()
    return task()
  })
  requestQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function mapResult(result: NominatimResult): Place {
  const parts = result.display_name.split(',').map((part) => part.trim()).filter(Boolean)
  const title = result.name?.trim() || parts[0] || result.display_name
  const subtitle = parts.filter((part) => part !== title).slice(0, 3).join(', ')
  const osmType = result.osm_type ?? 'place'
  const osmId = result.osm_id ?? result.place_id

  return {
    id: `osm:${osmType}:${osmId}`,
    title,
    subtitle,
    lat: Number(result.lat),
    lng: Number(result.lon),
  }
}

export async function searchPlaces(
  query: string,
  options: { near?: LatLng } = {},
): Promise<Place[]> {
  const q = query.trim()
  if (!q) return []

  const cacheKey = q.toLowerCase()
  const cached = cache.get(cacheKey)
  const places = cached ?? await runRateLimited(async () => {
    const params = new URLSearchParams({
      q,
      format: 'json',
      addressdetails: '1',
      countrycodes: 'by',
      limit: '8',
    })

    const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Не удалось найти место')
    }

    const data = (await response.json()) as NominatimResult[]
    const mapped = data
      .map(mapResult)
      .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))

    cache.set(cacheKey, mapped)
    return mapped
  })

  if (!options.near) return places

  return places
    .map((place) => ({
      ...place,
      distanceKm: haversineKm(options.near!, place),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
}

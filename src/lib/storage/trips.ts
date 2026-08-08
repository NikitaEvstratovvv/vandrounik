import type { GenerationParams, RouteVariant } from '@/types'
import { apiFetch, getAccessToken } from '@/lib/api/client'
import { markPlaceVisited } from '@/lib/storage/visited'

const STORAGE_KEY = 'vandrounik.trips.v1'

export type TripStatus = 'new' | 'in-progress' | 'completed'

export type SavedTrip = {
  id: string
  variant: RouteVariant
  params: GenerationParams | null
  savedAt: string
  status?: TripStatus
  visitedPlaceIds?: string[]
  updatedAt?: string
}

type ApiTrip = {
  id: string
  status: TripStatus
  visitedPlaceIds: string[]
  variant: RouteVariant
  params: GenerationParams | null
  savedAt: string
  updatedAt: string
}

function isTripStatus(value: unknown): value is TripStatus {
  return value === 'new' || value === 'in-progress' || value === 'completed'
}

function normalizeVisitedIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const ids = value.filter((id): id is string => typeof id === 'string')
  return ids.length > 0 ? ids : []
}

function slimVariant(variant: RouteVariant): RouteVariant {
  return {
    id: variant.id,
    title: variant.title,
    stops: variant.stops,
    totalKm: variant.totalKm,
    totalMinutes: variant.totalMinutes,
    interestLabels: variant.interestLabels,
  }
}

function fromApiTrip(trip: ApiTrip): SavedTrip {
  return {
    id: trip.id,
    variant: trip.variant,
    params: trip.params,
    savedAt: trip.savedAt,
    status: trip.status,
    visitedPlaceIds: trip.visitedPlaceIds ?? [],
    updatedAt: trip.updatedAt,
  }
}

function readTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is SavedTrip =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as SavedTrip).id === 'string' &&
        typeof (item as SavedTrip).savedAt === 'string' &&
        !!(item as SavedTrip).variant,
    )
  } catch {
    return []
  }
}

function writeTrips(trips: SavedTrip[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
    return true
  } catch {
    return false
  }
}

function useRemote(): boolean {
  return Boolean(getAccessToken())
}

function newTripId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cacheUpsert(trip: SavedTrip): void {
  const rest = readTrips().filter((t) => t.id !== trip.id)
  writeTrips([trip, ...rest].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)))
}

function cacheRemove(id: string): void {
  writeTrips(readTrips().filter((t) => t.id !== id))
}

/** Sync read from cache (filled by refreshTrips / mutations). */
export function loadTrips(): SavedTrip[] {
  return readTrips()
}

export async function refreshTrips(): Promise<SavedTrip[]> {
  if (!useRemote()) return readTrips()
  const data = await apiFetch<{ trips: ApiTrip[] }>('/trips')
  const trips = data.trips.map(fromApiTrip)
  writeTrips(trips)
  return trips
}

export async function saveTrip(
  variant: RouteVariant,
  params: GenerationParams | null = null,
): Promise<SavedTrip> {
  if (useRemote()) {
    const created = await apiFetch<ApiTrip>('/trips', {
      method: 'POST',
      body: JSON.stringify({ variant: slimVariant(variant), params }),
    })
    const trip = fromApiTrip(created)
    cacheUpsert(trip)
    return trip
  }

  const existing = readTrips()
  const id = newTripId()
  const base = {
    id,
    params,
    savedAt: new Date().toISOString(),
    status: 'new' as TripStatus,
  }
  const full: SavedTrip = { ...base, variant }
  if (writeTrips([full, ...existing]) && getTrip(id)) return full
  const slim: SavedTrip = { ...base, variant: slimVariant(variant) }
  writeTrips([slim, ...existing])
  return slim
}

export function getTrip(id: string): SavedTrip | null {
  return readTrips().find((t) => t.id === id) ?? null
}

export async function fetchTrip(id: string): Promise<SavedTrip | null> {
  if (!useRemote()) return getTrip(id)
  try {
    const trip = await apiFetch<ApiTrip>(`/trips/${encodeURIComponent(id)}`)
    const saved = fromApiTrip(trip)
    cacheUpsert(saved)
    return saved
  } catch {
    return getTrip(id)
  }
}

export async function deleteTrip(id: string): Promise<boolean> {
  if (useRemote()) {
    try {
      await apiFetch(`/trips/${encodeURIComponent(id)}`, { method: 'DELETE' })
      cacheRemove(id)
      return true
    } catch {
      return false
    }
  }
  const trips = readTrips()
  const next = trips.filter((t) => t.id !== id)
  if (next.length === trips.length) return false
  return writeTrips(next)
}

export async function setTripStatus(id: string, status: TripStatus): Promise<SavedTrip | null> {
  if (useRemote()) {
    const trip = await apiFetch<ApiTrip>(`/trips/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const saved = fromApiTrip(trip)
    cacheUpsert(saved)
    return saved
  }
  const trips = readTrips()
  const index = trips.findIndex((t) => t.id === id)
  if (index < 0) return null
  const updated = { ...trips[index], status }
  const next = [...trips]
  next[index] = updated
  if (!writeTrips(next)) return null
  return updated
}

export function tripStatus(trip: SavedTrip): TripStatus {
  return isTripStatus(trip.status) ? trip.status : 'new'
}

export function tripVisitedIds(trip: SavedTrip): Set<string> {
  return new Set(normalizeVisitedIds(trip.visitedPlaceIds) ?? [])
}

export async function toggleTripVisited(tripId: string, placeId: string): Promise<SavedTrip | null> {
  const trip = getTrip(tripId)
  if (!trip) return null
  const ids = new Set(normalizeVisitedIds(trip.visitedPlaceIds) ?? [])
  if (ids.has(placeId)) ids.delete(placeId)
  else {
    ids.add(placeId)
    await markPlaceVisited(placeId)
  }
  const visitedPlaceIds = [...ids]

  if (useRemote()) {
    const updated = await apiFetch<ApiTrip>(`/trips/${encodeURIComponent(tripId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ visitedPlaceIds }),
    })
    const saved = fromApiTrip(updated)
    cacheUpsert(saved)
    return saved
  }

  const trips = readTrips()
  const index = trips.findIndex((t) => t.id === tripId)
  if (index < 0) return null
  const nextTrip = { ...trips[index], visitedPlaceIds }
  const next = [...trips]
  next[index] = nextTrip
  if (!writeTrips(next)) return null
  return nextTrip
}

export async function cancelTrip(id: string): Promise<SavedTrip | null> {
  if (useRemote()) {
    const trip = await apiFetch<ApiTrip>(`/trips/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'new', visitedPlaceIds: [] }),
    })
    const saved = fromApiTrip(trip)
    cacheUpsert(saved)
    return saved
  }
  const trips = readTrips()
  const index = trips.findIndex((t) => t.id === id)
  if (index < 0) return null
  const updated = { ...trips[index], status: 'new' as TripStatus, visitedPlaceIds: [] }
  const next = [...trips]
  next[index] = updated
  if (!writeTrips(next)) return null
  return updated
}

/** Push local trips/visited to server once per user, then refresh cache. */
export async function syncProfileDataAfterLogin(userId: string): Promise<void> {
  if (!useRemote()) return
  const flagKey = `vandrounik.sync.done.v1.${userId}`
  let already = false
  try {
    already = localStorage.getItem(flagKey) === '1'
  } catch {
    already = false
  }

  if (!already) {
    const localTrips = readTrips()
    if (localTrips.length > 0) {
      await apiFetch<{ trips: ApiTrip[] }>('/trips/import', {
        method: 'POST',
        body: JSON.stringify({
          trips: localTrips.map((t) => ({
            id: t.id,
            status: tripStatus(t),
            visitedPlaceIds: [...tripVisitedIds(t)],
            variant: slimVariant(t.variant),
            params: t.params,
            savedAt: t.savedAt,
          })),
        }),
      })
    }
    const { loadVisitedPlaceIdsLocal, replaceVisitedRemote } = await import('@/lib/storage/visited')
    const localVisited = [...loadVisitedPlaceIdsLocal()]
    if (localVisited.length > 0) {
      await replaceVisitedRemote(localVisited)
    }
    try {
      localStorage.setItem(flagKey, '1')
    } catch {
      // ignore
    }
  }

  await refreshTrips()
  const { refreshVisited } = await import('@/lib/storage/visited')
  await refreshVisited()
}

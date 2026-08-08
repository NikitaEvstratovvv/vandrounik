import type { GenerationParams, RouteVariant } from '@/types'
import { markPlaceVisited } from '@/lib/storage/visited'

const STORAGE_KEY = 'vandrounik.trips.v1'

export type TripStatus = 'new' | 'in-progress' | 'completed'

export type SavedTrip = {
  id: string
  variant: RouteVariant
  params: GenerationParams | null
  savedAt: string
  /** Figma card badge: new (no badge) / in-progress («В пути») / completed («Завершен»). */
  status?: TripStatus
  /** Per-trip «Был здесь» progress (POI placeIds). */
  visitedPlaceIds?: string[]
}

function isTripStatus(value: unknown): value is TripStatus {
  return value === 'new' || value === 'in-progress' || value === 'completed'
}

function normalizeVisitedIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const ids = value.filter((id): id is string => typeof id === 'string')
  return ids.length > 0 ? ids : []
}

/** Drop heavy OSRM polyline so trips fit in localStorage; map falls back to stop line. */
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

/** Returns false if localStorage write failed (quota / private mode). */
function writeTrips(trips: SavedTrip[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
    return true
  } catch {
    return false
  }
}

function updateTrip(id: string, patch: (trip: SavedTrip) => SavedTrip): SavedTrip | null {
  const trips = readTrips()
  const index = trips.findIndex((t) => t.id === id)
  if (index < 0) return null
  const updated = patch(trips[index])
  const next = [...trips]
  next[index] = updated
  if (!writeTrips(next)) return null
  return updated
}

function newTripId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function loadTrips(): SavedTrip[] {
  return readTrips()
}

/**
 * Always appends a new trip (unique id). Slot `variant.id` is kept on the variant only.
 * Пишет в localStorage; при QuotaExceeded повторяет без geometry.
 */
export function saveTrip(variant: RouteVariant, params: GenerationParams | null = null): SavedTrip {
  const existing = readTrips()
  const id = newTripId()
  const base = {
    id,
    params,
    savedAt: new Date().toISOString(),
    status: 'new' as TripStatus,
  }

  const full: SavedTrip = { ...base, variant }
  if (writeTrips([full, ...existing]) && getTrip(id)) {
    return full
  }

  const slim: SavedTrip = { ...base, variant: slimVariant(variant) }
  writeTrips([slim, ...existing])
  return slim
}

export function getTrip(id: string): SavedTrip | null {
  return readTrips().find((t) => t.id === id) ?? null
}

export function deleteTrip(id: string): boolean {
  const trips = readTrips()
  const next = trips.filter((t) => t.id !== id)
  if (next.length === trips.length) return false
  return writeTrips(next)
}

export function setTripStatus(id: string, status: TripStatus): SavedTrip | null {
  return updateTrip(id, (trip) => ({ ...trip, status }))
}

export function tripStatus(trip: SavedTrip): TripStatus {
  return isTripStatus(trip.status) ? trip.status : 'new'
}

export function tripVisitedIds(trip: SavedTrip): Set<string> {
  return new Set(normalizeVisitedIds(trip.visitedPlaceIds) ?? [])
}

/**
 * Toggle per-trip visited. Marking visited also writes to global visited (Profile).
 * Unvisit clears only the trip list — global stays.
 */
export function toggleTripVisited(tripId: string, placeId: string): SavedTrip | null {
  return updateTrip(tripId, (trip) => {
    const ids = new Set(normalizeVisitedIds(trip.visitedPlaceIds) ?? [])
    if (ids.has(placeId)) {
      ids.delete(placeId)
    } else {
      ids.add(placeId)
      markPlaceVisited(placeId)
    }
    return { ...trip, visitedPlaceIds: [...ids] }
  })
}

/** Cancel in-progress trip: status → new, clear trip visited progress. */
export function cancelTrip(id: string): SavedTrip | null {
  return updateTrip(id, (trip) => ({
    ...trip,
    status: 'new',
    visitedPlaceIds: [],
  }))
}

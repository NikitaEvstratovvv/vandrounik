import type { GenerationParams, RouteVariant } from '@/types'

const STORAGE_KEY = 'vandrounik.trips.v1'

export type TripStatus = 'new' | 'in-progress' | 'completed'

export type SavedTrip = {
  id: string
  variant: RouteVariant
  params: GenerationParams | null
  savedAt: string
  /** Figma card badge: new (no badge) / in-progress («В пути») / completed («Завершен»). */
  status?: TripStatus
}

function isTripStatus(value: unknown): value is TripStatus {
  return value === 'new' || value === 'in-progress' || value === 'completed'
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

function writeTrips(trips: SavedTrip[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // localStorage недоступен — игнорируем.
  }
}

export function loadTrips(): SavedTrip[] {
  return readTrips()
}

/** Upsert по variant.id; возвращает сохранённый trip. */
export function saveTrip(variant: RouteVariant, params: GenerationParams | null = null): SavedTrip {
  const existing = readTrips().find((t) => t.id === variant.id)
  const trips = readTrips().filter((t) => t.id !== variant.id)
  const trip: SavedTrip = {
    id: variant.id,
    variant,
    params,
    savedAt: new Date().toISOString(),
    status: existing?.status ?? 'new',
  }
  writeTrips([trip, ...trips])
  return trip
}

export function getTrip(id: string): SavedTrip | null {
  return readTrips().find((t) => t.id === id) ?? null
}

export function setTripStatus(id: string, status: TripStatus): SavedTrip | null {
  const trips = readTrips()
  const index = trips.findIndex((t) => t.id === id)
  if (index < 0) return null
  const updated: SavedTrip = { ...trips[index], status }
  const next = [...trips]
  next[index] = updated
  writeTrips(next)
  return updated
}

export function tripStatus(trip: SavedTrip): TripStatus {
  return isTripStatus(trip.status) ? trip.status : 'new'
}

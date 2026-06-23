import { haversineKm } from '@/lib/geo/distance'
import { fetchTableDistancesMeters, planRoute } from '@/lib/routing/osrm'
import type { Place, Transport } from '@/types'

export const CIRCULAR_ROUTE_THRESHOLD_KM = 0.1

const routeKmCache = new Map<string, number>()

function cacheKey(origin: Place, destination: Place, transport: Transport): string {
  return `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}|${transport}`
}

export function roundRouteKm(distanceKm: number): number {
  return Math.max(1, Math.round(distanceKm))
}

export function isCircularRoute(origin: Place, destination: Place): boolean {
  return haversineKm(origin, destination) <= CIRCULAR_ROUTE_THRESHOLD_KM
}

export async function fetchDirectRouteKm(
  origin: Place,
  destination: Place,
  transport: Transport,
): Promise<number | null> {
  if (isCircularRoute(origin, destination)) {
    return null
  }

  const key = cacheKey(origin, destination, transport)
  const cached = routeKmCache.get(key)
  if (cached !== undefined) {
    return cached
  }

  try {
    const trip = await planRoute([origin, destination], { transport })
    const km = roundRouteKm(trip.distanceKm)
    routeKmCache.set(key, km)
    return km
  } catch {
    const km = roundRouteKm(haversineKm(origin, destination))
    routeKmCache.set(key, km)
    return km
  }
}

/** Дорожные расстояния от origin до каждого места в destinations (OSRM table). */
export async function fetchRoadDistancesFromOrigin(
  origin: Place,
  destinations: Place[],
  transport: Transport,
): Promise<Place[]> {
  if (destinations.length === 0) return []

  try {
    const meters = await fetchTableDistancesMeters([origin, ...destinations], transport)
    return destinations.map((place, index) => ({
      ...place,
      distanceKm: roundRouteKm(meters[index] / 1000),
    }))
  } catch {
    return destinations.map((place) => ({
      ...place,
      distanceKm: roundRouteKm(haversineKm(origin, place)),
    }))
  }
}

export function clearDirectRouteKmCache(): void {
  routeKmCache.clear()
}

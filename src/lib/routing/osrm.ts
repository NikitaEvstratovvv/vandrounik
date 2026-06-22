import type { LatLng } from '@/types'

const OSRM_TRIP_ENDPOINT = '/api/osrm/trip/v1/driving'
const OSRM_ROUTE_ENDPOINT = '/api/osrm/route/v1/driving'
const POLYLINE_PRECISION = 6
const OSRM_TIMEOUT_MS = 18000

type OsrmWaypoint = {
  waypoint_index?: number
}

type OsrmLeg = {
  distance: number
  duration: number
}

type OsrmTrip = {
  distance: number
  duration: number
  geometry: string
  legs: OsrmLeg[]
}

type OsrmTripResponse = {
  code: string
  message?: string
  trips?: OsrmTrip[]
  waypoints?: OsrmWaypoint[]
}

type OsrmRouteResponse = {
  code: string
  message?: string
  routes?: OsrmTrip[]
}

export type PlannedTrip = {
  waypointOrder: number[]
  legMinutes: number[]
  distanceKm: number
  durationMinutes: number
  geometry: LatLng[]
}

function decodePolyline(value: string, precision = POLYLINE_PRECISION): LatLng[] {
  const factor = 10 ** precision
  const coordinates: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < value.length) {
    let result = 0
    let shift = 0
    let byte: number

    do {
      byte = value.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lat += result & 1 ? ~(result >> 1) : result >> 1

    result = 0
    shift = 0

    do {
      byte = value.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    lng += result & 1 ? ~(result >> 1) : result >> 1
    coordinates.push({ lat: lat / factor, lng: lng / factor })
  }

  return coordinates
}

async function fetchWithTimeout(url: string, timeoutMs = OSRM_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('OSRM не ответил вовремя')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

function tripToPlannedRoute(route: OsrmTrip, waypointOrder: number[]): PlannedTrip {
  return {
    waypointOrder,
    legMinutes: route.legs.map((leg) => Math.max(1, Math.round(leg.duration / 60))),
    distanceKm: Math.max(1, Math.round(route.distance / 100) / 10),
    durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    geometry: decodePolyline(route.geometry),
  }
}

export async function planTrip(waypoints: LatLng[], options: { roundtrip?: boolean } = {}): Promise<PlannedTrip> {
  if (waypoints.length < 2) {
    throw new Error('Для построения маршрута нужны минимум две точки')
  }

  const coordinates = waypoints.map((point) => `${point.lng},${point.lat}`).join(';')
  const params = new URLSearchParams({
    geometries: 'polyline6',
    overview: 'full',
    steps: 'false',
    source: 'first',
  })

  if (options.roundtrip) {
    params.set('roundtrip', 'true')
  } else {
    params.set('roundtrip', 'false')
    params.set('destination', 'last')
  }

  const response = await fetchWithTimeout(`${OSRM_TRIP_ENDPOINT}/${coordinates}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('OSRM недоступен')
  }

  const data = (await response.json()) as OsrmTripResponse
  const trip = data.trips?.[0]
  if (data.code !== 'Ok' || !trip || !data.waypoints) {
    throw new Error(data.message || 'Не удалось построить маршрут')
  }

  const waypointOrder = data.waypoints
    .map((waypoint, inputIndex) => ({
      inputIndex,
      order: waypoint.waypoint_index ?? inputIndex,
    }))
    .sort((a, b) => a.order - b.order)
    .map((waypoint) => waypoint.inputIndex)

  return tripToPlannedRoute(trip, waypointOrder)
}

export async function planRoute(waypoints: LatLng[]): Promise<PlannedTrip> {
  if (waypoints.length < 2) {
    throw new Error('Для построения маршрута нужны минимум две точки')
  }

  const coordinates = waypoints.map((point) => `${point.lng},${point.lat}`).join(';')
  const params = new URLSearchParams({
    geometries: 'polyline6',
    overview: 'full',
    steps: 'false',
  })

  const response = await fetchWithTimeout(`${OSRM_ROUTE_ENDPOINT}/${coordinates}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('OSRM недоступен')
  }

  const data = (await response.json()) as OsrmRouteResponse
  const route = data.routes?.[0]
  if (data.code !== 'Ok' || !route) {
    throw new Error(data.message || 'Не удалось построить маршрут')
  }

  return tripToPlannedRoute(route, waypoints.map((_, index) => index))
}

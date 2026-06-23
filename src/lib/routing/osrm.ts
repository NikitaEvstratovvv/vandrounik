import type { LatLng, Transport } from '@/types'
import { minutesForDistanceKm } from '@/lib/transport/speed'

export type OsrmProfile = 'driving' | 'cycling'

const OSRM_TRIP_BASE = '/api/osrm/trip/v1'
const OSRM_ROUTE_BASE = '/api/osrm/route/v1'
const OSRM_TABLE_BASE = '/api/osrm/table/v1'
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

type OsrmTableResponse = {
  code: string
  message?: string
  distances?: number[][]
}

export type PlannedTrip = {
  waypointOrder: number[]
  legMinutes: number[]
  distanceKm: number
  durationMinutes: number
  geometry: LatLng[]
}

export type PlanTripOptions = {
  roundtrip?: boolean
  transport?: Transport
}

export type PlanRouteOptions = {
  transport?: Transport
}

export function osrmProfile(transport: Transport = 'car'): OsrmProfile {
  return transport === 'bike' ? 'cycling' : 'driving'
}

function tripEndpoint(transport: Transport = 'car'): string {
  return `${OSRM_TRIP_BASE}/${osrmProfile(transport)}`
}

function routeEndpoint(transport: Transport = 'car'): string {
  return `${OSRM_ROUTE_BASE}/${osrmProfile(transport)}`
}

function tableEndpoint(transport: Transport = 'car'): string {
  return `${OSRM_TABLE_BASE}/${osrmProfile(transport)}`
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

function legMinutesFromOsrm(leg: OsrmLeg, transport: Transport): number {
  if (transport === 'bike') {
    return minutesForDistanceKm(leg.distance / 1000, transport)
  }
  return Math.max(1, Math.round(leg.duration / 60))
}

export function plannedTripFromOsrmRoute(
  route: OsrmTrip,
  waypointOrder: number[],
  transport: Transport = 'car',
): PlannedTrip {
  const legMinutes = route.legs.map((leg) => legMinutesFromOsrm(leg, transport))
  const durationMinutes =
    transport === 'bike'
      ? Math.max(1, legMinutes.reduce((sum, minutes) => sum + minutes, 0))
      : Math.max(1, Math.round(route.duration / 60))

  return {
    waypointOrder,
    legMinutes,
    distanceKm: Math.max(1, Math.round(route.distance / 100) / 10),
    durationMinutes,
    geometry: decodePolyline(route.geometry),
  }
}

export async function planTrip(waypoints: LatLng[], options: PlanTripOptions = {}): Promise<PlannedTrip> {
  if (waypoints.length < 2) {
    throw new Error('Для построения маршрута нужны минимум две точки')
  }

  const transport = options.transport ?? 'car'
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

  const response = await fetchWithTimeout(`${tripEndpoint(transport)}/${coordinates}?${params.toString()}`)
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

  return plannedTripFromOsrmRoute(trip, waypointOrder, transport)
}

/** Дорожные расстояния (м) от первой точки до каждой из остальных. */
export async function fetchTableDistancesMeters(
  waypoints: LatLng[],
  transport: Transport = 'car',
): Promise<number[]> {
  if (waypoints.length < 2) return []

  const coordinates = waypoints.map((point) => `${point.lng},${point.lat}`).join(';')
  const destinations = waypoints.map((_, index) => index).slice(1).join(';')
  const params = new URLSearchParams({
    sources: '0',
    destinations,
    annotations: 'distance',
  })

  const response = await fetchWithTimeout(`${tableEndpoint(transport)}/${coordinates}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('OSRM недоступен')
  }

  const data = (await response.json()) as OsrmTableResponse
  const row = data.distances?.[0]
  if (data.code !== 'Ok' || !row || row.length !== waypoints.length - 1) {
    throw new Error(data.message || 'Не удалось рассчитать расстояния')
  }

  return row
}

export async function planRoute(waypoints: LatLng[], options: PlanRouteOptions = {}): Promise<PlannedTrip> {
  if (waypoints.length < 2) {
    throw new Error('Для построения маршрута нужны минимум две точки')
  }

  const transport = options.transport ?? 'car'
  const coordinates = waypoints.map((point) => `${point.lng},${point.lat}`).join(';')
  const params = new URLSearchParams({
    geometries: 'polyline6',
    overview: 'full',
    steps: 'false',
  })

  const response = await fetchWithTimeout(`${routeEndpoint(transport)}/${coordinates}?${params.toString()}`)
  if (!response.ok) {
    throw new Error('OSRM недоступен')
  }

  const data = (await response.json()) as OsrmRouteResponse
  const route = data.routes?.[0]
  if (data.code !== 'Ok' || !route) {
    throw new Error(data.message || 'Не удалось построить маршрут')
  }

  return plannedTripFromOsrmRoute(route, waypoints.map((_, index) => index), transport)
}

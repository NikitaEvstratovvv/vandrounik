import type { RouteStop } from '@/types'

export function isRoutePlaceStop(stop: RouteStop): boolean {
  return stop.placeId !== 'origin' && stop.placeId !== 'destination'
}

export function isRouteEndpoint(stop: RouteStop): boolean {
  return stop.placeId === 'origin' || stop.placeId === 'destination'
}

export type StopMarkerColors =
  | { kind: 'endpoint' }
  | { kind: 'poi'; bg: 'primary'; color: 'primaryFg' }

export function stopMarkerColors(stop: RouteStop): StopMarkerColors {
  if (isRouteEndpoint(stop)) {
    return { kind: 'endpoint' }
  }
  return { kind: 'poi', bg: 'primary', color: 'primaryFg' }
}

export function routePlaceStops(stops: RouteStop[]): RouteStop[] {
  return stops.filter(isRoutePlaceStop)
}

export function routePlacesCount(stops: RouteStop[]): number {
  return routePlaceStops(stops).length
}

export function routeStopLabel(stop: RouteStop): string {
  if (stop.placeId === 'origin') return 'Старт'
  if (stop.placeId === 'destination') return 'Финиш'
  return String(stop.order)
}

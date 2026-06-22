import type { RouteStop } from '@/types'

export function isRoutePlaceStop(stop: RouteStop): boolean {
  return stop.placeId !== 'origin' && stop.placeId !== 'destination'
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

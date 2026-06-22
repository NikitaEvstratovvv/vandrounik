import { describe, expect, it } from 'vitest'
import { isRoutePlaceStop, routePlacesCount, routePlaceStops, routeStopLabel } from './routeStops'
import type { RouteStop } from '@/types'

const stops: RouteStop[] = [
  {
    placeId: 'origin',
    order: 1,
    name: 'Гродно',
    type: 'Старт',
    lat: 53.6694,
    lng: 23.8131,
  },
  {
    placeId: 'poi-1',
    order: 2,
    name: 'Замок',
    type: 'Замок',
    lat: 53.7,
    lng: 23.9,
  },
  {
    placeId: 'poi-2',
    order: 3,
    name: 'Усадьба',
    type: 'Усадьба',
    lat: 53.8,
    lng: 24.1,
  },
  {
    placeId: 'destination',
    order: 4,
    name: 'Лида',
    type: 'Финиш',
    lat: 53.8833,
    lng: 25.2997,
  },
]

describe('routeStops helpers', () => {
  it('counts only intermediate POI as route places', () => {
    expect(routePlacesCount(stops)).toBe(2)
    expect(routePlaceStops(stops).map((stop) => stop.placeId)).toEqual(['poi-1', 'poi-2'])
    expect(isRoutePlaceStop(stops[0])).toBe(false)
    expect(isRoutePlaceStop(stops[1])).toBe(true)
    expect(isRoutePlaceStop(stops[3])).toBe(false)
  })

  it('labels endpoints as start and finish, and POI by order', () => {
    expect(routeStopLabel(stops[0])).toBe('Старт')
    expect(routeStopLabel(stops[1])).toBe('2')
    expect(routeStopLabel(stops[3])).toBe('Финиш')
  })
})

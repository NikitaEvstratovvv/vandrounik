import { describe, expect, it } from 'vitest'
import { isRoutePlaceStop, routePlacesCount, routePlaceStops, routeStopLabel, stopMarkerColors } from './routeStops'
import type { RouteStop } from '@/types'

function testStop(overrides: Partial<RouteStop> & Pick<RouteStop, 'placeId' | 'name' | 'type'>): RouteStop {
  return {
    order: 1,
    typeGroup: 'fortresses',
    typeGroupLabel: 'Крепости',
    interests: ['castles'],
    primaryInterest: 'castles',
    lat: 53.7,
    lng: 23.9,
    ...overrides,
  }
}

const stops: RouteStop[] = [
  testStop({ placeId: 'origin', order: 1, name: 'Гродно', type: 'Старт', lat: 53.6694, lng: 23.8131 }),
  testStop({
    placeId: 'poi-1',
    order: 2,
    name: 'Замок',
    type: 'Замок',
    lat: 53.7,
    lng: 23.9,
    primaryInterest: 'castles',
  }),
  testStop({
    placeId: 'poi-2',
    order: 3,
    name: 'Усадьба',
    type: 'Усадьба',
    typeGroup: 'manors',
    typeGroupLabel: 'Поместья',
    interests: ['estates'],
    primaryInterest: 'estates',
    lat: 53.8,
    lng: 24.1,
  }),
  testStop({
    placeId: 'destination',
    order: 4,
    name: 'Лида',
    type: 'Финиш',
    lat: 53.8833,
    lng: 25.2997,
  }),
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

  it('uses endpoint flag markers and unified POI colors on the map', () => {
    expect(stopMarkerColors(stops[0])).toEqual({ kind: 'endpoint' })
    expect(stopMarkerColors(stops[3])).toEqual({ kind: 'endpoint' })
    expect(stopMarkerColors(stops[2])).toEqual({ kind: 'poi', bg: 'primary', color: 'primaryFg' })
  })
})

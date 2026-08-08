import { describe, expect, it } from 'vitest'
import {
  googleMapsPointUrl,
  googleMapsRouteUrl,
  yandexMapsPointUrl,
  yandexMapsRouteUrl,
} from '@/lib/maps/externalMaps'
import type { RouteStop } from '@/types'

const stops: RouteStop[] = [
  {
    placeId: 'a',
    order: 1,
    name: 'A',
    type: 'palace',
    typeGroup: 'palaces',
    typeGroupLabel: 'Дворец',
    interests: ['castles'],
    primaryInterest: 'castles',
    lat: 53.45,
    lng: 26.47,
  },
  {
    placeId: 'b',
    order: 2,
    name: 'B',
    type: 'palace',
    typeGroup: 'palaces',
    typeGroupLabel: 'Дворец',
    interests: ['castles'],
    primaryInterest: 'castles',
    lat: 53.5,
    lng: 26.5,
  },
]

describe('externalMaps', () => {
  it('builds yandex and google urls for 2+ stops', () => {
    expect(yandexMapsRouteUrl(stops)).toContain('yandex.ru/maps')
    expect(yandexMapsRouteUrl(stops)).toContain('53.45')
    expect(googleMapsRouteUrl(stops)).toContain('google.com/maps/dir')
    expect(googleMapsRouteUrl(stops)).toContain('origin=53.45')
  })

  it('returns null for fewer than 2 stops', () => {
    expect(yandexMapsRouteUrl([stops[0]])).toBeNull()
    expect(googleMapsRouteUrl([])).toBeNull()
  })

  it('builds single-point map urls', () => {
    const point = { lat: 53.45, lng: 26.47 }
    expect(yandexMapsPointUrl(point)).toContain('pt=26.47,53.45')
    expect(googleMapsPointUrl(point)).toContain('query=53.45,26.47')
  })
})

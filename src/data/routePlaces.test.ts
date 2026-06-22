import { describe, expect, it } from 'vitest'
import { ROUTE_PLACES } from './routePlaces'

const GRODNO_BBOX = { minLat: 52.8, maxLat: 54.35, minLng: 23.1, maxLng: 27.0 }

function isOutsideGrodnoBbox(lat: number, lng: number): boolean {
  return (
    lat > GRODNO_BBOX.maxLat ||
    lng > GRODNO_BBOX.maxLng ||
    lat < GRODNO_BBOX.minLat ||
    lng < GRODNO_BBOX.minLng
  )
}

describe('ROUTE_PLACES', () => {
  it('covers Belarus beyond the former Grodno-only bbox', () => {
    const outsideGrodno = ROUTE_PLACES.filter((place) => isOutsideGrodnoBbox(place.lat, place.lng))
    expect(outsideGrodno.length).toBeGreaterThan(500)
  })

  it('includes OSM reserves across the country', () => {
    const reserves = ROUTE_PLACES.filter(
      (place) => place.source === 'osm' && place.interests.includes('reserves'),
    )
    expect(reserves.length).toBeGreaterThan(100)
  })
})

import { describe, expect, it } from 'vitest'
import { bearingDeg, distanceToSegmentKm, haversineKm, segmentProjection } from './distance'

describe('geo distance helpers', () => {
  it('calculates haversine distance between nearby Belarus coordinates', () => {
    const minsk = { lat: 53.9023, lng: 27.5619 }
    const grodno = { lat: 53.6694, lng: 23.8131 }

    expect(haversineKm(minsk, grodno)).toBeCloseTo(247.6, 1)
  })

  it('calculates distance to route segment and projection ratio', () => {
    const start = { lat: 0, lng: 0 }
    const end = { lat: 0, lng: 1 }
    const point = { lat: 0.1, lng: 0.5 }

    expect(segmentProjection(point, start, end)).toBeCloseTo(0.5, 2)
    expect(distanceToSegmentKm(point, start, end)).toBeCloseTo(11.1, 1)
  })

  it('calculates bearing from origin to point', () => {
    const origin = { lat: 53.6694, lng: 23.8131 }
    const east = { lat: 53.6694, lng: 24.8131 }
    const north = { lat: 54.6694, lng: 23.8131 }

    expect(bearingDeg(origin, east)).toBeCloseTo(90, 0)
    expect(bearingDeg(origin, north)).toBeCloseTo(0, 0)
  })
})

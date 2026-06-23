import { describe, expect, it } from 'vitest'
import { osrmProfile, plannedTripFromOsrmRoute } from './osrm'

describe('osrmProfile', () => {
  it('maps car to driving', () => {
    expect(osrmProfile('car')).toBe('driving')
  })

  it('maps bike to cycling', () => {
    expect(osrmProfile('bike')).toBe('cycling')
  })

  it('defaults to driving', () => {
    expect(osrmProfile()).toBe('driving')
  })
})

describe('plannedTripFromOsrmRoute', () => {
  const grodnoLidaRoute = {
    distance: 114104.3,
    duration: 5093.9,
    geometry: '',
    legs: [{ distance: 114104.3, duration: 5093.9 }],
  }

  it('uses OSRM duration for car', () => {
    const trip = plannedTripFromOsrmRoute(grodnoLidaRoute, [0, 1], 'car')
    expect(trip.legMinutes).toEqual([85])
    expect(trip.durationMinutes).toBe(85)
    expect(trip.distanceKm).toBe(114.1)
  })

  it('recalculates duration from leg distance for bike', () => {
    const trip = plannedTripFromOsrmRoute(grodnoLidaRoute, [0, 1], 'bike')
    expect(trip.legMinutes).toEqual([342])
    expect(trip.durationMinutes).toBe(342)
    expect(trip.distanceKm).toBe(114.1)
  })

  it('sums leg minutes for multi-leg bike routes', () => {
    const trip = plannedTripFromOsrmRoute(
      {
        distance: 80000,
        duration: 3600,
        geometry: '',
        legs: [
          { distance: 30000, duration: 1350 },
          { distance: 50000, duration: 2250 },
        ],
      },
      [0, 1, 2],
      'bike',
    )
    expect(trip.legMinutes).toEqual([90, 150])
    expect(trip.durationMinutes).toBe(240)
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  cancelTrip,
  deleteTrip,
  getTrip,
  loadTrips,
  saveTrip,
  setTripStatus,
  toggleTripVisited,
  tripVisitedIds,
} from '@/lib/storage/trips'
import { loadVisitedPlaceIds } from '@/lib/storage/visited'
import type { RouteVariant } from '@/types'

function installMemoryStorage() {
  const store = new Map<string, string>()
  const memory = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true })
}

const variant = (id: string, title: string): RouteVariant => ({
  id,
  title,
  stops: [
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
  ],
  totalKm: 10,
  totalMinutes: 60,
  interestLabels: ['Замки'],
})

beforeEach(() => {
  installMemoryStorage()
})

afterEach(() => {
  localStorage.clear()
})

describe('trips storage', () => {
  it('appends a new trip with unique id even for the same variant.id', () => {
    const first = saveTrip(variant('variant-1', 'One'))
    const second = saveTrip(variant('variant-1', 'One updated'))

    expect(first.id).not.toBe('variant-1')
    expect(second.id).not.toBe(first.id)
    expect(first.variant.id).toBe('variant-1')
    expect(second.variant.id).toBe('variant-1')

    const trips = loadTrips()
    expect(trips).toHaveLength(2)
    expect(trips[0].variant.title).toBe('One updated')
    expect(trips[1].variant.title).toBe('One')
    expect(getTrip(first.id)?.variant.title).toBe('One')
    expect(getTrip(second.id)?.variant.title).toBe('One updated')
  })

  it('prepends newest trip', () => {
    const a = saveTrip(variant('v1', 'One'))
    const b = saveTrip(variant('v2', 'Two'))
    expect(loadTrips().map((t) => t.id)).toEqual([b.id, a.id])
  })

  it('defaults status to new on each save', () => {
    const first = saveTrip(variant('v1', 'One'))
    expect(first.status).toBe('new')

    setTripStatus(first.id, 'in-progress')
    const again = saveTrip(variant('v1', 'One updated'))
    expect(again.status).toBe('new')
    expect(getTrip(first.id)?.status).toBe('in-progress')
  })

  it('toggles per-trip visited and syncs global on mark only', () => {
    const trip = saveTrip(variant('v1', 'One'))
    toggleTripVisited(trip.id, 'a')
    expect(tripVisitedIds(getTrip(trip.id)!).has('a')).toBe(true)
    expect(loadVisitedPlaceIds().has('a')).toBe(true)

    toggleTripVisited(trip.id, 'a')
    expect(tripVisitedIds(getTrip(trip.id)!).has('a')).toBe(false)
    expect(loadVisitedPlaceIds().has('a')).toBe(true)
  })

  it('deletes a trip', () => {
    const a = saveTrip(variant('v1', 'One'))
    const b = saveTrip(variant('v2', 'Two'))
    expect(deleteTrip(a.id)).toBe(true)
    expect(loadTrips().map((t) => t.id)).toEqual([b.id])
    expect(deleteTrip('missing')).toBe(false)
  })

  it('cancels trip: status new and clears visited', () => {
    const trip = saveTrip(variant('v1', 'One'))
    setTripStatus(trip.id, 'in-progress')
    toggleTripVisited(trip.id, 'a')
    const cancelled = cancelTrip(trip.id)
    expect(cancelled?.status).toBe('new')
    expect(tripVisitedIds(cancelled!).size).toBe(0)
    expect(loadVisitedPlaceIds().has('a')).toBe(true)
  })

  it('persists trip so loadTrips returns it after save', () => {
    const trip = saveTrip(variant('persist', 'Persisted'))
    expect(loadTrips().some((t) => t.id === trip.id)).toBe(true)
    expect(getTrip(trip.id)?.variant.title).toBe('Persisted')
  })
})

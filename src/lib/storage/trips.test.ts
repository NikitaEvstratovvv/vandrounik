import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getTrip, loadTrips, saveTrip, setTripStatus } from '@/lib/storage/trips'
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
  it('saves and upserts by variant id', () => {
    const first = saveTrip(variant('v1', 'One'))
    expect(first.id).toBe('v1')
    expect(loadTrips()).toHaveLength(1)

    saveTrip(variant('v1', 'One updated'))
    const trips = loadTrips()
    expect(trips).toHaveLength(1)
    expect(trips[0].variant.title).toBe('One updated')
    expect(getTrip('v1')?.variant.title).toBe('One updated')
  })

  it('prepends newest trip', () => {
    saveTrip(variant('v1', 'One'))
    saveTrip(variant('v2', 'Two'))
    expect(loadTrips().map((t) => t.id)).toEqual(['v2', 'v1'])
  })

  it('defaults status to new and keeps it on upsert', () => {
    const first = saveTrip(variant('v1', 'One'))
    expect(first.status).toBe('new')

    setTripStatus('v1', 'in-progress')
    const again = saveTrip(variant('v1', 'One updated'))
    expect(again.status).toBe('in-progress')
  })
})

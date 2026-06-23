import { beforeEach, describe, expect, it, vi } from 'vitest'
import { haversineKm } from '@/lib/geo/distance'
import { fetchTableDistancesMeters, planRoute } from '@/lib/routing/osrm'
import {
  clearDirectRouteKmCache,
  fetchDirectRouteKm,
  fetchRoadDistancesFromOrigin,
} from './directRouteKm'
import type { Place } from '@/types'

vi.mock('@/lib/routing/osrm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/routing/osrm')>()
  return {
    ...actual,
    planRoute: vi.fn(),
    fetchTableDistancesMeters: vi.fn(),
  }
})

const grodno: Place = {
  id: 'grodno',
  title: 'Гродно',
  subtitle: 'Гродненская область',
  lat: 53.6694,
  lng: 23.8131,
}

const minsk: Place = {
  id: 'minsk',
  title: 'Минск',
  subtitle: 'Минская область',
  lat: 53.9006,
  lng: 27.559,
}

const lida: Place = {
  id: 'lida',
  title: 'Лида',
  subtitle: 'Гродненская область',
  lat: 53.8833,
  lng: 25.2997,
}

describe('fetchDirectRouteKm', () => {
  beforeEach(() => {
    vi.mocked(planRoute).mockReset()
    vi.mocked(fetchTableDistancesMeters).mockReset()
    clearDirectRouteKmCache()
  })

  it('returns rounded OSRM distance for linear routes', async () => {
    vi.mocked(planRoute).mockResolvedValue({
      waypointOrder: [0, 1],
      legMinutes: [180],
      distanceKm: 245.7,
      durationMinutes: 180,
      geometry: [],
    })

    await expect(fetchDirectRouteKm(grodno, minsk, 'car')).resolves.toBe(246)
    expect(planRoute).toHaveBeenCalledWith([grodno, minsk], { transport: 'car' })
  })

  it('returns null for circular routes', async () => {
    await expect(fetchDirectRouteKm(grodno, grodno, 'car')).resolves.toBeNull()
    expect(planRoute).not.toHaveBeenCalled()
  })

  it('falls back to haversine when OSRM fails', async () => {
    vi.mocked(planRoute).mockRejectedValue(new Error('OSRM недоступен'))

    const expected = Math.max(1, Math.round(haversineKm(grodno, minsk)))
    await expect(fetchDirectRouteKm(grodno, minsk, 'car')).resolves.toBe(expected)
  })

  it('reuses cached distance for identical endpoints', async () => {
    vi.mocked(planRoute).mockResolvedValue({
      waypointOrder: [0, 1],
      legMinutes: [180],
      distanceKm: 245.7,
      durationMinutes: 180,
      geometry: [],
    })

    await fetchDirectRouteKm(grodno, minsk, 'car')
    await fetchDirectRouteKm(grodno, minsk, 'car')

    expect(planRoute).toHaveBeenCalledTimes(1)
  })
})

describe('fetchRoadDistancesFromOrigin', () => {
  beforeEach(() => {
    vi.mocked(fetchTableDistancesMeters).mockReset()
  })

  it('returns OSRM road distances for search results', async () => {
    vi.mocked(fetchTableDistancesMeters).mockResolvedValue([114104.3, 276440.2])

    const result = await fetchRoadDistancesFromOrigin(grodno, [lida, minsk], 'car')

    expect(fetchTableDistancesMeters).toHaveBeenCalledWith([grodno, lida, minsk], 'car')
    expect(result[0].distanceKm).toBe(114)
    expect(result[1].distanceKm).toBe(276)
  })

  it('falls back to haversine when OSRM table fails', async () => {
    vi.mocked(fetchTableDistancesMeters).mockRejectedValue(new Error('OSRM недоступен'))

    const result = await fetchRoadDistancesFromOrigin(grodno, [lida], 'car')

    expect(result[0].distanceKm).toBe(Math.max(1, Math.round(haversineKm(grodno, lida))))
  })
})

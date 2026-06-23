import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bearingDeg, haversineKm, segmentProjection } from '@/lib/geo/distance'
import { planRoute, planTrip } from '@/lib/routing/osrm'
import {
  appendCircularFinish,
  circularRadiusCapRatio,
  desiredPoiCount,
  desiredPoiCounts,
  desiredPoiCountsCircular,
  directRouteDistanceKm,
  fallbackPoiCountsForTarget,
  filterCandidatesByTargetUpperBound,
  generateRoutes,
  getRouteTarget,
  isCandidateWithinTargetBounds,
  minDesiredPoiCount,
  resolveCorridorKm,
  resolveRouteTarget,
  routeTargetPenalty,
  routeTargetDiff,
  selectBestCandidates,
  selectDiverseCandidates,
  selectRoutePlaces,
  shouldBuildFallbackCandidates,
  stopSetDistance,
  targetDistanceKm,
  targetAnchorDistanceKm,
} from './generateRoutes'
import type { WizardState } from '@/types'

vi.mock('@/lib/routing/osrm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/routing/osrm')>()
  return {
    ...actual,
    planRoute: vi.fn(),
    planTrip: vi.fn(),
  }
})

const baseState: WizardState = {
  transport: 'car',
  origin: {
    id: 'origin',
    title: 'Гродно',
    subtitle: 'Гродненская область',
    lat: 53.6694,
    lng: 23.8131,
  },
  destination: {
    id: 'destination',
    title: 'Лида',
    subtitle: 'Гродненская область',
    lat: 53.8833,
    lng: 25.2997,
  },
  interests: ['castles', 'temples'],
  duration: { unit: 'hours', hours: 8, km: null },
}

const circularGrodnoState: WizardState = {
  ...baseState,
  origin: {
    id: 'origin',
    title: 'Гродно',
    subtitle: 'Гродненская область',
    lat: 53.6694,
    lng: 23.8131,
  },
  destination: {
    id: 'destination',
    title: 'Гродно',
    subtitle: 'Гродненская область',
    lat: 53.6694,
    lng: 23.8131,
  },
  interests: ['castles', 'temples', 'estates'],
}

function averageDistanceFromOrigin(state: WizardState, places: { lat: number; lng: number }[]): number {
  if (!state.origin || places.length === 0) return 0
  return places.reduce((sum, place) => sum + haversineKm(state.origin!, place), 0) / places.length
}

function projectionsFor(state: WizardState, places: { lat: number; lng: number }[]): number[] {
  if (!state.origin || !state.destination) return []
  return places
    .map((place) => segmentProjection(place, state.origin!, state.destination!))
    .sort((a, b) => a - b)
}

function projectionGaps(projections: number[]): number[] {
  const gaps: number[] = []
  for (let i = 1; i < projections.length; i++) {
    gaps.push(projections[i] - projections[i - 1])
  }
  return gaps
}

function minAngularGapDeg(origin: { lat: number; lng: number }, places: { lat: number; lng: number }[]): number {
  if (places.length < 2) return 360
  const bearings = places.map((place) => bearingDeg(origin, place)).sort((a, b) => a - b)
  let minGap = 360
  for (let i = 0; i < bearings.length; i++) {
    const current = bearings[i]
    const next = bearings[(i + 1) % bearings.length]
    const gap = i === bearings.length - 1 ? (360 - current + next) % 360 : next - current
    minGap = Math.min(minGap, gap === 0 ? 360 : gap)
  }
  return minGap
}

describe('selectRoutePlaces', () => {
  it('prefers places matching interests near the route corridor', () => {
    const places = selectRoutePlaces(baseState, 3, 0)

    expect(places.length).toBeGreaterThan(0)
    expect(places.every((place) => place.interests.some((id) => baseState.interests.includes(id)))).toBe(true)
  })

  it('creates route target from hours or kilometers', () => {
    expect(getRouteTarget(baseState)).toEqual({ unit: 'minutes', value: 480 })
    expect(getRouteTarget({ ...baseState, duration: { unit: 'km', hours: null, km: 120 } })).toEqual({
      unit: 'km',
      value: 120,
    })
  })

  it('derives circular anchor distance from target kilometers', () => {
    expect(targetAnchorDistanceKm({ unit: 'km', value: 400 })).toBe(200)
    expect(targetAnchorDistanceKm({ unit: 'minutes', value: 240 }, 'car')).toBeCloseTo(180, 1)
    expect(targetAnchorDistanceKm({ unit: 'minutes', value: 240 }, 'bike')).toBeCloseTo(40, 1)
    expect(targetAnchorDistanceKm({ unit: 'km', value: 270 }, 'car', 8)).toBeLessThan(
      targetAnchorDistanceKm({ unit: 'km', value: 270 }, 'car', 1)!,
    )
    expect(targetDistanceKm({ unit: 'minutes', value: 180 }, 'car')).toBe(270)
    expect(targetDistanceKm({ unit: 'minutes', value: 180 }, 'bike')).toBe(60)
  })

  it('scales desired POI count with target distance', () => {
    expect(desiredPoiCount(80)).toBe(3)
    expect(desiredPoiCount(150)).toBe(5)
    expect(desiredPoiCount(300)).toBe(7)
    expect(desiredPoiCount(400)).toBe(9)
    expect(desiredPoiCounts(80)).toEqual([3, 4, 5])
    expect(desiredPoiCounts(150)).toEqual([5, 6, 7])
    expect(desiredPoiCounts(270)).toEqual([7, 8])
    expect(desiredPoiCounts(300)).toEqual([7, 8])
    expect(desiredPoiCounts(400)).toEqual([9, 10, 11, 12])
    expect(minDesiredPoiCount(80)).toBe(3)
    expect(minDesiredPoiCount(150)).toBe(5)
    expect(minDesiredPoiCount(300)).toBe(7)
    expect(minDesiredPoiCount(400)).toBe(9)
  })

  it('provides lower-count fallback buckets for overshooting targets', () => {
    expect(fallbackPoiCountsForTarget(80)).toEqual([])
    expect(fallbackPoiCountsForTarget(150)).toEqual([3, 4])
    expect(fallbackPoiCountsForTarget(270)).toEqual([5, 6])
    expect(fallbackPoiCountsForTarget(400)).toEqual([7, 8])
  })

  it('uses fewer POI counts for circular routes than linear at 300 km', () => {
    expect(desiredPoiCounts(300)).toEqual([7, 8])
    expect(desiredPoiCountsCircular(300)).toEqual([4, 5, 6])
  })

  it('widens corridor when target distance exceeds direct route', () => {
    const baranovichiState: WizardState = {
      ...baseState,
      destination: {
        id: 'destination',
        title: 'Барановичи',
        subtitle: 'Брестская область',
        lat: 53.1327,
        lng: 26.0139,
      },
      duration: { unit: 'km', hours: null, km: 800 },
    }
    const target = getRouteTarget(baranovichiState)
    const directKm = directRouteDistanceKm(baranovichiState)

    expect(directKm).not.toBeNull()
    expect(resolveCorridorKm(baranovichiState, target)).toBe(120)
  })

  it('requires candidates to meet lower and upper target bounds', () => {
    const target = { unit: 'km' as const, value: 300 }
    expect(isCandidateWithinTargetBounds({ totalKm: 250, totalMinutes: 300 }, target)).toBe(false)
    expect(isCandidateWithinTargetBounds({ totalKm: 280, totalMinutes: 300 }, target)).toBe(true)
    expect(isCandidateWithinTargetBounds({ totalKm: 450, totalMinutes: 500 }, target)).toBe(false)
  })

  it('uses a more compact circular radius for dense route targets', () => {
    expect(circularRadiusCapRatio(8)).toBeLessThan(circularRadiusCapRatio(5))
    expect(circularRadiusCapRatio(12)).toBeLessThan(circularRadiusCapRatio(8))
  })

  it('selects farther circular anchors for long targets than short targets', () => {
    const shortState: WizardState = {
      ...circularGrodnoState,
      duration: { unit: 'km', hours: null, km: 80 },
    }
    const longState: WizardState = {
      ...circularGrodnoState,
      duration: { unit: 'km', hours: null, km: 400 },
    }

    const shortPlaces = selectRoutePlaces(shortState, 3, 0, getRouteTarget(shortState))
    const longPlaces = selectRoutePlaces(longState, 3, 0, getRouteTarget(longState))

    expect(averageDistanceFromOrigin(longState, longPlaces)).toBeGreaterThan(
      averageDistanceFromOrigin(shortState, shortPlaces),
    )
  })

  it('selects more circular POIs for long targets', () => {
    const longState: WizardState = {
      ...circularGrodnoState,
      duration: { unit: 'km', hours: null, km: 300 },
    }
    const places = selectRoutePlaces(longState, desiredPoiCount(300), 0, getRouteTarget(longState))

    expect(places.length).toBeGreaterThan(4)
  })

  it('scores routes by distance to target', () => {
    expect(routeTargetDiff({ distanceKm: 95, durationMinutes: 200 }, { unit: 'km', value: 100 })).toBe(5)
    expect(routeTargetDiff({ distanceKm: 95, durationMinutes: 260 }, { unit: 'minutes', value: 240 })).toBe(20)
    expect(routeTargetPenalty({ distanceKm: 570, durationMinutes: 600 }, { unit: 'km', value: 270 })).toBeGreaterThan(
      routeTargetPenalty({ distanceKm: 280, durationMinutes: 300 }, { unit: 'km', value: 270 }),
    )
    const target = { unit: 'minutes' as const, value: 60 }
    const closeScore =
      routeTargetDiff({ distanceKm: 70, durationMinutes: 70 }, target) +
      routeTargetPenalty({ distanceKm: 70, durationMinutes: 70 }, target)
    const longScore =
      routeTargetDiff({ distanceKm: 120, durationMinutes: 150 }, target) +
      routeTargetPenalty({ distanceKm: 120, durationMinutes: 150 }, target)
    expect(closeScore).toBeLessThan(longScore)
  })

  it('selects closest candidates without duplicate stop sets first', () => {
    const selected = selectBestCandidates(
      [
        { score: 4, stopIds: ['a'] },
        { score: 1, stopIds: ['a'] },
        { score: 2, stopIds: ['b'] },
        { score: 3, stopIds: ['c'] },
      ],
      3,
    )

    expect(selected.map((candidate) => candidate.score)).toEqual([1, 2, 3])
  })

  it('measures stop set distance with subset penalty', () => {
    expect(stopSetDistance(['a', 'b', 'c'], ['x', 'y', 'z'])).toBe(1)
    expect(stopSetDistance(['a', 'b', 'c'], ['a', 'b', 'd'])).toBe(0.5)
    expect(stopSetDistance(['a', 'b', 'c'], ['a', 'b'])).toBeLessThan(stopSetDistance(['a', 'b', 'c'], ['x', 'y', 'z']))
  })

  it('prefers diverse stop sets over similar high-scoring candidates', () => {
    const selected = selectDiverseCandidates(
      [
        { score: 1, stopIds: ['a', 'b', 'c'] },
        { score: 1.05, stopIds: ['a', 'b', 'd'] },
        { score: 1.1, stopIds: ['a', 'b', 'e'] },
        { score: 1.15, stopIds: ['x', 'y', 'z'] },
      ],
      3,
    )

    expect(selected[0].stopIds).toEqual(['a', 'b', 'c'])
    expect(selected.map((candidate) => candidate.stopIds.join('|'))).toContain('x|y|z')
    expect(new Set(selected.map((candidate) => candidate.stopIds.join('|'))).size).toBe(3)
  })

  it('filters overshooting candidates when bounded alternatives exist', () => {
    const filtered = filterCandidatesByTargetUpperBound(
      [
        { score: 300, stopIds: ['too-long'], totalKm: 570, totalMinutes: 600 },
        { score: 10, stopIds: ['close'], totalKm: 280, totalMinutes: 300 },
      ],
      { unit: 'km', value: 270 },
    )

    expect(filtered.map((candidate) => candidate.stopIds[0])).toEqual(['close'])
  })

  it('prefers bounded lower-count candidates over 447 km overshoot for 270 km target', () => {
    const target = { unit: 'km' as const, value: 270 }
    const filtered = filterCandidatesByTargetUpperBound(
      [
        { score: 1, stopIds: ['7-poi-overshoot'], totalKm: 447, totalMinutes: 500 },
        { score: 100, stopIds: ['5-poi-bounded'], totalKm: 320, totalMinutes: 360 },
      ],
      target,
    )
    const selected = selectBestCandidates(filtered, 1)

    expect(selected.map((candidate) => candidate.stopIds[0])).toEqual(['5-poi-bounded'])
  })

  it('builds fallback candidates only when primary candidates exceed upper bound', () => {
    const target = { unit: 'km' as const, value: 270 }

    expect(shouldBuildFallbackCandidates([{ totalKm: 447, totalMinutes: 500 }], target)).toBe(true)
    expect(shouldBuildFallbackCandidates([{ totalKm: 330, totalMinutes: 360 }], target)).toBe(false)
  })

  it('filters minute-based overshooting candidates when bounded alternatives exist', () => {
    const filtered = filterCandidatesByTargetUpperBound(
      [
        { score: 150, stopIds: ['too-long'], totalKm: 140, totalMinutes: 150 },
        { score: 10, stopIds: ['close'], totalKm: 75, totalMinutes: 70 },
      ],
      { unit: 'minutes', value: 60 },
    )

    expect(filtered.map((candidate) => candidate.stopIds[0])).toEqual(['close'])
  })

  it('appends final origin stop for circular routes and preserves return leg', () => {
    const origin = circularGrodnoState.origin!
    const stops = appendCircularFinish(
      [
        {
          placeId: 'origin',
          order: 1,
          name: origin.title,
          type: 'Старт',
          typeGroup: 'fortresses',
          typeGroupLabel: 'Старт',
          interests: [],
          primaryInterest: 'castles',
          lat: origin.lat,
          lng: origin.lng,
          driveMinutesToNext: 30,
        },
        {
          placeId: 'poi',
          order: 2,
          name: 'Точка маршрута',
          type: 'Замок',
          typeGroup: 'fortresses',
          typeGroupLabel: 'Крепости',
          interests: ['castles'],
          primaryInterest: 'castles',
          lat: 53.8,
          lng: 24.2,
          driveMinutesToNext: 35,
        },
      ],
      origin,
    )

    expect(stops.at(-1)).toMatchObject({
      placeId: 'destination',
      order: 3,
      name: origin.title,
      type: 'Финиш',
      lat: origin.lat,
      lng: origin.lng,
    })
    expect(stops[1].driveMinutesToNext).toBe(35)
    expect(stops.at(-1)?.driveMinutesToNext).toBeUndefined()
  })

  it('distributes linear POIs evenly along the route corridor', () => {
    const count = 5
    const places = selectRoutePlaces(baseState, count, 0)
    expect(places.length).toBe(count)

    const projections = projectionsFor(baseState, places)
    expect(projections.every((t) => t > 0.1 && t < 0.9)).toBe(true)

    const gaps = projectionGaps(projections)
    expect(gaps.every((gap) => gap > 0.11)).toBe(true)
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.15)
  })

  it('distributes circular POIs around the origin by bearing', () => {
    const count = 5
    const places = selectRoutePlaces(circularGrodnoState, count, 0, { unit: 'km', value: 200 })
    expect(places.length).toBe(count)

    const minGap = minAngularGapDeg(circularGrodnoState.origin!, places)
    expect(minGap).toBeGreaterThan(40)
  })

  it('selects different POIs for different variant seeds along linear corridor', () => {
    const count = 5
    const seed0 = selectRoutePlaces(baseState, count, 0)
    const seed1 = selectRoutePlaces(baseState, count, 1)
    const seed2 = selectRoutePlaces(baseState, count, 2)

    expect(seed0.length).toBe(count)
    expect(seed1.length).toBe(count)
    expect(seed2.length).toBe(count)

    const overlap01 = stopSetDistance(
      seed0.map((place) => place.id),
      seed1.map((place) => place.id),
    )
    const overlap02 = stopSetDistance(
      seed0.map((place) => place.id),
      seed2.map((place) => place.id),
    )

    expect(overlap01).toBeGreaterThan(0.2)
    expect(overlap02).toBeGreaterThan(0.2)
  })
})

describe('resolveRouteTarget', () => {
  beforeEach(() => {
    vi.mocked(planRoute).mockReset()
  })

  it('returns explicit target without calling OSRM', async () => {
    await expect(resolveRouteTarget(baseState)).resolves.toEqual({ unit: 'minutes', value: 480 })
    expect(planRoute).not.toHaveBeenCalled()
  })

  it('uses OSRM road distance when duration is not set', async () => {
    vi.mocked(planRoute).mockResolvedValue({
      waypointOrder: [0, 1],
      legMinutes: [90],
      distanceKm: 97.3,
      durationMinutes: 90,
      geometry: [],
    })

    await expect(resolveRouteTarget({ ...baseState, duration: null })).resolves.toEqual({
      unit: 'km',
      value: 97,
    })
    expect(planRoute).toHaveBeenCalledWith(
      [baseState.origin, baseState.destination],
      { transport: 'car' },
    )
  })

  it('uses cycling profile when transport is bike', async () => {
    vi.mocked(planRoute).mockResolvedValue({
      waypointOrder: [0, 1],
      legMinutes: [240],
      distanceKm: 97.3,
      durationMinutes: 240,
      geometry: [],
    })

    await expect(resolveRouteTarget({ ...baseState, transport: 'bike', duration: null })).resolves.toEqual({
      unit: 'km',
      value: 97,
    })
    expect(planRoute).toHaveBeenCalledWith(
      [baseState.origin, baseState.destination],
      { transport: 'bike' },
    )
  })

  it('returns null for circular routes without explicit duration', async () => {
    await expect(resolveRouteTarget({ ...circularGrodnoState, duration: null })).resolves.toBeNull()
    expect(planRoute).not.toHaveBeenCalled()
  })

  it('falls back to haversine when OSRM fails', async () => {
    vi.mocked(planRoute).mockRejectedValue(new Error('OSRM недоступен'))

    const state: WizardState = { ...baseState, duration: null }
    const expectedKm = Math.max(1, Math.round(haversineKm(state.origin!, state.destination!)))

    await expect(resolveRouteTarget(state)).resolves.toEqual({ unit: 'km', value: expectedKm })
  })
})

function stopIdsFromVariant(stops: { placeId: string }[]): string[] {
  return stops
    .filter((stop) => stop.placeId !== 'origin' && stop.placeId !== 'destination')
    .map((stop) => stop.placeId)
    .sort()
}

function mockTripForWaypoints(waypoints: { lat: number; lng: number }[]) {
  const waypointOrder = waypoints.map((_, index) => index)
  const legMinutes = Array.from({ length: Math.max(waypoints.length - 1, 1) }, () => 45)
  const poiCount = Math.max(0, waypoints.length - 2)
  const distanceKm = Math.max(80, 180 + poiCount * 85)
  return {
    waypointOrder,
    legMinutes,
    distanceKm,
    durationMinutes: legMinutes.reduce((sum, minutes) => sum + minutes, 0),
    geometry: waypoints.map((point) => ({ lat: point.lat, lng: point.lng })),
  }
}

function mockCircularTripForWaypoints(waypoints: { lat: number; lng: number }[]) {
  const waypointOrder = waypoints.map((_, index) => index)
  const legMinutes = Array.from({ length: Math.max(waypoints.length - 1, 1) }, () => 35)
  const poiCount = Math.max(0, waypoints.length - 1)
  const distanceKm = Math.max(120, 80 + poiCount * 45)
  return {
    waypointOrder,
    legMinutes,
    distanceKm,
    durationMinutes: legMinutes.reduce((sum, minutes) => sum + minutes, 0),
    geometry: waypoints.map((point) => ({ lat: point.lat, lng: point.lng })),
  }
}

describe('generateRoutes diversity', () => {
  const diversityState: WizardState = {
    ...baseState,
    duration: { unit: 'km', hours: null, km: 150 },
  }

  beforeEach(() => {
    vi.mocked(planRoute).mockReset()
    vi.mocked(planTrip).mockReset()
    vi.mocked(planRoute).mockImplementation(async (waypoints) => mockTripForWaypoints(waypoints))
    vi.mocked(planTrip).mockImplementation(async (waypoints) => mockTripForWaypoints(waypoints))
  })

  it('returns diverse variants without duplicate stop sets', async () => {
    const result = await generateRoutes(diversityState)

    expect(result.variants.length).toBeGreaterThanOrEqual(2)
    expect(result.variants.length).toBeLessThanOrEqual(3)

    const stopSets = result.variants.map((variant) => stopIdsFromVariant(variant.stops))
    expect(new Set(stopSets.map((ids) => ids.join('|'))).size).toBe(stopSets.length)

    for (let i = 0; i < stopSets.length; i++) {
      for (let j = i + 1; j < stopSets.length; j++) {
        expect(stopSetDistance(stopSets[i], stopSets[j])).toBeGreaterThanOrEqual(0.35)
      }
    }
  })
})

describe('generateRoutes target fitting', () => {
  beforeEach(() => {
    vi.mocked(planRoute).mockReset()
    vi.mocked(planTrip).mockReset()
    vi.mocked(planRoute).mockImplementation(async (waypoints) => mockTripForWaypoints(waypoints))
    vi.mocked(planTrip).mockImplementation(async (waypoints) => mockTripForWaypoints(waypoints))
  })

  it('prefers longer routes when target km exceeds direct distance', async () => {
    const state: WizardState = {
      ...baseState,
      destination: {
        id: 'destination',
        title: 'Барановичи',
        subtitle: 'Брестская область',
        lat: 53.1327,
        lng: 26.0139,
      },
      duration: { unit: 'km', hours: null, km: 800 },
    }

    const result = await generateRoutes(state)
    const bestKm = Math.max(...result.variants.map((variant) => variant.totalKm))

    expect(bestKm).toBeGreaterThanOrEqual(680)
  })
})

describe('generateRoutes circular routes', () => {
  beforeEach(() => {
    vi.mocked(planRoute).mockReset()
    vi.mocked(planTrip).mockReset()
    vi.mocked(planTrip).mockImplementation(async (waypoints) => mockCircularTripForWaypoints(waypoints))
  })

  it('uses fewer POI counts for circular routes at 300 km', async () => {
    const state: WizardState = {
      ...circularGrodnoState,
      duration: { unit: 'km', hours: null, km: 300 },
    }

    const result = await generateRoutes(state)
    const poiCounts = result.variants.map((variant) => stopIdsFromVariant(variant.stops).length)

    expect(poiCounts.every((count) => count >= 3 && count <= 7)).toBe(true)
    expect(Math.max(...result.variants.map((variant) => variant.totalKm))).toBeLessThan(450)
  })
})

import { INTERESTS } from '@/data/interests'
import { primaryInterest } from '@/data/placeTaxonomy'
import { ROUTE_PLACES } from '@/data/routePlaces'
import { distanceToSegmentKm, bearingDeg, haversineKm, segmentProjection } from '@/lib/geo/distance'
import { planRoute, planTrip } from '@/lib/routing/osrm'
import { hoursToKm } from '@/lib/transport/speed'
import type {
  GenerationParams,
  GenerationResult,
  InterestId,
  LatLng,
  RoutePlace,
  RouteStop,
  RouteVariant,
  WizardState,
} from '@/types'

export const MIN_ROUTE_VARIANTS = 3

const CORRIDOR_KM = 25
const ENDPOINT_DEDUPE_KM = 0.3
const PROJECTION_MARGIN = 0.08
const MAX_POI_PER_ROUTE = 12
const MIN_POI_SPACING_KM = 16
const CANDIDATE_SEEDS = [0, 1, 2] as const
const LONG_TARGET_SEEDS = [0, 1, 2] as const
const EMERGENCY_DIVERSE_SEEDS = [3, 4, 5] as const
const LONG_TARGET_KM = 150
export const TARGET_LOWER_BOUND_RATIO = 0.85
const TARGET_UPPER_BOUND_RATIO = 1.35
export const TARGET_ACCEPT_RATIO = 0.12
export const DIVERSITY_SCORE_TOLERANCE = 0.25
export const MIN_STOP_SET_DISTANCE = 0.35
const SUBSET_DISTANCE_PENALTY = 0.25
const DEFAULT_CANDIDATE_SPECS = [
  { count: 5, seed: 0 },
  { count: 4, seed: 1 },
  { count: 6, seed: 2 },
  { count: 3, seed: 0 },
  { count: 1, seed: 0 },
  { count: 0, seed: 0 },
] as const

type ScoredPlace = {
  place: RoutePlace
  distanceToRouteKm: number
  distanceFromOriginKm: number
  distanceFromDestinationKm: number
  targetAnchorDiff: number
  projection: number
}

export type RouteTarget = {
  unit: 'km' | 'minutes'
  value: number
}

export type RouteCandidateForSelection = {
  score: number
  stopIds: string[]
}

type CandidateSpec = {
  count: number
  seed: number
  scoreBias: number
  allowLowerCount?: boolean
}

type BuiltCandidate = RouteVariant & RouteCandidateForSelection

function placeLatLng(place: RoutePlace): LatLng {
  return { lat: place.lat, lng: place.lng }
}

function hasValidEndpoint(point: WizardState['origin']): point is NonNullable<WizardState['origin']> {
  return Boolean(point && Number.isFinite(point.lat) && Number.isFinite(point.lng))
}

function isCircular(state: WizardState): boolean {
  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination)) return false
  return haversineKm(state.origin, state.destination) <= 0.1
}

function buildParams(state: WizardState): GenerationParams {
  const origin = state.origin
  const destination = state.destination

  return {
    originTitle: origin?.title ?? '—',
    originLat: origin?.lat ?? null,
    originLng: origin?.lng ?? null,
    destinationTitle: destination?.title ?? origin?.title ?? '—',
    destinationLat: destination?.lat ?? null,
    destinationLng: destination?.lng ?? null,
    circular: isCircular(state),
    transport: state.transport,
    durationUnit: state.duration?.unit ?? null,
    durationHours: state.duration?.hours ?? null,
    durationKm: state.duration?.km ?? null,
    interests: [...state.interests],
  }
}

export function getRouteTarget(state: WizardState): RouteTarget | null {
  const duration = state.duration
  if (!duration) return null
  if (duration.unit === 'km' && duration.km !== null && duration.km > 0) {
    return { unit: 'km', value: duration.km }
  }
  if (duration.unit === 'hours' && duration.hours !== null && duration.hours > 0) {
    return { unit: 'minutes', value: duration.hours * 60 }
  }
  return null
}

export async function resolveRouteTarget(state: WizardState): Promise<RouteTarget | null> {
  const explicit = getRouteTarget(state)
  if (explicit) return explicit

  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination)) return null
  if (isCircular(state)) return null

  try {
    const trip = await planRoute([state.origin, state.destination], { transport: state.transport })
    return { unit: 'km', value: Math.max(1, Math.round(trip.distanceKm)) }
  } catch {
    const km = Math.max(1, Math.round(haversineKm(state.origin, state.destination)))
    return { unit: 'km', value: km }
  }
}

export function routeTargetDiff(route: { distanceKm: number; durationMinutes: number }, target: RouteTarget): number {
  return target.unit === 'km'
    ? Math.abs(route.distanceKm - target.value)
    : Math.abs(route.durationMinutes - target.value)
}

function routeTargetValue(route: { distanceKm: number; durationMinutes: number }, target: RouteTarget): number {
  return target.unit === 'km' ? route.distanceKm : route.durationMinutes
}

export function routeTargetPenalty(
  route: { distanceKm: number; durationMinutes: number },
  target: RouteTarget | null,
): number {
  if (!target) return 0
  const value = routeTargetValue(route, target)
  if (value < target.value * 0.6) return target.value
  if (value > target.value * 1.6) return target.value * 3
  if (value > target.value * 1.25) return target.value
  return 0
}

function routeMatchesTargetAcceptance(
  route: { distanceKm: number; durationMinutes: number },
  target: RouteTarget | null,
): boolean {
  if (!target) return false
  const diff = routeTargetDiff(route, target)
  return diff <= Math.max(target.value * TARGET_ACCEPT_RATIO, 15)
}

export function directRouteDistanceKm(state: WizardState): number | null {
  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination)) return null
  if (isCircular(state)) return null
  return haversineKm(state.origin, state.destination)
}

export function resolveCorridorKm(state: WizardState, target: RouteTarget | null): number {
  const directKm = directRouteDistanceKm(state)
  const targetKm = targetDistanceKm(target, state.transport)
  if (directKm === null || targetKm === null || directKm <= 1) return CORRIDOR_KM

  const ratio = targetKm / directKm
  if (ratio >= 3) return 120
  if (ratio >= 2) return 80
  if (ratio >= 1.5) return 50
  return CORRIDOR_KM
}

export function targetDistanceKm(target: RouteTarget | null, transport: WizardState['transport'] = 'car'): number | null {
  if (!target) return null
  return target.unit === 'km' ? target.value : hoursToKm(target.value / 60, transport)
}

export function targetAnchorDistanceKm(
  target: RouteTarget | null,
  transport: WizardState['transport'] = 'car',
  count = 1,
): number | null {
  const distanceKm = targetDistanceKm(target, transport)
  if (distanceKm === null) return null
  if (count <= 2) return distanceKm / 2
  if (count <= 4) return distanceKm / 3
  if (count <= 8) return distanceKm / 3.5
  return distanceKm / 4
}

export function desiredPoiCount(targetKm: number | null): number {
  if (targetKm === null) return 5
  if (targetKm < 100) return 3
  if (targetKm < 200) return 5
  if (targetKm < 350) return 7
  return 9
}

export function desiredPoiCounts(targetKm: number | null): number[] {
  if (targetKm === null) return [5]
  if (targetKm < 100) return [3, 4, 5]
  if (targetKm < 200) return [5, 6, 7]
  if (targetKm < 350) return [7, 8]
  return [9, 10, 11, 12]
}

export function desiredPoiCountsCircular(targetKm: number | null): number[] {
  if (targetKm === null) return [4, 5]
  if (targetKm < 100) return [3, 4]
  if (targetKm < 200) return [4, 5]
  if (targetKm < 350) return [4, 5, 6]
  return [5, 6, 7]
}

export function resolveCandidateCounts(state: WizardState, target: RouteTarget | null): number[] {
  const targetKm = targetDistanceKm(target, state.transport)
  return isCircular(state) ? desiredPoiCountsCircular(targetKm) : desiredPoiCounts(targetKm)
}

export function minDesiredPoiCountForState(state: WizardState, target: RouteTarget | null): number {
  return resolveCandidateCounts(state, target)[0] ?? 0
}

export function minDesiredPoiCount(targetKm: number | null): number {
  return desiredPoiCounts(targetKm)[0] ?? 0
}

export function fallbackPoiCountsForTarget(targetKm: number | null): number[] {
  if (targetKm === null) return []
  if (targetKm < 100) return []
  if (targetKm < 200) return [3, 4]
  if (targetKm < 350) return [5, 6]
  return [7, 8]
}

function scorePlaces(state: WizardState, target: RouteTarget | null = null, count = 1): ScoredPlace[] {
  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination)) return []

  const origin = state.origin
  const destination = state.destination
  const anchorDistanceKm = targetAnchorDistanceKm(target, state.transport, count)
  const matching = ROUTE_PLACES.filter((place) =>
    place.interests.some((interestId) => state.interests.includes(interestId)),
  )

  return matching
    .map((place) => {
      const point = placeLatLng(place)
      const distanceFromOriginKm = haversineKm(point, origin)
      const distanceFromDestinationKm = haversineKm(point, destination)
      return {
        place,
        distanceToRouteKm: distanceToSegmentKm(point, origin, destination),
        distanceFromOriginKm,
        distanceFromDestinationKm,
        targetAnchorDiff: anchorDistanceKm === null ? 0 : Math.abs(distanceFromOriginKm - anchorDistanceKm),
        projection: segmentProjection(point, origin, destination),
      }
    })
    .filter(({ place }) => {
      const point = placeLatLng(place)
      return (
        haversineKm(point, origin) > ENDPOINT_DEDUPE_KM &&
        haversineKm(point, destination) > ENDPOINT_DEDUPE_KM
      )
    })
    .sort((a, b) => {
      const projectionPenaltyA = a.projection < -0.05 || a.projection > 1.05 ? 100 : 0
      const projectionPenaltyB = b.projection < -0.05 || b.projection > 1.05 ? 100 : 0
      return a.distanceToRouteKm + projectionPenaltyA - (b.distanceToRouteKm + projectionPenaltyB)
    })
}

export function selectRoutePlaces(
  state: WizardState,
  count: number,
  variantIndex: number,
  target: RouteTarget | null = null,
): RoutePlace[] {
  return isCircular(state)
    ? selectCircularRoutePlaces(state, count, variantIndex, target)
    : selectLinearRoutePlaces(state, count, variantIndex, target)
}

function angularDiffDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

function takeEvenlyAlongProjection(
  pool: ScoredPlace[],
  interestIds: InterestId[],
  count: number,
  variantIndex: number,
  targetKm: number | null,
): RoutePlace[] {
  if (count === 0 || pool.length === 0) return []

  const margin = PROJECTION_MARGIN
  const span = 1 - 2 * margin
  const binWidth = span / count
  const variantShift = variantIndex * binWidth
  const selected: RoutePlace[] = []
  const used = new Set<string>()

  const scoreEntry = (
    entry: ScoredPlace,
    targetT: number,
    slotInterest: InterestId | undefined,
    outsideBin: boolean,
  ): number => {
    const proj = Math.min(1, Math.max(0, entry.projection))
    const alongPenalty = Math.abs(proj - targetT) * 10
    const edgePenalty = proj < margin || proj > 1 - margin ? 5 : 0
    const binPenalty = outsideBin ? 12 : 0
    let detourPenalty = 0
    if (targetKm !== null) {
      const detour = entry.distanceFromOriginKm + entry.distanceFromDestinationKm
      detourPenalty = Math.abs(detour - targetKm) * 0.05
    }
    const interestPenalty =
      slotInterest && entry.place.interests.includes(slotInterest) ? 0 : 2
    const spacingPenalty = selected.reduce((penalty, place) => {
      const selectedEntry = pool.find((candidate) => candidate.place.id === place.id)
      if (!selectedEntry) return penalty
      const selectedProj = Math.min(1, Math.max(0, selectedEntry.projection))
      const gap = Math.abs(proj - selectedProj)
      return gap < binWidth * 0.5 ? penalty + (binWidth * 0.5 - gap) * 25 : penalty
    }, 0)

    return alongPenalty + edgePenalty + binPenalty + spacingPenalty + entry.distanceToRouteKm + detourPenalty + interestPenalty
  }

  const pickBest = (
    candidates: ScoredPlace[],
    targetT: number,
    slotInterest: InterestId | undefined,
    outsideBin: boolean,
  ): ScoredPlace | null => {
    let best: ScoredPlace | null = null
    let bestScore = Number.POSITIVE_INFINITY

    for (const entry of candidates) {
      if (used.has(entry.place.id)) continue
      const proj = Math.min(1, Math.max(0, entry.projection))
      const tooClose = selected.some((place) => {
        const selectedEntry = pool.find((candidate) => candidate.place.id === place.id)
        if (!selectedEntry) return false
        const selectedProj = Math.min(1, Math.max(0, selectedEntry.projection))
        return Math.abs(proj - selectedProj) < binWidth * 0.65
      })
      if (tooClose) continue
      const score = scoreEntry(entry, targetT, slotInterest, outsideBin)
      if (score < bestScore) {
        bestScore = score
        best = entry
      }
    }

    return best
  }

  for (let i = 0; i < count; i++) {
    const binStart = margin + i * binWidth + variantShift
    const binEnd = binStart + binWidth
    const targetT = binStart + binWidth / 2
    const slotInterest = interestIds[i % interestIds.length]

    const inBin = pool.filter((entry) => {
      if (used.has(entry.place.id)) return false
      const proj = Math.min(1, Math.max(0, entry.projection))
      return proj >= binStart && proj <= binEnd
    })

    let best = pickBest(inBin, targetT, slotInterest, false)
    if (!best) {
      best = pickBest(pool, targetT, slotInterest, true)
    }

    if (best) {
      selected.push(best.place)
      used.add(best.place.id)
    }
  }

  for (const entry of pool) {
    if (selected.length >= count) break
    if (used.has(entry.place.id)) continue
    selected.push(entry.place)
    used.add(entry.place.id)
  }

  return selected
}

function hasNearbySelected(place: RoutePlace, selected: RoutePlace[], minDistanceKm: number): boolean {
  return selected.some((selectedPlace) => haversineKm(placeLatLng(place), placeLatLng(selectedPlace)) < minDistanceKm)
}

function takeEvenlyAroundOrigin(
  pool: ScoredPlace[],
  origin: LatLng,
  interestIds: InterestId[],
  count: number,
  variantIndex: number,
  minDistanceKm: number,
  target: RouteTarget | null,
): RoutePlace[] {
  if (count === 0 || pool.length === 0) return []

  const sectorSize = 360 / count
  const sectorOffset = variantIndex * sectorSize
  const selected: RoutePlace[] = []
  const used = new Set<string>()

  for (let i = 0; i < count; i++) {
    const targetBearing = (sectorOffset + (i + 0.5) * sectorSize) % 360
    const slotInterest = interestIds[i % interestIds.length]
    let best: ScoredPlace | null = null
    let bestScore = Number.POSITIVE_INFINITY

    for (const entry of pool) {
      if (used.has(entry.place.id)) continue
      if (hasNearbySelected(entry.place, selected, minDistanceKm)) continue

      const bearing = bearingDeg(origin, placeLatLng(entry.place))
      const anglePenalty = angularDiffDeg(bearing, targetBearing) * 0.05
      const anchorPenalty = target ? entry.targetAnchorDiff * 0.1 : entry.distanceFromOriginKm * 0.01
      const interestPenalty =
        slotInterest && entry.place.interests.includes(slotInterest) ? 0 : 2
      const score = anglePenalty + anchorPenalty + interestPenalty

      if (score < bestScore) {
        bestScore = score
        best = entry
      }
    }

    if (best) {
      selected.push(best.place)
      used.add(best.place.id)
    }
  }

  for (const entry of pool) {
    if (selected.length >= count) break
    if (used.has(entry.place.id)) continue
    if (hasNearbySelected(entry.place, selected, minDistanceKm)) continue
    selected.push(entry.place)
    used.add(entry.place.id)
  }

  for (const entry of pool) {
    if (selected.length >= count) break
    if (used.has(entry.place.id)) continue
    selected.push(entry.place)
    used.add(entry.place.id)
  }

  return selected
}

function selectLinearRoutePlaces(
  state: WizardState,
  count: number,
  variantIndex: number,
  target: RouteTarget | null,
): RoutePlace[] {
  const scored = scorePlaces(state, target, count)
  const targetKm = targetDistanceKm(target, state.transport)
  const corridorKm = resolveCorridorKm(state, target)
  const corridor = scored.filter(
    (entry) =>
      entry.distanceToRouteKm <= corridorKm &&
      entry.projection >= -0.05 &&
      entry.projection <= 1.05,
  )
  const pool = (corridor.length >= count ? corridor : scored).sort((a, b) => {
    if (targetKm === null) {
      return a.distanceToRouteKm - b.distanceToRouteKm
    }
    const detourA = a.distanceFromOriginKm + a.distanceFromDestinationKm
    const detourB = b.distanceFromOriginKm + b.distanceFromDestinationKm
    return Math.abs(detourA - targetKm) - Math.abs(detourB - targetKm)
  })

  if (pool.length === 0) return []
  return takeEvenlyAlongProjection(pool, state.interests, count, variantIndex, targetKm)
}

function selectCircularRoutePlaces(
  state: WizardState,
  count: number,
  variantIndex: number,
  target: RouteTarget | null,
): RoutePlace[] {
  const scored = scorePlaces(state, target, count).sort((a, b) => {
    if (target) {
      return a.targetAnchorDiff - b.targetAnchorDiff
    }
    return a.distanceFromOriginKm - b.distanceFromOriginKm
  })

  if (scored.length === 0) return []
  const targetKm = targetDistanceKm(target, state.transport)
  const capped =
    targetKm === null
      ? scored
      : scored.filter((entry) => entry.distanceFromOriginKm <= targetKm * circularRadiusCapRatio(count))
  const pool = capped.length >= Math.min(count, 3) ? capped : scored
  if (!hasValidEndpoint(state.origin)) return []
  return takeEvenlyAroundOrigin(
    pool,
    state.origin,
    state.interests,
    count,
    variantIndex,
    MIN_POI_SPACING_KM,
    target,
  )
}

export function circularRadiusCapRatio(count: number): number {
  if (count >= 9) return 0.35
  if (count >= 7) return 0.38
  return 0.45
}

function buildEndpointStop(
  place: NonNullable<WizardState['origin']>,
  order: number,
  role: 'Старт' | 'Финиш',
): RouteStop {
  return {
    placeId: role === 'Старт' ? 'origin' : 'destination',
    order,
    name: place.title,
    type: role,
    typeGroup: 'fortresses',
    typeGroupLabel: role,
    interests: [],
    primaryInterest: 'castles',
    lat: place.lat,
    lng: place.lng,
    description: place.subtitle,
  }
}

function buildPlaceStop(place: RoutePlace, order: number): RouteStop {
  return {
    placeId: place.id,
    order,
    name: place.name,
    type: place.type,
    typeGroup: place.typeGroup,
    typeGroupLabel: place.typeGroupLabel,
    interests: [...place.interests],
    primaryInterest: primaryInterest(place.interests),
    lat: place.lat,
    lng: place.lng,
    description: place.description,
  }
}

function reorderStops(stops: RouteStop[], waypointOrder: number[], legMinutes: number[]): RouteStop[] {
  return waypointOrder.map((inputIndex, index) => {
    const stop: RouteStop = {
      ...stops[inputIndex],
      order: index + 1,
    }
    const legMinutesToNext = legMinutes[index]
    if (typeof legMinutesToNext === 'number') {
      stop.driveMinutesToNext = legMinutesToNext
    }
    return stop
  })
}

export function appendCircularFinish(
  stops: RouteStop[],
  origin: NonNullable<WizardState['origin']>,
): RouteStop[] {
  return [
    ...stops,
    {
      placeId: 'destination',
      order: stops.length + 1,
      name: origin.title,
      type: 'Финиш',
      typeGroup: 'fortresses',
      typeGroupLabel: 'Финиш',
      interests: [],
      primaryInterest: 'castles',
      lat: origin.lat,
      lng: origin.lng,
      description: origin.subtitle,
    },
  ]
}

function uniqueCounts(...counts: number[]): number[] {
  return [...new Set(counts.map((count) => Math.max(0, count)))]
}

function buildInputStops(
  state: WizardState,
  places: RoutePlace[],
  circular: boolean,
): RouteStop[] {
  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination)) {
    throw new Error('Укажите начальную и конечную точку')
  }

  return [
    buildEndpointStop(state.origin, 1, 'Старт'),
    ...places.map((place, index) => buildPlaceStop(place, index + 2)),
    ...(circular ? [] : [buildEndpointStop(state.destination, places.length + 2, 'Финиш')]),
  ]
}

async function planStops(
  stops: RouteStop[],
  circular: boolean,
  optimize: boolean,
  transport: WizardState['transport'],
) {
  const waypoints = stops.map((stop) => ({ lat: stop.lat, lng: stop.lng }))
  if (optimize) {
    return planTrip(waypoints, { roundtrip: circular, transport })
  }
  return planRoute(waypoints, { transport })
}

function buildCandidateSpecs(state: WizardState, target: RouteTarget | null, transport: WizardState['transport']): CandidateSpec[] {
  if (!target) {
    return DEFAULT_CANDIDATE_SPECS.map((spec, index) => ({ ...spec, scoreBias: index }))
  }

  const targetKm = targetDistanceKm(target, transport) ?? 0
  const counts = resolveCandidateCounts(state, target).filter((count) => count > 0 && count <= MAX_POI_PER_ROUTE)
  const seeds = targetKm >= LONG_TARGET_KM ? LONG_TARGET_SEEDS : CANDIDATE_SEEDS
  const specs: CandidateSpec[] = []
  for (const count of counts) {
    for (const seed of seeds) {
      specs.push({ count, seed, scoreBias: specs.length / 1000 })
    }
  }
  return specs
}

function buildEmergencyDiversitySpecs(
  state: WizardState,
  target: RouteTarget | null,
): CandidateSpec[] {
  const counts = resolveCandidateCounts(state, target).filter((count) => count > 0 && count <= MAX_POI_PER_ROUTE)
  const specs: CandidateSpec[] = []
  for (const seed of EMERGENCY_DIVERSE_SEEDS) {
    for (const count of counts) {
      specs.push({ count, seed, scoreBias: 200 + specs.length / 1000 })
    }
  }
  return specs
}

function buildFallbackCandidateSpecs(target: RouteTarget | null, transport: WizardState['transport']): CandidateSpec[] {
  if (!target) return []
  const targetKm = targetDistanceKm(target, transport)
  const counts = fallbackPoiCountsForTarget(targetKm).filter((count) => count > 0 && count <= MAX_POI_PER_ROUTE)
  const seeds = targetKm !== null && targetKm >= LONG_TARGET_KM ? LONG_TARGET_SEEDS : CANDIDATE_SEEDS
  const specs: CandidateSpec[] = []
  for (const count of counts) {
    for (const seed of seeds) {
      specs.push({ count, seed, scoreBias: 100 + specs.length / 1000, allowLowerCount: true })
    }
  }
  return specs
}

function stopIdsForSelection(stops: RouteStop[]): string[] {
  return stops
    .filter((stop) => stop.placeId !== 'origin' && stop.placeId !== 'destination')
    .map((stop) => stop.placeId)
    .sort()
}

/** Jaccard distance between POI sets; higher means more different routes. */
export function stopSetDistance(a: string[], b: string[]): number {
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = [...setA].filter((id) => setB.has(id)).length
  const union = new Set([...a, ...b]).size
  if (union === 0) return 1

  let distance = 1 - intersection / union
  const isProperSubset =
    intersection > 0 &&
    intersection < union &&
    (a.every((id) => setB.has(id)) || b.every((id) => setA.has(id)))
  if (isProperSubset) {
    distance = Math.max(0, distance - SUBSET_DISTANCE_PENALTY)
  }
  return distance
}

function dedupeCandidatesByStopIds<T extends RouteCandidateForSelection>(candidates: T[]): T[] {
  const deduped: T[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    const key = candidate.stopIds.join('|')
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(candidate)
  }
  return deduped
}

function scoreWithinDiversityTolerance(bestScore: number, candidateScore: number, toleranceMultiplier: number): boolean {
  if (bestScore <= 0) {
    return candidateScore <= bestScore + Math.max(10, Math.abs(bestScore) * DIVERSITY_SCORE_TOLERANCE)
  }
  return candidateScore <= bestScore * toleranceMultiplier
}

/** Picks diverse route variants: best score first, then maximally different POI sets within tolerance. */
export function selectDiverseCandidates<T extends RouteCandidateForSelection>(candidates: T[], limit: number): T[] {
  const sorted = [...candidates].sort((a, b) => a.score - b.score)
  const deduped = dedupeCandidatesByStopIds(sorted)
  if (deduped.length === 0) return []
  if (deduped.length <= limit) return deduped

  const bestScore = deduped[0].score
  const toleranceMultipliers = [1 + DIVERSITY_SCORE_TOLERANCE, 1 + DIVERSITY_SCORE_TOLERANCE + 0.15]
  let pool = deduped
  for (const toleranceMultiplier of toleranceMultipliers) {
    const filtered = deduped.filter((candidate, index) =>
      index === 0 || scoreWithinDiversityTolerance(bestScore, candidate.score, toleranceMultiplier),
    )
    if (filtered.length >= limit) {
      pool = filtered
      break
    }
    pool = filtered.length > 0 ? filtered : pool
  }

  const topK = pool.slice(0, Math.min(15, pool.length))
  const first = topK[0]
  const rest = topK.slice(1)

  const minPairwiseDistance = (combo: T[]): number => {
    let min = 1
    for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        min = Math.min(min, stopSetDistance(combo[i].stopIds, combo[j].stopIds))
      }
    }
    return combo.length < 2 ? 1 : min
  }

  const averagePairwiseDistance = (combo: T[]): number => {
    if (combo.length < 2) return 1
    let sum = 0
    let pairs = 0
    for (let i = 0; i < combo.length; i++) {
      for (let j = i + 1; j < combo.length; j++) {
        sum += stopSetDistance(combo[i].stopIds, combo[j].stopIds)
        pairs++
      }
    }
    return pairs === 0 ? 1 : sum / pairs
  }

  let bestCombo: T[] = [first]
  let bestMinPairwise = -1
  let bestAvgPairwise = -1
  let bestScoreSum = Number.POSITIVE_INFINITY

  const considerCombo = (combo: T[]) => {
    const minDistance = minPairwiseDistance(combo)
    const avgDistance = averagePairwiseDistance(combo)
    const scoreSum = combo.reduce((sum, candidate) => sum + candidate.score, 0)
    if (
      minDistance > bestMinPairwise ||
      (minDistance === bestMinPairwise && avgDistance > bestAvgPairwise) ||
      (minDistance === bestMinPairwise && avgDistance === bestAvgPairwise && scoreSum < bestScoreSum)
    ) {
      bestMinPairwise = minDistance
      bestAvgPairwise = avgDistance
      bestScoreSum = scoreSum
      bestCombo = [...combo]
    }
  }

  if (limit === 1) return [first]

  const buildCombos = (start: number, combo: T[]) => {
    if (combo.length === limit) {
      considerCombo(combo)
      return
    }
    for (let i = start; i < rest.length; i++) {
      combo.push(rest[i])
      buildCombos(i + 1, combo)
      combo.pop()
    }
  }

  buildCombos(0, [first])
  if (bestCombo.length < limit) {
    const selected = [...bestCombo]
    for (const candidate of deduped) {
      if (selected.length >= limit) break
      if (selected.includes(candidate)) continue
      selected.push(candidate)
    }
    return selected.slice(0, limit)
  }
  return bestCombo
}

function candidateRouteMetrics(candidate: { totalKm: number; totalMinutes: number }) {
  return { distanceKm: candidate.totalKm, durationMinutes: candidate.totalMinutes }
}

function preferTargetAccurateCandidates<T extends RouteCandidateForSelection & {
  totalKm: number
  totalMinutes: number
}>(candidates: T[], target: RouteTarget | null): T[] {
  if (!target || candidates.length <= MIN_ROUTE_VARIANTS) return candidates

  const sorted = [...candidates].sort(
    (a, b) =>
      routeTargetDiff(candidateRouteMetrics(a), target) +
      routeTargetPenalty(candidateRouteMetrics(a), target) -
      (routeTargetDiff(candidateRouteMetrics(b), target) +
        routeTargetPenalty(candidateRouteMetrics(b), target)),
  )
  const bestDiff = routeTargetDiff(candidateRouteMetrics(sorted[0]), target)
  const threshold = Math.max(bestDiff * 1.2, target.value * 0.15)
  const nearTarget = sorted.filter((candidate) => {
    const metrics = candidateRouteMetrics(candidate)
    return routeTargetDiff(metrics, target) + routeTargetPenalty(metrics, target) <= threshold
  })
  return nearTarget.length >= MIN_ROUTE_VARIANTS
    ? nearTarget
    : sorted.slice(0, Math.min(15, sorted.length))
}

export function selectBestCandidates<T extends RouteCandidateForSelection>(candidates: T[], limit: number): T[] {
  const sorted = [...candidates].sort((a, b) => a.score - b.score)
  const selected: T[] = []
  const seen = new Set<string>()

  for (const candidate of sorted) {
    const key = candidate.stopIds.join('|')
    if (seen.has(key)) continue
    selected.push(candidate)
    seen.add(key)
    if (selected.length >= limit) return selected
  }

  for (const candidate of sorted) {
    if (selected.includes(candidate)) continue
    selected.push(candidate)
    if (selected.length >= limit) return selected
  }

  return selected
}

export function filterCandidatesByTargetUpperBound<T extends RouteCandidateForSelection & {
  totalKm: number
  totalMinutes: number
}>(
  candidates: T[],
  target: RouteTarget | null,
): T[] {
  return filterCandidatesByTargetBounds(candidates, target)
}

export function filterCandidatesByTargetBounds<T extends RouteCandidateForSelection & {
  totalKm: number
  totalMinutes: number
}>(
  candidates: T[],
  target: RouteTarget | null,
): T[] {
  if (!target) return candidates
  const bounded = candidates.filter((candidate) => isCandidateWithinTargetBounds(candidate, target))
  if (bounded.length > 0) return bounded
  return [...candidates].sort(
    (a, b) =>
      routeTargetDiff(candidateRouteMetrics(a), target) +
      routeTargetPenalty(candidateRouteMetrics(a), target) -
      (routeTargetDiff(candidateRouteMetrics(b), target) +
        routeTargetPenalty(candidateRouteMetrics(b), target)),
  )
}

export function isCandidateWithinTargetUpperBound(
  candidate: { totalKm: number; totalMinutes: number },
  target: RouteTarget,
): boolean {
  const value = target.unit === 'km' ? candidate.totalKm : candidate.totalMinutes
  return value <= target.value * TARGET_UPPER_BOUND_RATIO
}

export function isCandidateWithinTargetBounds(
  candidate: { totalKm: number; totalMinutes: number },
  target: RouteTarget,
): boolean {
  const value = target.unit === 'km' ? candidate.totalKm : candidate.totalMinutes
  return value >= target.value * TARGET_LOWER_BOUND_RATIO && value <= target.value * TARGET_UPPER_BOUND_RATIO
}

export function shouldBuildFallbackCandidates(
  candidates: { totalKm: number; totalMinutes: number }[],
  target: RouteTarget | null,
): boolean {
  return Boolean(
    target &&
      candidates.length > 0 &&
      !candidates.some((candidate) => isCandidateWithinTargetBounds(candidate, target)),
  )
}

async function buildCandidate(
  state: WizardState,
  spec: CandidateSpec,
  target: RouteTarget | null,
  interestLabels: string[],
): Promise<BuiltCandidate | null> {
  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination)) {
    throw new Error('Укажите начальную и конечную точку')
  }

  const circular = isCircular(state)
  const targetKm = targetDistanceKm(target, state.transport)
  const longTarget = targetKm !== null && targetKm >= LONG_TARGET_KM
  const minPoiCount = target ? (spec.allowLowerCount ? spec.count : minDesiredPoiCountForState(state, target)) : 0
  const primaryAttemptCounts = uniqueCounts(spec.count, Math.min(3, spec.count), minPoiCount).filter(
    (count) => count >= minPoiCount,
  )
  const fallbackAttemptCounts = uniqueCounts(Math.min(minPoiCount - 1, spec.count), 1, 0).filter(
    (count) => count < minPoiCount,
  )
  let bestInputStops: RouteStop[] | null = null
  let bestTrip: Awaited<ReturnType<typeof planTrip>> | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const count of primaryAttemptCounts) {
    const places = count > 0 ? selectRoutePlaces(state, count, spec.seed, target) : []
    const inputStops = buildInputStops(state, places, circular && places.length > 0)
    try {
      const trip = await planStops(inputStops, circular && places.length > 0, count > 0, state.transport)
      const targetScore = target ? routeTargetDiff(trip, target) : spec.scoreBias
      const candidateScore = targetScore + routeTargetPenalty(trip, target)
      if (candidateScore < bestScore) {
        bestInputStops = inputStops
        bestTrip = trip
        bestScore = candidateScore
      }
      if (routeMatchesTargetAcceptance(trip, target)) break
    } catch {}
  }

  if (!bestTrip) {
    for (const count of fallbackAttemptCounts) {
      if (longTarget && spec.count > 0 && count === 0) continue
      const places = count > 0 ? selectRoutePlaces(state, count, spec.seed, target) : []
      const inputStops = buildInputStops(state, places, circular && places.length > 0)
      try {
        const trip = await planStops(inputStops, circular && places.length > 0, count > 0, state.transport)
        const targetScore = target ? routeTargetDiff(trip, target) : spec.scoreBias
        const candidateScore = targetScore + routeTargetPenalty(trip, target)
        if (candidateScore < bestScore) {
          bestInputStops = inputStops
          bestTrip = trip
          bestScore = candidateScore
        }
        if (routeMatchesTargetAcceptance(trip, target)) break
      } catch {}
    }
  }

  if (!bestInputStops || !bestTrip) {
    return null
  }

  const orderedStops = reorderStops(bestInputStops, bestTrip.waypointOrder, bestTrip.legMinutes)
  const stops = circular ? appendCircularFinish(orderedStops, state.origin) : orderedStops
  const firstPoi = stops.find((stop) => stop.placeId !== 'origin' && stop.placeId !== 'destination')
  const title = firstPoi ? `Через ${firstPoi.name}` : 'Прямой маршрут'
  const targetScore = target ? routeTargetDiff(bestTrip, target) : spec.scoreBias
  const penalty = routeTargetPenalty(bestTrip, target)

  return {
    id: `candidate-${spec.count}-${spec.seed}`,
    title,
    stops,
    stopIds: stopIdsForSelection(stops),
    score: targetScore + penalty + spec.scoreBias,
    geometry: bestTrip.geometry,
    totalKm: bestTrip.distanceKm,
    totalMinutes: bestTrip.durationMinutes,
    interestLabels,
  }
}

export async function generateRoutes(state: WizardState): Promise<GenerationResult> {
  if (!hasValidEndpoint(state.origin) || !hasValidEndpoint(state.destination) || state.interests.length === 0) {
    throw new Error('Укажите откуда, куда и что посмотреть')
  }

  const interestLabels = INTERESTS.filter((interest) => state.interests.includes(interest.id)).map(
    (interest) => interest.title,
  )
  const target = await resolveRouteTarget(state)

  const candidates: BuiltCandidate[] = []
  for (const spec of buildCandidateSpecs(state, target, state.transport)) {
    const candidate = await buildCandidate(state, spec, target, interestLabels)
    if (candidate) candidates.push(candidate)
  }

  if (shouldBuildFallbackCandidates(candidates, target)) {
    for (const spec of buildFallbackCandidateSpecs(target, state.transport)) {
      const candidate = await buildCandidate(state, spec, target, interestLabels)
      if (candidate) candidates.push(candidate)
    }
  }

  if (candidates.length === 0) {
    const emergency = await buildCandidate(state, { count: 0, seed: 0, scoreBias: 9999 }, target, interestLabels)
    if (emergency) candidates.push(emergency)
  }

  let boundedCandidates = filterCandidatesByTargetBounds(candidates, target)
  boundedCandidates = preferTargetAccurateCandidates(boundedCandidates, target)
  let selected = selectDiverseCandidates(boundedCandidates, MIN_ROUTE_VARIANTS)

  if (selected.length < MIN_ROUTE_VARIANTS) {
    const existingKeys = new Set(candidates.map((candidate) => candidate.stopIds.join('|')))
    for (const spec of buildEmergencyDiversitySpecs(state, target)) {
      const candidate = await buildCandidate(state, spec, target, interestLabels)
      if (!candidate) continue
      const key = candidate.stopIds.join('|')
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      candidates.push(candidate)
    }
    boundedCandidates = filterCandidatesByTargetBounds(candidates, target)
    boundedCandidates = preferTargetAccurateCandidates(boundedCandidates, target)
    selected = selectDiverseCandidates(boundedCandidates, MIN_ROUTE_VARIANTS)
  }

  if (selected.length === 0) {
    throw new Error('Не удалось построить маршрут')
  }

  return {
    params: buildParams(state),
    variants: selected.map(({ score: _score, stopIds: _stopIds, ...variant }, index) => ({
      ...variant,
      id: `variant-${index + 1}`,
    })),
    createdAt: new Date().toISOString(),
  }
}

export function hasGenerationCoordinates(result: GenerationResult): boolean {
  const params = result.params
  return (
    typeof params.originLat === 'number' &&
    typeof params.originLng === 'number' &&
    typeof params.destinationLat === 'number' &&
    typeof params.destinationLng === 'number'
  )
}

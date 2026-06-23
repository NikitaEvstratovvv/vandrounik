import taxonomy from '@/data/place-taxonomy.json'
import type { InterestId, RoutePlace } from '@/types'

export type TypeGroupId =
  | 'fortresses'
  | 'manors'
  | 'palaces'
  | 'christian'
  | 'jewish'
  | 'muslim'
  | 'national_parks'
  | 'nature_reserves'
  | 'dots'

export type PlaceTaxonomy = {
  interest: InterestId
  typeGroup: TypeGroupId
  typeGroupLabel: string
}

const TYPE_REGISTRY = taxonomy.types as Record<string, PlaceTaxonomy>
const MARKER_COLORS = taxonomy.markerColors as Record<InterestId, string>

export function resolvePlaceTaxonomy(type: string): PlaceTaxonomy | null {
  return TYPE_REGISTRY[type] ?? null
}

export function primaryInterest(interests: InterestId[]): InterestId {
  return interests[0] ?? 'castles'
}

export function interestMarkerColor(interest: InterestId): string {
  return MARKER_COLORS[interest] ?? MARKER_COLORS.castles
}

export function enrichRoutePlace<T extends Pick<RoutePlace, 'type' | 'interests'>>(
  place: T,
): T & Pick<PlaceTaxonomy, 'typeGroup' | 'typeGroupLabel'> {
  const resolved = resolvePlaceTaxonomy(place.type)
  if (resolved) {
    return {
      ...place,
      typeGroup: resolved.typeGroup,
      typeGroupLabel: resolved.typeGroupLabel,
    }
  }
  return {
    ...place,
    typeGroup: 'fortresses',
    typeGroupLabel: place.type,
  }
}

export function formatPlaceTypeLabel(type: string, typeGroupLabel?: string): string {
  if (typeGroupLabel && typeGroupLabel !== type) {
    return `${typeGroupLabel} · ${type}`
  }
  return type
}

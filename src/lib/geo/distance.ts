import type { LatLng } from '@/types'

const EARTH_RADIUS_KM = 6371
const DEG_TO_RAD = Math.PI / 180

function toRad(value: number): number {
  return value * DEG_TO_RAD
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function toLocalKm(point: LatLng, origin: LatLng): { x: number; y: number } {
  const meanLat = toRad((point.lat + origin.lat) / 2)
  return {
    x: toRad(point.lng - origin.lng) * EARTH_RADIUS_KM * Math.cos(meanLat),
    y: toRad(point.lat - origin.lat) * EARTH_RADIUS_KM,
  }
}

export function segmentProjection(point: LatLng, start: LatLng, end: LatLng): number {
  const p = toLocalKm(point, start)
  const e = toLocalKm(end, start)
  const lengthSq = e.x ** 2 + e.y ** 2
  if (lengthSq === 0) return 0
  return (p.x * e.x + p.y * e.y) / lengthSq
}

export function distanceToSegmentKm(point: LatLng, start: LatLng, end: LatLng): number {
  const t = Math.min(1, Math.max(0, segmentProjection(point, start, end)))
  const e = toLocalKm(end, start)
  const p = toLocalKm(point, start)
  const closest = { x: e.x * t, y: e.y * t }
  return Math.hypot(p.x - closest.x, p.y - closest.y)
}

/** Азимут от origin к point, градусы 0–360 (0 = север, по часовой). */
export function bearingDeg(origin: LatLng, point: LatLng): number {
  const lat1 = toRad(origin.lat)
  const lat2 = toRad(point.lat)
  const dLng = toRad(point.lng - origin.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return bearing
}

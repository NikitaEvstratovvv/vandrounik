import type { LatLng, RouteStop } from '@/types'

function stopPoints(stops: RouteStop[]): LatLng[] {
  return stops.map((s) => ({ lat: s.lat, lng: s.lng }))
}

/** Yandex Maps multi-stop route URL (lat,lng order). */
export function yandexMapsRouteUrl(stops: RouteStop[]): string | null {
  const points = stopPoints(stops)
  if (points.length < 2) return null
  const rtext = points.map((p) => `${p.lat},${p.lng}`).join('~')
  return `https://yandex.ru/maps/?rtext=${encodeURIComponent(rtext)}&rtt=auto`
}

/** Google Maps directions URL (lng,lat via waypoints). */
export function googleMapsRouteUrl(stops: RouteStop[]): string | null {
  const points = stopPoints(stops)
  if (points.length < 2) return null
  const origin = `${points[0].lat},${points[0].lng}`
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`
  const middle = points.slice(1, -1)
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  })
  if (middle.length > 0) {
    params.set('waypoints', middle.map((p) => `${p.lat},${p.lng}`).join('|'))
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Yandex Maps single-point URL. */
export function yandexMapsPointUrl(point: LatLng): string {
  return `https://yandex.ru/maps/?pt=${point.lng},${point.lat}&z=16&l=map`
}

/** Google Maps single-point URL. */
export function googleMapsPointUrl(point: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`
}

export function openExternalUrl(url: string | null | undefined): void {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openExternalMap(url: string | null): void {
  openExternalUrl(url)
}

const TILE_SIZE = 256
const DEG_TO_RAD = Math.PI / 180

export function clampZoom(zoom: number): number {
  return Math.min(14, Math.max(5, zoom))
}

export function latLngToWorld(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const sin = Math.sin(lat * DEG_TO_RAD)
  const scale = TILE_SIZE * 2 ** zoom
  const x = ((lng + 180) / 360) * scale
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale
  return { x, y }
}

export function worldToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const scale = TILE_SIZE * 2 ** zoom
  const lng = (x / scale) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / scale
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
  return { lat, lng }
}

export function latLngToPixel(
  lat: number,
  lng: number,
  center: { lat: number; lng: number },
  zoom: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const centerWorld = latLngToWorld(center.lat, center.lng, zoom)
  const pointWorld = latLngToWorld(lat, lng, zoom)
  return {
    x: width / 2 + (pointWorld.x - centerWorld.x),
    y: height / 2 + (pointWorld.y - centerWorld.y),
  }
}

export function boundsCenter(points: { lat: number; lng: number }[]): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 53.9, lng: 27.56 }
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  }
}

export function fitZoom(
  points: { lat: number; lng: number }[],
  width: number,
  height: number,
  padding = 48,
): number {
  if (points.length === 0) return 8
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  for (let z = 14; z >= 5; z--) {
    const nw = latLngToWorld(maxLat, minLng, z)
    const se = latLngToWorld(minLat, maxLng, z)
    const w = Math.abs(se.x - nw.x)
    const h = Math.abs(se.y - nw.y)
    if (w + padding * 2 <= width && h + padding * 2 <= height) return z
  }
  return 6
}

export function tileRange(
  center: { lat: number; lng: number },
  zoom: number,
  width: number,
  height: number,
): { x: number; y: number; zoom: number }[] {
  const z = Math.floor(clampZoom(zoom))
  const centerWorld = latLngToWorld(center.lat, center.lng, z)
  const halfW = width / 2
  const halfH = height / 2

  const minX = Math.floor((centerWorld.x - halfW) / TILE_SIZE)
  const maxX = Math.floor((centerWorld.x + halfW) / TILE_SIZE)
  const minY = Math.floor((centerWorld.y - halfH) / TILE_SIZE)
  const maxY = Math.floor((centerWorld.y + halfH) / TILE_SIZE)

  const tiles: { x: number; y: number; zoom: number }[] = []
  const maxIndex = 2 ** z - 1
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (x < 0 || y < 0 || x > maxIndex || y > maxIndex) continue
      tiles.push({ x, y, zoom: z })
    }
  }
  return tiles
}

export function tileUrl(x: number, y: number, zoom: number): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}

export function tilePosition(
  x: number,
  y: number,
  center: { lat: number; lng: number },
  zoom: number,
  width: number,
  height: number,
): { left: number; top: number } {
  const centerWorld = latLngToWorld(center.lat, center.lng, zoom)
  const tileWorldX = x * TILE_SIZE
  const tileWorldY = y * TILE_SIZE
  return {
    left: width / 2 + (tileWorldX - centerWorld.x),
    top: height / 2 + (tileWorldY - centerWorld.y),
  }
}

/** Новый центр после зума, чтобы точка под pixel осталась на месте. */
export function zoomAtPoint(
  currentZoom: number,
  nextZoom: number,
  center: { lat: number; lng: number },
  pixel: { x: number; y: number },
  size: { width: number; height: number },
): { lat: number; lng: number } {
  const z = clampZoom(nextZoom)
  if (z === currentZoom) return center

  const centerWorld = latLngToWorld(center.lat, center.lng, currentZoom)
  const dx = pixel.x - size.width / 2
  const dy = pixel.y - size.height / 2
  const focusWorldX = centerWorld.x + dx
  const focusWorldY = centerWorld.y + dy
  const scale = 2 ** (z - currentZoom)
  const newCenterWorld = {
    x: focusWorldX * scale - dx,
    y: focusWorldY * scale - dy,
  }
  return worldToLatLng(newCenterWorld.x, newCenterWorld.y, z)
}

export function pointerDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

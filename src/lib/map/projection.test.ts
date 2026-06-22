import { describe, expect, it } from 'vitest'
import { latLngToPixel, latLngToWorld, worldToLatLng, zoomAtPoint } from './projection'

const SIZE = { width: 360, height: 600 }
const CENTER = { lat: 53.9, lng: 27.56 }

describe('zoomAtPoint', () => {
  it('preserves geographic center when focal is at viewport center', () => {
    const focal = { x: SIZE.width / 2, y: SIZE.height / 2 }

    const zoomedIn = zoomAtPoint(8, 10, CENTER, focal, SIZE)
    expect(zoomedIn.lat).toBeCloseTo(CENTER.lat, 8)
    expect(zoomedIn.lng).toBeCloseTo(CENTER.lng, 8)

    const zoomedOut = zoomAtPoint(10, 7, CENTER, focal, SIZE)
    expect(zoomedOut.lat).toBeCloseTo(CENTER.lat, 8)
    expect(zoomedOut.lng).toBeCloseTo(CENTER.lng, 8)
  })

  it('keeps the geographic point under the focal pixel after zoom', () => {
    const focal = { x: 120, y: 200 }
    const currentZoom = 8.5
    const nextZoom = 10.25

    const focusWorld = latLngToWorld(CENTER.lat, CENTER.lng, currentZoom)
    const dx = focal.x - SIZE.width / 2
    const dy = focal.y - SIZE.height / 2
    const focusGeo = worldToLatLng(focusWorld.x + dx, focusWorld.y + dy, currentZoom)

    const nextCenter = zoomAtPoint(currentZoom, nextZoom, CENTER, focal, SIZE)
    const pixelAfterZoom = latLngToPixel(
      focusGeo.lat,
      focusGeo.lng,
      nextCenter,
      nextZoom,
      SIZE.width,
      SIZE.height,
    )

    expect(pixelAfterZoom.x).toBeCloseTo(focal.x, 4)
    expect(pixelAfterZoom.y).toBeCloseTo(focal.y, 4)
  })
})

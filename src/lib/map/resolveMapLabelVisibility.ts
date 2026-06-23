export type PlacedMapLabel = {
  placeId: string
  markerX: number
  y: number
  width: number
}

export type MapLabelCandidate = {
  placeId: string
  name: string
  markerX: number
  markerY: number
  order: number
  isSelected: boolean
}

type Rect = { x: number; y: number; width: number; height: number }

export const MAP_LABEL_FONT_SIZE = 10
export const MAP_LABEL_HEIGHT = 14
export const MAP_LABEL_MAX_WIDTH = 144
export const POI_MARKER_SIZE = 20
export const LABEL_OFFSET_Y = 12
export const LABEL_HALO_PAD = 3
const LABEL_PADDING = 4

export type MapLabelBounds = {
  width: number
  height: number
  lines: string[]
}

function rectsOverlap(a: Rect, b: Rect, pad = LABEL_PADDING): boolean {
  return !(
    a.x + a.width + pad <= b.x ||
    b.x + b.width + pad <= a.x ||
    a.y + a.height + pad <= b.y ||
    b.y + b.height + pad <= a.y
  )
}

function markerRect(candidate: MapLabelCandidate): Rect {
  const half = POI_MARKER_SIZE / 2
  return {
    x: candidate.markerX - half,
    y: candidate.markerY - half,
    width: POI_MARKER_SIZE,
    height: POI_MARKER_SIZE,
  }
}

export function estimateLabelWidth(name: string, measure?: (text: string) => number): number {
  if (measure) return measure(name)
  return name.length * 5.4
}

let labelMeasureContext: CanvasRenderingContext2D | null = null

/** Measures POI label width in screen pixels (Inter 10px medium). */
export function measureMapLabelWidth(text: string): number {
  if (typeof document !== 'undefined') {
    if (!labelMeasureContext) {
      const canvas = document.createElement('canvas')
      labelMeasureContext = canvas.getContext('2d')
    }
    if (labelMeasureContext) {
      labelMeasureContext.font = `500 ${MAP_LABEL_FONT_SIZE}px 'Inter', system-ui, -apple-system, sans-serif`
      return labelMeasureContext.measureText(text).width
    }
  }
  return estimateLabelWidth(text)
}

function measureLineWidth(text: string, measureWidth?: (text: string) => number): number {
  return measureWidth ? measureWidth(text) : measureMapLabelWidth(text)
}

/** Word-wraps label text to fit within max width (breaks long tokens by character). */
export function wrapMapLabelText(
  text: string,
  maxWidth: number = MAP_LABEL_MAX_WIDTH,
  measureWidth?: (text: string) => number,
): string[] {
  const measure = (line: string) => measureLineWidth(line, measureWidth)
  const trimmed = text.trim()
  if (!trimmed) return ['']

  const lines: string[] = []
  let current = ''

  const pushLongToken = (token: string) => {
    let chunk = ''
    for (const char of token) {
      const next = chunk + char
      if (measure(next) <= maxWidth) {
        chunk = next
        continue
      }
      if (chunk) lines.push(chunk)
      chunk = char
    }
    current = chunk
  }

  for (const word of trimmed.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word
    if (measure(candidate) <= maxWidth) {
      current = candidate
      continue
    }
    if (current) {
      lines.push(current)
      current = ''
    }
    if (measure(word) <= maxWidth) {
      current = word
    } else {
      pushLongToken(word)
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

export function measureMapLabelBounds(
  text: string,
  measureWidth?: (text: string) => number,
  maxWidth: number = MAP_LABEL_MAX_WIDTH,
): MapLabelBounds {
  const lines = wrapMapLabelText(text, maxWidth, measureWidth)
  const measure = (line: string) => measureLineWidth(line, measureWidth)
  const width = Math.min(maxWidth, Math.max(...lines.map(measure), 0))
  return {
    width,
    height: lines.length * MAP_LABEL_HEIGHT,
    lines,
  }
}

export function labelRectBelowCenter(
  candidate: MapLabelCandidate,
  width: number,
  height: number = MAP_LABEL_HEIGHT,
): Rect {
  return {
    x: candidate.markerX - width / 2,
    y: candidate.markerY + LABEL_OFFSET_Y,
    width,
    height,
  }
}

function labelCollisionRect(rect: Rect): Rect {
  return {
    x: rect.x - LABEL_HALO_PAD,
    y: rect.y - LABEL_HALO_PAD,
    width: rect.width + LABEL_HALO_PAD * 2,
    height: rect.height + LABEL_HALO_PAD * 2,
  }
}

/** Greedy label placement below marker center with collision avoidance. */
export function resolveMapLabelVisibility(
  candidates: MapLabelCandidate[],
  measureWidth?: (text: string) => number,
): PlacedMapLabel[] {
  const sorted = [...candidates].sort((a, b) => {
    if (a.isSelected !== b.isSelected) return a.isSelected ? -1 : 1
    return a.order - b.order
  })

  const placedLabelRects: Rect[] = []
  const result: PlacedMapLabel[] = []

  for (const candidate of sorted) {
    const bounds = measureMapLabelBounds(candidate.name, measureWidth)
    const rect = labelRectBelowCenter(candidate, bounds.width, bounds.height)
    const collisionRect = labelCollisionRect(rect)
    const markerObstacles = candidates
      .filter(
        (other) =>
          other.placeId !== candidate.placeId &&
          (other.markerX !== candidate.markerX || other.markerY !== candidate.markerY),
      )
      .map(markerRect)
    const collidesWithMarker = markerObstacles.some((existing) => rectsOverlap(rect, existing, 0))
    const collidesWithLabel = placedLabelRects.some((existing) =>
      rectsOverlap(collisionRect, existing),
    )
    const collides = collidesWithMarker || collidesWithLabel

    if (!collides || candidate.isSelected) {
      result.push({
        placeId: candidate.placeId,
        markerX: candidate.markerX,
        y: rect.y,
        width: bounds.width,
      })
      placedLabelRects.push(collisionRect)
    }
  }

  return result
}

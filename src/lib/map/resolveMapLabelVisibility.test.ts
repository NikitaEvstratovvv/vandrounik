import { describe, expect, it } from 'vitest'
import {
  estimateLabelWidth,
  LABEL_OFFSET_Y,
  MAP_LABEL_HEIGHT,
  MAP_LABEL_MAX_WIDTH,
  labelRectBelowCenter,
  measureMapLabelBounds,
  resolveMapLabelVisibility,
  wrapMapLabelText,
  type MapLabelCandidate,
} from './resolveMapLabelVisibility'

function candidate(
  overrides: Partial<MapLabelCandidate> & Pick<MapLabelCandidate, 'placeId' | 'name'>,
): MapLabelCandidate {
  return {
    markerX: 100,
    markerY: 100,
    order: 1,
    isSelected: false,
    ...overrides,
  }
}

describe('resolveMapLabelVisibility', () => {
  it('places label centered below marker', () => {
    const width = 80
    const rect = labelRectBelowCenter(candidate({ placeId: 'a', name: 'Test' }), width)
    expect(rect.x).toBe(60)
    expect(rect.y).toBe(100 + LABEL_OFFSET_Y)
  })

  it('returns marker-centered placement width for rendering', () => {
    const result = resolveMapLabelVisibility(
      [candidate({ placeId: 'a', name: 'Museum', markerX: 200, markerY: 150, order: 1 })],
      (text) => text.length * 8,
    )
    expect(result[0]).toMatchObject({
      placeId: 'a',
      markerX: 200,
      y: 150 + LABEL_OFFSET_Y,
      width: 48,
    })
  })

  it('shows both labels when markers are far apart', () => {
    const result = resolveMapLabelVisibility(
      [
        candidate({ placeId: 'a', name: 'Place A', markerX: 50, markerY: 50, order: 1 }),
        candidate({ placeId: 'b', name: 'Place B', markerX: 300, markerY: 300, order: 2 }),
      ],
      (text) => text.length * 8,
    )
    expect(result).toHaveLength(2)
    expect(result.map((l) => l.placeId).sort()).toEqual(['a', 'b'])
  })

  it('hides lower-priority label when markers coincide', () => {
    const result = resolveMapLabelVisibility(
      [
        candidate({ placeId: 'early', name: 'Early', markerX: 100, markerY: 100, order: 1 }),
        candidate({ placeId: 'late', name: 'Late', markerX: 100, markerY: 100, order: 2 }),
      ],
      (text) => text.length * 8,
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.placeId).toBe('early')
  })

  it('always shows selected stop label even when crowded', () => {
    const result = resolveMapLabelVisibility(
      [
        candidate({ placeId: 'first', name: 'First', markerX: 100, markerY: 100, order: 1 }),
        candidate({
          placeId: 'selected',
          name: 'Selected',
          markerX: 100,
          markerY: 100,
          order: 2,
          isSelected: true,
        }),
      ],
      (text) => text.length * 8,
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.placeId).toBe('selected')
  })

  it('limits visible labels in a tight cluster', () => {
    const cluster = [0, 24, 48].flatMap((dx, i) =>
      [0, 24, 48].map((dy, j) =>
        candidate({
          placeId: `p-${i}-${j}`,
          name: `P${i}${j}`,
          markerX: 100 + dx,
          markerY: 100 + dy,
          order: i * 3 + j + 1,
        }),
      ),
    )
    const result = resolveMapLabelVisibility(cluster, (text) => text.length * 8)
    expect(result.length).toBeLessThan(cluster.length)
    expect(result.length).toBeGreaterThan(0)
  })

  it('prefers earlier order when placement slots compete', () => {
    const result = resolveMapLabelVisibility(
      [
        candidate({ placeId: 'one', name: 'One', markerX: 100, markerY: 100, order: 1 }),
        candidate({ placeId: 'two', name: 'Two', markerX: 118, markerY: 100, order: 2 }),
      ],
      (text) => text.length * 8,
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.placeId).toBe('one')
  })

  it('avoids overlapping a neighboring marker bbox', () => {
    const result = resolveMapLabelVisibility(
      [
        candidate({ placeId: 'left', name: 'Left', markerX: 100, markerY: 100, order: 1 }),
        candidate({ placeId: 'right', name: 'Right', markerX: 118, markerY: 100, order: 2 }),
      ],
      (text) => text.length * 8,
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.placeId).toBe('left')
  })
})

describe('estimateLabelWidth', () => {
  it('uses custom measure function when provided', () => {
    expect(estimateLabelWidth('Test', () => 42)).toBe(42)
  })

  it('falls back to character heuristic', () => {
    expect(estimateLabelWidth('abcd')).toBe(21.6)
  })
})

describe('wrapMapLabelText', () => {
  const measure = (text: string) => text.length * 8

  it('keeps short names on one line', () => {
    expect(wrapMapLabelText('Short', MAP_LABEL_MAX_WIDTH, measure)).toEqual(['Short'])
  })

  it('wraps long names to multiple lines', () => {
    const lines = wrapMapLabelText('Very Long Place Name Here', 40, measure)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toContain('Very')
  })
})

describe('measureMapLabelBounds', () => {
  it('caps width at max and grows height for wrapped text', () => {
    const measure = (text: string) => text.length * 8
    const bounds = measureMapLabelBounds('A very long place name indeed', measure, 48)
    expect(bounds.width).toBeLessThanOrEqual(48)
    expect(bounds.height).toBeGreaterThan(MAP_LABEL_HEIGHT)
    expect(bounds.lines.length).toBeGreaterThan(1)
  })
})

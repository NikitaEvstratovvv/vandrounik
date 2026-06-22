import { Box } from '@chakra-ui/react'
import type { LatLng, RouteStop } from '@/types'

/** Цвет линии маршрута — brand.primary из design-tokens.md */
const ROUTE_LINE_COLOR = '#2D6A4F'

type RouteMapPreviewProps = {
  stops: RouteStop[]
  geometry?: LatLng[]
}

/** Мини-карта 16:9 с линией маршрута (E2 route card). */
export function RouteMapPreview({ stops, geometry }: RouteMapPreviewProps) {
  const line = geometry && geometry.length > 0 ? geometry : stops
  const points = line.map((s) => ({ x: s.lng, y: s.lat }))
  const all = points.length > 0 ? points : [{ x: 27.5, y: 53.9 }]

  const minX = Math.min(...all.map((p) => p.x))
  const maxX = Math.max(...all.map((p) => p.x))
  const minY = Math.min(...all.map((p) => p.y))
  const maxY = Math.max(...all.map((p) => p.y))

  const pad = 0.15
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const toSvg = (p: { x: number; y: number }) => {
    const nx = pad + ((p.x - minX) / rangeX) * (1 - pad * 2)
    const ny = pad + ((maxY - p.y) / rangeY) * (1 - pad * 2)
    return { x: nx * 100, y: ny * 100 }
  }

  const svgPoints = all.map(toSvg)
  const polyline = svgPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <Box
      position="relative"
      w="full"
      aspectRatio="16 / 9"
      borderRadius="sm"
      overflow="hidden"
      bg="secondary"
    >
      <svg viewBox="0 0 100 56.25" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <polyline
          points={polyline}
          fill="none"
          stroke={ROUTE_LINE_COLOR}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {svgPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={ROUTE_LINE_COLOR} />
        ))}
      </svg>
    </Box>
  )
}

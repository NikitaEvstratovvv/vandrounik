import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Box, Image, Text } from '@chakra-ui/react'
import { MapStopLabel } from '@/components/map/MapStopLabel'
import { MapWaypointMarker, ENDPOINT_MARKER_ANCHOR_Y } from '@/components/map/MapWaypointMarker'
import {
  boundsCenter,
  clampZoom,
  fitZoom,
  latLngToPixel,
  latLngToWorld,
  pointerDistance,
  tilePosition,
  tileRange,
  tileUrl,
  worldToLatLng,
  zoomAtPoint,
} from '@/lib/map/projection'
import {
  measureMapLabelWidth,
  resolveMapLabelVisibility,
} from '@/lib/map/resolveMapLabelVisibility'
import { isRoutePlaceStop, isRouteEndpoint } from '@/lib/routing/routeStops'
import type { LatLng, RouteStop } from '@/types'

const ROUTE_COLOR = '#0a0a0a'
const ZOOM_ANIM_MS = 280
const BUTTON_ZOOM_STEP = 0.85
const WHEEL_ZOOM_SENSITIVITY = 0.0022

type InteractiveRouteMapProps = {
  stops: RouteStop[]
  geometry?: LatLng[]
  onStopClick?: (stop: RouteStop) => void
  selectedStopId?: string | null
}

export type InteractiveRouteMapRef = {
  zoomIn: () => void
  zoomOut: () => void
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  startLat: number
  startLng: number
}

type PinchState = {
  startDistance: number
  startZoom: number
  startCenter: { lat: number; lng: number }
  focal: { x: number; y: number }
}

function clientToLocal(container: HTMLElement, clientX: number, clientY: number) {
  const rect = container.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function pinchCentroid(pointers: Map<number, { x: number; y: number }>) {
  const values = [...pointers.values()]
  const x = values.reduce((sum, p) => sum + p.x, 0) / values.length
  const y = values.reduce((sum, p) => sum + p.y, 0) / values.length
  return { x, y }
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export const InteractiveRouteMap = forwardRef<InteractiveRouteMapRef, InteractiveRouteMapProps>(
  function InteractiveRouteMap({ stops, geometry, onStopClick, selectedStopId }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<DragState | null>(null)
    const pointersRef = useRef(new Map<number, { x: number; y: number }>())
    const pinchRef = useRef<PinchState | null>(null)
    const fittedStopsKeyRef = useRef<string | null>(null)
    const animFrameRef = useRef<number | null>(null)
    const zoomRef = useRef(8)
    const centerRef = useRef(boundsCenter(stops))
    const sizeRef = useRef({ width: 360, height: 600 })

    const [size, setSize] = useState({ width: 360, height: 600 })
    const [center, setCenter] = useState(() => boundsCenter(stops))
    const [zoom, setZoom] = useState(8)

    const stopsKey = useMemo(() => stops.map((s) => s.placeId).join('|'), [stops])
    const tileZoom = Math.floor(clampZoom(zoom))
    const zoomScale = 2 ** (zoom - tileZoom)

    const setZoomCenter = useCallback((nextZoom: number, nextCenter: { lat: number; lng: number }) => {
      const z = clampZoom(nextZoom)
      zoomRef.current = z
      centerRef.current = nextCenter
      setZoom(z)
      setCenter(nextCenter)
    }, [])

    const cancelZoomAnimation = useCallback(() => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }, [])

    useEffect(() => {
      zoomRef.current = zoom
    }, [zoom])

    useEffect(() => {
      centerRef.current = center
    }, [center])

    useEffect(() => {
      sizeRef.current = size
    }, [size])

    useEffect(() => () => cancelZoomAnimation(), [cancelZoomAnimation])

    useEffect(() => {
      const el = containerRef.current
      if (!el) return
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      })
      ro.observe(el)
      return () => ro.disconnect()
    }, [])

    const fitToStops = useCallback(() => {
      const { width, height } = sizeRef.current
      if (width <= 0 || height <= 0) return
      const points = stops.map((s) => ({ lat: s.lat, lng: s.lng }))
      const nextCenter = boundsCenter(points)
      const nextZoom = fitZoom(points, width, height, 64)
      setZoomCenter(nextZoom, nextCenter)
    }, [setZoomCenter, stops])

    const animateFitToStops = useCallback(() => {
      const { width, height } = sizeRef.current
      if (width <= 0 || height <= 0) return

      const points = stops.map((s) => ({ lat: s.lat, lng: s.lng }))
      const targetCenter = boundsCenter(points)
      const targetZoom = fitZoom(points, width, height, 64)

      cancelZoomAnimation()
      const startZoom = zoomRef.current
      const startCenter = { ...centerRef.current }

      if (Math.abs(targetZoom - startZoom) < 0.0001 &&
          Math.abs(targetCenter.lat - startCenter.lat) < 0.000001 &&
          Math.abs(targetCenter.lng - startCenter.lng) < 0.000001) {
        return
      }

      const startedAt = performance.now()

      const tick = (now: number) => {
        const progress = easeOutCubic(Math.min(1, (now - startedAt) / ZOOM_ANIM_MS))
        const z = startZoom + (targetZoom - startZoom) * progress
        const lat = startCenter.lat + (targetCenter.lat - startCenter.lat) * progress
        const lng = startCenter.lng + (targetCenter.lng - startCenter.lng) * progress
        setZoomCenter(z, { lat, lng })

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick)
        } else {
          animFrameRef.current = null
        }
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }, [cancelZoomAnimation, setZoomCenter, stops])

    useEffect(() => {
      if (fittedStopsKeyRef.current === stopsKey) return
      const isInitial = fittedStopsKeyRef.current === null
      fittedStopsKeyRef.current = stopsKey
      cancelZoomAnimation()
      if (isInitial) {
        fitToStops()
      } else {
        animateFitToStops()
      }
    }, [stopsKey, fitToStops, animateFitToStops, cancelZoomAnimation])

    const applyZoom = useCallback(
      (nextZoom: number, focal: { x: number; y: number }) => {
        const z = clampZoom(nextZoom)
        if (Math.abs(z - zoomRef.current) < 0.0001) return
        const nextCenter = zoomAtPoint(zoomRef.current, z, centerRef.current, focal, sizeRef.current)
        setZoomCenter(z, nextCenter)
      },
      [setZoomCenter],
    )

    const animateZoomTo = useCallback(
      (targetZoom: number, focal: { x: number; y: number }) => {
        cancelZoomAnimation()
        const startZoom = zoomRef.current
        const startCenter = { ...centerRef.current }
        const target = clampZoom(targetZoom)
        if (Math.abs(target - startZoom) < 0.0001) return

        const startedAt = performance.now()

        const tick = (now: number) => {
          const progress = easeOutCubic(Math.min(1, (now - startedAt) / ZOOM_ANIM_MS))
          const z = startZoom + (target - startZoom) * progress
          const nextCenter = zoomAtPoint(startZoom, z, startCenter, focal, sizeRef.current)
          setZoomCenter(z, nextCenter)

          if (progress < 1) {
            animFrameRef.current = requestAnimationFrame(tick)
          } else {
            animFrameRef.current = null
          }
        }

        animFrameRef.current = requestAnimationFrame(tick)
      },
      [cancelZoomAnimation, setZoomCenter],
    )

    const zoomIn = useCallback(() => {
      animateZoomTo(zoomRef.current + BUTTON_ZOOM_STEP, {
        x: sizeRef.current.width / 2,
        y: sizeRef.current.height / 2,
      })
    }, [animateZoomTo])

    const zoomOut = useCallback(() => {
      animateZoomTo(zoomRef.current - BUTTON_ZOOM_STEP, {
        x: sizeRef.current.width / 2,
        y: sizeRef.current.height / 2,
      })
    }, [animateZoomTo])

    useImperativeHandle(ref, () => ({ zoomIn, zoomOut }), [zoomIn, zoomOut])

    const tiles = useMemo(
      () => tileRange(center, tileZoom, size.width, size.height),
      [center, tileZoom, size.width, size.height],
    )

    const routePoints = useMemo(() => {
      const line = geometry && geometry.length > 0 ? geometry : stops
      if (line.length === 0) return ''
      const coords = line.map((point) => {
        const p = latLngToPixel(point.lat, point.lng, center, tileZoom, size.width, size.height)
        return `${p.x},${p.y}`
      })
      if (!geometry && stops.length > 1) {
        const first = latLngToPixel(stops[0].lat, stops[0].lng, center, tileZoom, size.width, size.height)
        coords.push(`${first.x},${first.y}`)
      }
      return coords.join(' ')
    }, [geometry, stops, center, tileZoom, size.width, size.height])

    const visibleLabels = useMemo(() => {
      const candidates = stops
        .filter(isRoutePlaceStop)
        .map((stop) => {
          const p = latLngToPixel(stop.lat, stop.lng, center, tileZoom, size.width, size.height)
          return {
            placeId: stop.placeId,
            name: stop.name,
            markerX: p.x,
            markerY: p.y,
            order: stop.order,
            isSelected: selectedStopId === stop.placeId,
          }
        })
      return resolveMapLabelVisibility(candidates, measureMapLabelWidth)
    }, [stops, center, tileZoom, size.width, size.height, selectedStopId])

    const stopNameByPlaceId = useMemo(
      () => new Map(stops.map((stop) => [stop.placeId, stop.name])),
      [stops],
    )

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-map-marker]')) return
        cancelZoomAnimation()
        const container = containerRef.current
        if (!container) return

        const local = clientToLocal(container, e.clientX, e.clientY)
        pointersRef.current.set(e.pointerId, local)

        if (pointersRef.current.size === 2) {
          dragRef.current = null
          const pts = [...pointersRef.current.values()]
          pinchRef.current = {
            startDistance: pointerDistance(pts[0], pts[1]),
            startZoom: zoomRef.current,
            startCenter: { ...centerRef.current },
            focal: pinchCentroid(pointersRef.current),
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          return
        }

        if (pointersRef.current.size === 1) {
          dragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startLat: centerRef.current.lat,
            startLng: centerRef.current.lng,
          }
          e.currentTarget.setPointerCapture(e.pointerId)
        }
      },
      [cancelZoomAnimation],
    )

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const container = containerRef.current
        if (!container) return

        if (pointersRef.current.has(e.pointerId)) {
          pointersRef.current.set(e.pointerId, clientToLocal(container, e.clientX, e.clientY))
        }

        const pinch = pinchRef.current
        if (pinch && pointersRef.current.size >= 2) {
          const pts = [...pointersRef.current.values()]
          if (pts.length < 2 || pinch.startDistance <= 0) return

          const distance = pointerDistance(pts[0], pts[1])
          const focal = pinchCentroid(pointersRef.current)
          const nextZoom = clampZoom(pinch.startZoom + Math.log2(distance / pinch.startDistance))
          const nextCenter = zoomAtPoint(pinch.startZoom, nextZoom, pinch.startCenter, focal, sizeRef.current)
          setZoomCenter(nextZoom, nextCenter)
          return
        }

        const drag = dragRef.current
        if (!drag || drag.pointerId !== e.pointerId) return
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        const currentZoom = zoomRef.current
        const startWorld = latLngToWorld(drag.startLat, drag.startLng, currentZoom)
        const next = worldToLatLng(startWorld.x - dx, startWorld.y - dy, currentZoom)
        setZoomCenter(currentZoom, next)
      },
      [setZoomCenter],
    )

    const endPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size < 2) {
        pinchRef.current = null
      }
      if (dragRef.current?.pointerId === e.pointerId) {
        dragRef.current = null
      }
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    }, [])

    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault()
        cancelZoomAnimation()
        const container = containerRef.current
        if (!container) return
        const focal = clientToLocal(container, e.clientX, e.clientY)
        applyZoom(zoomRef.current - e.deltaY * WHEEL_ZOOM_SENSITIVITY, focal)
      },
      [applyZoom, cancelZoomAnimation],
    )

    return (
      <Box
        ref={containerRef}
        position="absolute"
        inset={0}
        overflow="hidden"
        bg="#e8ecef"
        cursor="grab"
        touchAction="none"
        _active={{ cursor: 'grabbing' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={handleWheel}
      >
        <Box
          position="absolute"
          inset={0}
          w={`${size.width}px`}
          h={`${size.height}px`}
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: `${size.width / 2}px ${size.height / 2}px`,
            willChange: 'transform',
          }}
        >
          {tiles.map((tile) => {
            const pos = tilePosition(tile.x, tile.y, center, tileZoom, size.width, size.height)
            return (
              <Image
                key={`${tile.zoom}-${tile.x}-${tile.y}`}
                src={tileUrl(tile.x, tile.y, tile.zoom)}
                alt=""
                position="absolute"
                left={`${pos.left}px`}
                top={`${pos.top}px`}
                w="256px"
                h="256px"
                draggable={false}
                userSelect="none"
                pointerEvents="none"
              />
            )
          })}

          {routePoints ? (
            <svg
              width={size.width}
              height={size.height}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <polyline
                points={routePoints}
                fill="none"
                stroke={ROUTE_COLOR}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}

          {stops.map((stop) => {
            const p = latLngToPixel(stop.lat, stop.lng, center, tileZoom, size.width, size.height)
            const isSelected = selectedStopId === stop.placeId
            return (
              <Box
                key={stop.placeId}
                data-map-marker
                position="absolute"
                left={`${p.x}px`}
                top={`${p.y}px`}
                transform={
                  isRouteEndpoint(stop)
                    ? `translate(-50%, -${ENDPOINT_MARKER_ANCHOR_Y}px)`
                    : 'translate(-50%, -50%)'
                }
                pointerEvents="auto"
                cursor="pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onStopClick?.(stop)
                }}
              >
                <MapWaypointMarker stop={stop} isSelected={isSelected} />
              </Box>
            )
          })}

          {visibleLabels.map((label) => (
            <Box
              key={label.placeId}
              position="absolute"
              left={`${label.markerX}px`}
              top={`${label.y}px`}
              width={`${label.width}px`}
              transform="translateX(-50%)"
              pointerEvents="none"
            >
              <MapStopLabel>{stopNameByPlaceId.get(label.placeId) ?? ''}</MapStopLabel>
            </Box>
          ))}
        </Box>

        <Text
          position="absolute"
          right="8px"
          bottom="4px"
          fontSize="10px"
          color="muted"
          pointerEvents="none"
          bg="rgba(255,255,255,0.7)"
          px="4px"
          borderRadius="sm"
        >
          © OpenStreetMap
        </Text>
      </Box>
    )
  },
)

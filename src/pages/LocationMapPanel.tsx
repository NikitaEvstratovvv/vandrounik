import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, chakra, Flex, Image, Text } from '@chakra-ui/react'
import { BottomSheet } from '@/components/BottomSheet'
import { EmblemLoader } from '@/components/EmblemLoader'
import { ChevronLeft, CloseCircleIcon, SearchIcon } from '@/components/icons'
import { MapZoomControls } from '@/components/MapZoomControls'
import { PrimaryButton } from '@/components/PrimaryButton'
import { RingSpinner } from '@/components/Spinner'
import { resolvePlaceAt, searchPlaces } from '@/data/places'
import { formatDistance } from '@/lib/format'
import { haversineKm } from '@/lib/geo/distance'
import {
  clampZoom,
  latLngToPixel,
  latLngToWorld,
  pointerDistance,
  tilePosition,
  tileRange,
  tileUrl,
  worldToLatLng,
  zoomAtPoint,
} from '@/lib/map/projection'
import { roundRouteKm } from '@/lib/routing/directRouteKm'
import { mapFrostedGradientLayer } from '@/theme/mapOverlay'
import type { LatLng, Place } from '@/types'

const BELARUS_CENTER: LatLng = { lat: 53.7, lng: 27.95 }
const DEFAULT_ZOOM = 7
const PLACE_ZOOM = 13
const BUTTON_ZOOM_STEP = 0.85
const WHEEL_ZOOM_SENSITIVITY = 0.0022
const ZOOM_ANIM_MS = 280

type LocationMapPanelProps = {
  point: 'origin' | 'destination'
  /** Already chosen place for this field, or a nearby seed (e.g. origin when picking destination). */
  initialCenter?: Place | LatLng | null
  /** Map-first + search sheet (Yandex-style). Default for S1. */
  enableSearch?: boolean
  /** Bias search + show distance (typically origin when picking destination). */
  near?: LatLng | null
  /** Header title override (e.g. «Город» on walk). */
  title?: string
  onClose: () => void
  onConfirm: (place: Place) => void
}

type ResolveState = 'idle' | 'loading' | 'ready' | 'error'
type SearchState = 'empty' | 'loading' | 'results' | 'nothing' | 'error'

/**
 * S1 location — map-first; with `enableSearch`: field + BottomSheet, confirm on map.
 * Composed: same tile engine as InteractiveRouteMap, no Figma node.
 */
export function LocationMapPanel({
  point,
  initialCenter = null,
  enableSearch = false,
  near = null,
  title: titleProp,
  onClose,
  onConfirm,
}: LocationMapPanelProps) {
  const seed = initialCenter ?? BELARUS_CENTER
  const startZoom = initialCenter ? PLACE_ZOOM : DEFAULT_ZOOM

  const title =
    titleProp ??
    (enableSearch
      ? point === 'destination'
        ? 'Куда'
        : 'Откуда'
      : point === 'destination'
        ? 'Куда на карте'
        : 'Откуда на карте')
  const hint =
    point === 'destination' ? 'Нажми на карту, куда ехать' : 'Нажми на карту, откуда начать'
  const searchEmptyText =
    point === 'destination'
      ? 'Укажи место, куда хочешь приехать'
      : 'Укажи место, откуда хочешь начать поездку'

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [center, setCenter] = useState<LatLng>(() => ({ lat: seed.lat, lng: seed.lng }))
  const [zoom, setZoom] = useState(startZoom)
  const [tileZoom, setTileZoom] = useState(() => Math.floor(startZoom))
  const [pin, setPin] = useState<LatLng | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [status, setStatus] = useState<ResolveState>('idle')
  const [errorText, setErrorText] = useState('')

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchStatus, setSearchStatus] = useState<SearchState>('empty')
  const [results, setResults] = useState<Place[]>([])
  const searchReqId = useRef(0)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const zoomRef = useRef(zoom)
  const centerRef = useRef(center)
  const sizeRef = useRef(size)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startLat: number
    startLng: number
    moved: boolean
  } | null>(null)
  const pinchRef = useRef<{
    startDistance: number
    startZoom: number
    startCenter: LatLng
  } | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const resolveSeq = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])
  useEffect(() => {
    centerRef.current = center
  }, [center])
  useEffect(() => {
    sizeRef.current = size
  }, [size])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const sync = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      searchAbortRef.current?.abort()
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const setZoomCenter = useCallback((z: number, next: LatLng, commitTiles = true) => {
    const clamped = clampZoom(z)
    zoomRef.current = clamped
    centerRef.current = next
    setZoom(clamped)
    setCenter(next)
    if (commitTiles) setTileZoom(Math.floor(clamped))
  }, [])

  const cancelZoomAnimation = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
  }, [])

  const animateZoomTo = useCallback(
    (targetZoom: number, focal: { x: number; y: number }) => {
      cancelZoomAnimation()
      const startZoomValue = zoomRef.current
      const startCenter = { ...centerRef.current }
      const target = clampZoom(targetZoom)
      if (Math.abs(target - startZoomValue) < 0.0001) return

      const startedAt = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / ZOOM_ANIM_MS)
        const eased = 1 - (1 - t) ** 3
        const z = startZoomValue + (target - startZoomValue) * eased
        const nextCenter = zoomAtPoint(startZoomValue, z, startCenter, focal, sizeRef.current)
        setZoomCenter(z, nextCenter, false)
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick)
        } else {
          animFrameRef.current = null
          setZoomCenter(target, nextCenter, true)
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

  const applyCandidate = useCallback(
    (candidate: Place) => {
      resolveSeq.current++
      abortRef.current?.abort()
      setPin({ lat: candidate.lat, lng: candidate.lng })
      setPlace(candidate)
      setStatus('ready')
      setErrorText('')
      setZoomCenter(PLACE_ZOOM, { lat: candidate.lat, lng: candidate.lng }, true)
      setSearchOpen(false)
    },
    [setZoomCenter],
  )

  const resolvePin = useCallback(
    async (pointLatLng: LatLng) => {
      setSearchOpen(false)
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const seq = ++resolveSeq.current
      setStatus('loading')
      setPlace(null)
      setErrorText('')
      try {
        const found = await resolvePlaceAt(pointLatLng, { signal: controller.signal })
        if (seq !== resolveSeq.current) return
        if (!found) {
          setStatus('error')
          setErrorText('Точка вне Беларуси или место не найдено')
          return
        }
        setPlace(found)
        setStatus('ready')
      } catch {
        if (controller.signal.aborted) return
        if (seq !== resolveSeq.current) return
        setStatus('error')
        setErrorText('Не удалось определить место. Попробуй ещё раз')
      }
    },
    [],
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (searchDebounce.current) clearTimeout(searchDebounce.current)
      searchAbortRef.current?.abort()
      searchAbortRef.current = null

      const q = value.trim()
      if (q.length < 3) {
        searchReqId.current++
        setSearchStatus('empty')
        setResults([])
        return
      }

      setSearchStatus('loading')
      const current = ++searchReqId.current
      const nearPoint = near
      searchDebounce.current = setTimeout(async () => {
        const controller = new AbortController()
        searchAbortRef.current = controller
        try {
          let found = await searchPlaces(q, {
            near: nearPoint ?? undefined,
            signal: controller.signal,
          })
          if (current !== searchReqId.current) return
          if (nearPoint && found.length > 0) {
            found = found.map((item) => ({
              ...item,
              distanceKm: roundRouteKm(haversineKm(nearPoint, item)),
            }))
          }
          setResults(found)
          setSearchStatus(found.length > 0 ? 'results' : 'nothing')
        } catch {
          if (controller.signal.aborted) return
          if (current !== searchReqId.current) return
          setResults([])
          setSearchStatus('error')
        }
      }, 500)
    },
    [near],
  )

  const openSearch = useCallback(() => {
    setSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
  }, [])

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus({ preventScroll: true })
  }, [])

  const clientToLocal = (el: HTMLElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
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
          moved: false,
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
        const focal = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        }
        const nextZoom = clampZoom(pinch.startZoom + Math.log2(distance / pinch.startDistance))
        const nextCenter = zoomAtPoint(pinch.startZoom, nextZoom, pinch.startCenter, focal, sizeRef.current)
        setZoomCenter(nextZoom, nextCenter)
        return
      }

      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (Math.hypot(dx, dy) > 8) drag.moved = true
      const currentZoom = zoomRef.current
      const startWorld = latLngToWorld(drag.startLat, drag.startLng, currentZoom)
      const next = worldToLatLng(startWorld.x - dx, startWorld.y - dy, currentZoom)
      setZoomCenter(currentZoom, next)
    },
    [setZoomCenter],
  )

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      const wasTap =
        drag &&
        drag.pointerId === e.pointerId &&
        !drag.moved &&
        pointersRef.current.size <= 1

      pointersRef.current.delete(e.pointerId)
      if (pointersRef.current.size < 2) pinchRef.current = null

      if (drag?.pointerId === e.pointerId) {
        dragRef.current = null
        if (wasTap) {
          const container = containerRef.current
          if (container && sizeRef.current.width > 0) {
            const local = clientToLocal(container, e.clientX, e.clientY)
            const world = latLngToWorld(centerRef.current.lat, centerRef.current.lng, zoomRef.current)
            const pointWorld = {
              x: world.x + (local.x - sizeRef.current.width / 2),
              y: world.y + (local.y - sizeRef.current.height / 2),
            }
            const latLng = worldToLatLng(pointWorld.x, pointWorld.y, zoomRef.current)
            setPin(latLng)
            void resolvePin(latLng)
          }
        }
      }

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    },
    [resolvePin],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault()
      cancelZoomAnimation()
      const container = containerRef.current
      if (!container) return
      const focal = clientToLocal(container, e.clientX, e.clientY)
      const nextZoom = clampZoom(zoomRef.current - e.deltaY * WHEEL_ZOOM_SENSITIVITY)
      const nextCenter = zoomAtPoint(zoomRef.current, nextZoom, centerRef.current, focal, sizeRef.current)
      setZoomCenter(nextZoom, nextCenter)
    },
    [cancelZoomAnimation, setZoomCenter],
  )

  const tilesReady = size.width > 0 && size.height > 0
  const tiles = useMemo(
    () => (tilesReady ? tileRange(center, tileZoom, size.width, size.height) : []),
    [tilesReady, center, tileZoom, size.width, size.height],
  )
  const zoomScale = 2 ** (zoom - tileZoom)

  const pinPixel =
    pin && tilesReady
      ? latLngToPixel(pin.lat, pin.lng, center, tileZoom, size.width, size.height)
      : null

  return (
    <Box flex="1" minH="0" h="full" position="relative" bg="screen">
      <Box
        ref={containerRef}
        position="absolute"
        inset={0}
        zIndex={0}
        overflow="hidden"
        bg="#e8ecef"
        cursor="crosshair"
        touchAction="none"
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

          {pinPixel ? (
            <Box
              position="absolute"
              left={`${pinPixel.x}px`}
              top={`${pinPixel.y}px`}
              transform="translate(-50%, -100%)"
              pointerEvents="none"
              zIndex={2}
            >
              <Box
                boxSize="28px"
                borderRadius="full"
                bg="primary"
                borderWidth="2px"
                borderColor="background"
                boxShadow="0 2px 8px rgba(0,0,0,0.25)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box boxSize="8px" borderRadius="full" bg="primaryFg" />
              </Box>
            </Box>
          ) : null}
        </Box>
      </Box>

      <Flex direction="column" h="full" position="relative" zIndex={1} pointerEvents="none">
        <Flex
          as="header"
          h="80px"
          align="center"
          gap="12px"
          px="16px"
          py="20px"
          flexShrink={0}
          pointerEvents="auto"
          position="relative"
        >
          <Box
            aria-hidden
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="120px"
            pointerEvents="none"
            zIndex={0}
            {...mapFrostedGradientLayer.top}
          />
          <Box
            as="button"
            aria-label="Назад"
            onClick={onClose}
            py="6px"
            color="primary"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
            position="relative"
            zIndex={1}
            _hover={{ opacity: 0.7 }}
          >
            <ChevronLeft size={24} />
          </Box>
          <Text
            flex="1"
            minW="0"
            fontFamily="heading"
            fontWeight="semibold"
            fontSize="title"
            lineHeight="title"
            color="primary"
            textTransform="uppercase"
            truncate
            position="relative"
            zIndex={1}
          >
            {title}
          </Text>
        </Flex>

        <Box flex="1" minH="0" position="relative">
          <MapZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} />

          <Box
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            p="16px"
            pointerEvents="none"
            zIndex={3}
          >
            <Text
              fontSize="10px"
              lineHeight="1.2"
              color="muted"
              opacity={0.75}
              bg="rgba(255,255,255,0.55)"
              px="4px"
              mb="8px"
              borderRadius="sm"
              w="fit-content"
              pointerEvents="none"
            >
              © OpenStreetMap
            </Text>
            <Flex
              direction="column"
              gap="12px"
              bg="background"
              borderRadius="pill"
              p="16px"
              boxShadow="0 -4px 24px rgba(0,0,0,0.08)"
              pointerEvents="auto"
            >
              {enableSearch ? (
                <Flex
                  as="button"
                  position="relative"
                  align="center"
                  h="48px"
                  w="full"
                  bg="background"
                  borderWidth="1px"
                  borderColor="line"
                  borderRadius="pill"
                  overflow="hidden"
                  cursor="pointer"
                  textAlign="left"
                  onClick={openSearch}
                  _hover={{ opacity: 0.85 }}
                >
                  <Box position="absolute" left="11px" color="primary" pointerEvents="none">
                    <SearchIcon size={24} />
                  </Box>
                  <Text
                    pl="47px"
                    pr={status === 'loading' ? '44px' : '16px'}
                    fontSize="sm"
                    lineHeight="sm"
                    color={place ? 'primary' : 'muted'}
                    truncate
                    w="full"
                  >
                    {place?.title || 'Название города или улицы'}
                  </Text>
                  {status === 'loading' ? (
                    <Box
                      position="absolute"
                      right="12px"
                      color="muted"
                      pointerEvents="none"
                      display="inline-flex"
                    >
                      <RingSpinner size={20} />
                    </Box>
                  ) : null}
                </Flex>
              ) : null}

              {status === 'idle' && !enableSearch ? (
                <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="muted">
                  {hint}
                </Text>
              ) : null}

              {status === 'loading' && !enableSearch ? (
                <Flex align="center" justify="center" py="8px">
                  <EmblemLoader size={40} />
                </Flex>
              ) : null}

              {status === 'error' ? (
                <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="primary">
                  {errorText}
                </Text>
              ) : null}

              {status === 'ready' && place && !enableSearch ? (
                <Flex direction="column" gap="2px" minW="0">
                  <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary" truncate>
                    {place.title}
                  </Text>
                  {place.subtitle ? (
                    <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" truncate>
                      {place.subtitle}
                    </Text>
                  ) : null}
                </Flex>
              ) : null}

              <PrimaryButton
                disabled={status !== 'ready' || !place}
                onClick={() => {
                  if (place) onConfirm(place)
                }}
              >
                Выбрать
              </PrimaryButton>
            </Flex>
          </Box>
        </Box>
      </Flex>

      {enableSearch ? (
        <BottomSheet
          open={searchOpen}
          dragToDismiss
          fullHeight
          onEntered={focusSearchInput}
          onBackdropClick={closeSearch}
        >
          <Box px="16px" pb="16px" flexShrink={0}>
            <Flex
              position="relative"
              align="center"
              h="48px"
              w="full"
              bg="background"
              borderWidth="1px"
              borderColor="line"
              borderRadius="pill"
              overflow="hidden"
              _focusWithin={{ borderColor: 'primary' }}
            >
              <Box position="absolute" left="11px" color="primary" pointerEvents="none">
                <SearchIcon size={24} />
              </Box>
              <chakra.input
                ref={searchInputRef}
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange(e.target.value)}
                placeholder="Название города или улицы"
                w="full"
                h="full"
                pl="47px"
                pr="44px"
                border="none"
                outline="none"
                bg="transparent"
                color="primary"
                fontFamily="body"
                fontSize="sm"
                lineHeight="sm"
                _placeholder={{ color: 'muted' }}
              />
              {query ? (
                <Box
                  as="button"
                  aria-label="Очистить"
                  onClick={() => handleQueryChange('')}
                  position="absolute"
                  right="11px"
                  color="muted"
                  cursor="pointer"
                  _hover={{ opacity: 0.7 }}
                >
                  <CloseCircleIcon size={24} />
                </Box>
              ) : null}
            </Flex>
          </Box>

          <Flex direction="column" flex="1" minH="0" px="16px" pb="24px" overflow="hidden">
            {(searchStatus === 'empty' ||
              searchStatus === 'nothing' ||
              searchStatus === 'loading' ||
              searchStatus === 'error') && (
              <Flex flex="1" direction="column" align="center" justify="center" gap="16px" py="24px">
                {searchStatus === 'empty' ? (
                  <SearchEmptyState text={searchEmptyText} variant="empty" />
                ) : null}
                {searchStatus === 'nothing' ? (
                  <SearchEmptyState text="Ничего не найдено" variant="nothing" />
                ) : null}
                {searchStatus === 'loading' ? <EmblemLoader size={64} /> : null}
                {searchStatus === 'error' ? (
                  <SearchEmptyState
                    text="Не удалось выполнить поиск. Проверь интернет и попробуй ещё раз"
                    variant="nothing"
                  />
                ) : null}
              </Flex>
            )}

            {searchStatus === 'results' ? (
              <Box flex="1" minH="0" overflowY="auto">
                <Flex direction="column" gap="8px">
                  {results.map((result, idx) => {
                    const secondary = placeSecondaryLine(result)
                    return (
                      <Box key={result.id}>
                        <Flex
                          as="button"
                          w="full"
                          direction="column"
                          align="flex-start"
                          gap="2px"
                          textAlign="left"
                          py="5px"
                          cursor="pointer"
                          onClick={() => applyCandidate(result)}
                          _hover={{ opacity: 0.7 }}
                        >
                          <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary" w="full">
                            {result.title}
                          </Text>
                          {secondary ? (
                            <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" w="full">
                              {secondary}
                            </Text>
                          ) : null}
                        </Flex>
                        {idx < results.length - 1 ? <Box h="1px" w="full" bg="line" /> : null}
                      </Box>
                    )
                  })}
                </Flex>
              </Box>
            ) : null}
          </Flex>
        </BottomSheet>
      ) : null}
    </Box>
  )
}

function placeSecondaryLine(place: Place): string {
  const distance =
    place.distanceKm && place.distanceKm > 0 ? formatDistance(place.distanceKm) : ''
  if (place.subtitle && distance) return `${place.subtitle} · ${distance}`
  return place.subtitle || distance
}

function SearchEmptyState({ text, variant }: { text: string; variant: 'empty' | 'nothing' }) {
  return (
    <>
      <Box boxSize="160px" position="relative" overflow="hidden" flexShrink={0}>
        {variant === 'nothing' ? (
          <Image src="/figma/nothing-found.png" alt="" boxSize="160px" objectFit="contain" />
        ) : (
          <Image
            src="/figma/illustration.png"
            alt=""
            position="absolute"
            w="380.2%"
            h="253.47%"
            left="-140.1%"
            top="-76.73%"
            maxW="none"
          />
        )}
      </Box>
      <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="primary" textAlign="center" w="220px">
        {text}
      </Text>
    </>
  )
}

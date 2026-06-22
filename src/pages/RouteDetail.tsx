import { useCallback, useEffect, useRef, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { InteractiveRouteMap, type InteractiveRouteMapRef } from '@/components/InteractiveRouteMap'
import { MapZoomControls } from '@/components/MapZoomControls'
import { PrimaryButton } from '@/components/PrimaryButton'
import { RouteDetailStopRow } from '@/components/RouteDetailStopRow'
import { formatRouteSummarySm } from '@/lib/format'
import { isRoutePlaceStop, routePlaceStops } from '@/lib/routing/routeStops'
import { loadGeneration } from '@/lib/storage/generation'
import { loadVisitedPlaceIds, toggleVisitedPlace } from '@/lib/storage/visited'

const SAVE_HINT_MS = 2400

type RouteDetailPanelProps = {
  onClose: () => void
}

/** E3 — финальный экран выбранного маршрута (оверлей поверх E2). */
export function RouteDetailPanel({ onClose }: RouteDetailPanelProps) {
  const navigate = useNavigate()
  const detailMatch = useMatch('/plan/results/:variantId')
  const variantId = detailMatch?.params.variantId
  const generation = loadGeneration()
  const mapRef = useRef<InteractiveRouteMapRef>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const variant = generation?.variants.find((v) => v.id === variantId)

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [visitedIds, setVisitedIds] = useState(() => loadVisitedPlaceIds())
  const [saveHint, setSaveHint] = useState(false)
  const saveHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!variantId) return
    if (!generation || !variant) {
      navigate('/plan/results', { replace: true })
    }
  }, [generation, variant, variantId, navigate])

  useEffect(
    () => () => {
      if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current)
    },
    [],
  )

  const handleToggleVisited = useCallback((placeId: string) => {
    toggleVisitedPlace(placeId)
    setVisitedIds(loadVisitedPlaceIds())
  }, [])

  const handleSaveStub = useCallback(() => {
    setSaveHint(true)
    if (saveHintTimerRef.current) clearTimeout(saveHintTimerRef.current)
    saveHintTimerRef.current = setTimeout(() => setSaveHint(false), SAVE_HINT_MS)
  }, [])

  const handleStopSelect = useCallback((placeId: string) => {
    setSelectedStopId(placeId)
    listRef.current
      ?.querySelector(`[data-stop-id="${placeId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  if (!variantId || !generation || !variant) {
    return null
  }

  const routePlaces = routePlaceStops(variant.stops)
  const visitedOnRoute = routePlaces.filter((s) => visitedIds.has(s.placeId)).length

  return (
    <Flex direction="column" h="full" minH="0">
      <Header variant="back" title={variant.title} onBack={onClose} />

      <Flex direction="column" flex="1" minH="0">
        <Box
          px="16px"
          flex={{ base: '0 0 35%', md: '0 0 45%' }}
          minH={{ base: '200px', md: '280px' }}
          maxH={{ base: '280px', md: '420px' }}
          pb="12px"
          flexShrink={0}
        >
          <Box
            position="relative"
            h="full"
            borderRadius="card"
            overflow="hidden"
            borderWidth="1px"
            borderColor="line"
            bg="#e8ecef"
          >
            <InteractiveRouteMap
              ref={mapRef}
              stops={variant.stops}
              geometry={variant.geometry}
              selectedStopId={selectedStopId}
              onStopClick={(stop) => handleStopSelect(stop.placeId)}
            />
            <MapZoomControls
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
            />
          </Box>
        </Box>

        <Box px="16px" pb="12px" flexShrink={0}>
          <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted">
            {formatRouteSummarySm(variant.totalKm, variant.totalMinutes, routePlaces.length)}
          </Text>
          {visitedOnRoute > 0 ? (
            <Text fontSize="xs" lineHeight="xs" color="muted" mt="4px">
              Отмечено: {visitedOnRoute} из {routePlaces.length}
            </Text>
          ) : null}
        </Box>

        <Box
          ref={listRef}
          flex="1"
          minH="0"
          overflowY="auto"
          px="16px"
          pb="8px"
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-line)', borderRadius: '4px' },
          }}
        >
          <Flex direction="column" gap="6px">
            {variant.stops.map((stop) => (
              <Box key={stop.placeId} data-stop-id={stop.placeId}>
                <RouteDetailStopRow
                  stop={stop}
                  selected={selectedStopId === stop.placeId}
                  visited={visitedIds.has(stop.placeId)}
                  onSelect={() => handleStopSelect(stop.placeId)}
                  onToggleVisited={isRoutePlaceStop(stop) ? () => handleToggleVisited(stop.placeId) : undefined}
                />
              </Box>
            ))}
          </Flex>
        </Box>

        <Box
          flexShrink={0}
          px="16px"
          py="16px"
          borderTopWidth="1px"
          borderColor="line"
          bg="background"
        >
          {saveHint ? (
            <Text
              fontSize="xs"
              lineHeight="xs"
              color="muted"
              textAlign="center"
              mb="8px"
              css={{
                animation: 'vandr-fade-in 200ms ease-out',
                '@keyframes vandr-fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
              }}
            >
              Сохранение маршрута появится в следующей версии
            </Text>
          ) : null}
          <PrimaryButton onClick={handleSaveStub}>Сохранить маршрут</PrimaryButton>
        </Box>
      </Flex>
    </Flex>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { ChevronLeft } from '@/components/icons'
import { InteractiveRouteMap, type InteractiveRouteMapRef } from '@/components/InteractiveRouteMap'
import { MapZoomControls } from '@/components/MapZoomControls'
import { PlacePopover } from '@/components/PlacePopover'
import { PrimaryButton } from '@/components/PrimaryButton'
import { RouteDetailsSheet } from '@/components/RouteDetailsSheet'
import { RouteVariantPanel } from '@/components/RouteVariantPanel'
import { SheetOverlay } from '@/components/SheetOverlay'
import { isRoutePlaceStop } from '@/lib/routing/routeStops'
import { loadGeneration } from '@/lib/storage/generation'
import { mapFrostedGradientLayer } from '@/theme/mapOverlay'
import type { RouteStop } from '@/types'

type OverlayState =
  | { type: 'none' }
  | { type: 'place'; stop: RouteStop }
  | { type: 'route' }

type ResultsPanelProps = {
  onClose: () => void
  onSelectRoute: (variantId: string) => void
}

/** E2 — Выбор маршрута. 1:1 с Figma (node 215:907). */
export function ResultsPanel({ onClose, onSelectRoute }: ResultsPanelProps) {
  const navigate = useNavigate()
  const generation = loadGeneration()
  const [variantIndex, setVariantIndex] = useState(0)
  const [overlay, setOverlay] = useState<OverlayState>({ type: 'none' })
  const [routeSheetOpen, setRouteSheetOpen] = useState(false)
  const [placePopoverPresent, setPlacePopoverPresent] = useState(false)
  const [placePopoverOpen, setPlacePopoverOpen] = useState(false)
  const mapRef = useRef<InteractiveRouteMapRef>(null)

  useEffect(() => {
    if (!generation || generation.variants.length === 0) {
      navigate('/plan', { replace: true })
    }
  }, [generation, navigate])

  useEffect(() => {
    setRouteSheetOpen(false)
    setPlacePopoverOpen(false)
  }, [variantIndex])

  useEffect(() => {
    if (overlay.type === 'route') {
      setRouteSheetOpen(true)
      return
    }
    if (overlay.type === 'place') {
      setPlacePopoverPresent(true)
      setPlacePopoverOpen(true)
    }
  }, [overlay.type])

  const closeRouteSheet = () => setRouteSheetOpen(false)

  const handleRouteSheetExited = () => {
    setOverlay((current) => (current.type === 'route' ? { type: 'none' } : current))
  }

  const closePlacePopover = () => setPlacePopoverOpen(false)

  const handlePlacePopoverExited = () => {
    setPlacePopoverPresent(false)
    setOverlay((current) => (current.type === 'place' ? { type: 'none' } : current))
  }

  const handleOverlayClose = () => {
    if (overlay.type === 'route') {
      closeRouteSheet()
      return
    }
    if (overlay.type === 'place') {
      closePlacePopover()
      return
    }
    setOverlay({ type: 'none' })
  }

  if (!generation || generation.variants.length === 0) {
    return null
  }

  const variant = generation.variants[variantIndex] ?? generation.variants[0]
  const total = generation.variants.length

  const goPrev = () => setVariantIndex((i) => (i - 1 + total) % total)
  const goNext = () => setVariantIndex((i) => (i + 1) % total)
  const handleStopClick = (stop: RouteStop) => {
    if (!isRoutePlaceStop(stop)) return
    setOverlay({ type: 'place', stop })
  }
  const selectedStopId = overlay.type === 'place' ? overlay.stop.placeId : null
  const showRouteSheet = overlay.type === 'route'
  const concealBottomChrome = showRouteSheet
  const overlayOpen = placePopoverOpen || routeSheetOpen
  const overlayPresent = overlay.type !== 'none'

  return (
    <>
      <Box position="absolute" inset={0} zIndex={0}>
        <InteractiveRouteMap
          ref={mapRef}
          stops={variant.stops}
          geometry={variant.geometry}
          selectedStopId={selectedStopId}
          onStopClick={handleStopClick}
        />
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
            Выбор маршрута
          </Text>
        </Flex>

        <Box flex="1" minH="0" position="relative">
          <MapZoomControls
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
          />

          <Box
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            px="16px"
            pointerEvents={concealBottomChrome ? 'none' : 'auto'}
            visibility={concealBottomChrome ? 'hidden' : 'visible'}
            opacity={concealBottomChrome ? 0 : 1}
            transition="opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)"
            aria-hidden={concealBottomChrome}
          >
            <RouteVariantPanel
              variants={generation.variants}
              index={variantIndex}
              onPrev={goPrev}
              onNext={goNext}
              onCardClick={() => setOverlay({ type: 'route' })}
            />
          </Box>
        </Box>

        <Box
          flexShrink={0}
          display="flex"
          alignItems="center"
          px="16px"
          py="16px"
          pointerEvents={concealBottomChrome ? 'none' : 'auto'}
          visibility={concealBottomChrome ? 'hidden' : 'visible'}
          opacity={concealBottomChrome ? 0 : 1}
          transition="opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)"
          position="relative"
          overflow="hidden"
          aria-hidden={concealBottomChrome}
        >
          <Box
            aria-hidden
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            h="120px"
            pointerEvents="none"
            zIndex={0}
            {...mapFrostedGradientLayer.bottom}
          />
          <Box position="relative" zIndex={1} w="full">
            <PrimaryButton onClick={() => onSelectRoute(variant.id)}>
              Выбрать
            </PrimaryButton>
          </Box>
        </Box>
      </Flex>

      {overlayPresent ? (
        <SheetOverlay open={overlayOpen} onClose={handleOverlayClose} />
      ) : null}

      {placePopoverPresent && overlay.type === 'place' ? (
        <PlacePopover
          open={placePopoverOpen}
          stop={overlay.stop}
          onClose={closePlacePopover}
          onExited={handlePlacePopoverExited}
        />
      ) : null}

      <RouteDetailsSheet
        open={routeSheetOpen}
        variant={variant}
        onClose={closeRouteSheet}
        onExited={handleRouteSheetExited}
        onSelect={() => onSelectRoute(variant.id)}
      />
    </>
  )
}

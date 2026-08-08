import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Image, Text, chakra } from '@chakra-ui/react'
import { InteractiveRouteMap, type InteractiveRouteMapRef } from '@/components/InteractiveRouteMap'
import { MapZoomControls } from '@/components/MapZoomControls'
import { PrimaryButton } from '@/components/PrimaryButton'
import { PROFILE_FADE_IN_CSS } from '@/components/ProfileChrome'
import { Segmented } from '@/components/Segmented'
import { TripCompletedPanel } from '@/components/TripCompletedPanel'
import { TripConfirmSheet, TripManageMenu } from '@/components/TripManageSheets'
import { TripPlaceSheet } from '@/components/TripPlaceSheet'
import { TripStopRow, tripStopBadgeActive } from '@/components/TripStopRow'
import { ChevronLeft, MoreVerticalIcon, TrashIcon } from '@/components/icons'
import { formatPlacesCount, formatTripMinutes } from '@/lib/format'
import {
  googleMapsRouteUrl,
  openExternalMap,
  yandexMapsRouteUrl,
} from '@/lib/maps/externalMaps'
import { isRoutePlaceStop, routePlacesCount, routePlaceStops } from '@/lib/routing/routeStops'
import {
  cancelTrip,
  deleteTrip,
  setTripStatus,
  toggleTripVisited,
  tripStatus,
  tripVisitedIds,
  type SavedTrip,
} from '@/lib/storage/trips'
import type { RouteStop } from '@/types'

const OVERLAY_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const CHROME_TRANSITION = `opacity 280ms ${OVERLAY_EASE}`

type ViewTab = 'list' | 'map'

type TripRoutePanelProps = {
  trip: SavedTrip
  onClose: () => void
  onTripChange: (trip: SavedTrip) => void
  onDeleted: () => void
}

function MetricDot() {
  return (
    <Text as="span" fontSize="sm" lineHeight="sm" color="muted" px="4px" aria-hidden>
      ·
    </Text>
  )
}

function MapChip({
  label,
  iconSrc,
  onClick,
}: {
  label: string
  iconSrc: string
  onClick: () => void
}) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      gap="6px"
      h="36px"
      pl="6px"
      pr="12px"
      bg="background"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="line"
      borderRadius="20px"
      cursor="pointer"
      flexShrink={0}
      transition="opacity 150ms"
      _hover={{ opacity: 0.85 }}
    >
      <Box boxSize="24px" flexShrink={0} overflow="hidden" borderRadius="full">
        <Image src={iconSrc} alt="" w="24px" h="24px" display="block" />
      </Box>
      <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="foreground" whiteSpace="nowrap">
        {label}
      </Text>
    </chakra.button>
  )
}

/**
 * E6 — управление сохранённым маршрутом.
 * Figma section 305:2280 (new / in-progress / map / place / delete / complete).
 */
export function TripRoutePanel({ trip, onClose, onTripChange, onDeleted }: TripRoutePanelProps) {
  const navigate = useNavigate()
  const mapRef = useRef<InteractiveRouteMapRef>(null)
  const status = tripStatus(trip)
  const visitedIds = tripVisitedIds(trip)
  const placesCount = routePlacesCount(trip.variant.stops)
  const showVisitedActions = status === 'in-progress' || status === 'completed'
  const isNew = status === 'new'

  const [view, setView] = useState<ViewTab>('list')
  const [placeStop, setPlaceStop] = useState<RouteStop | null>(null)
  const [placeOpen, setPlaceOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [completedPresent, setCompletedPresent] = useState(false)
  const [completedVisible, setCompletedVisible] = useState(false)
  const [completedMotionReady, setCompletedMotionReady] = useState(false)

  useEffect(() => {
    setView('list')
    setPlaceStop(null)
    setPlaceOpen(false)
    setManageOpen(false)
    setDeleteOpen(false)
    setCancelOpen(false)
    setCompletedPresent(false)
    setCompletedVisible(false)
    setCompletedMotionReady(false)
  }, [trip.id])

  const showCompleted = useCallback(() => {
    setCompletedPresent(true)
    setCompletedVisible(false)
    setCompletedMotionReady(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCompletedMotionReady(true)
        setCompletedVisible(true)
      })
    })
  }, [])

  const hideCompleted = () => {
    setCompletedMotionReady(true)
    setCompletedVisible(false)
  }

  const handleCompletedTransitionEnd = (event: React.TransitionEvent) => {
    if (event.propertyName !== 'opacity') return
    if (completedVisible) return
    setCompletedPresent(false)
    setCompletedMotionReady(false)
  }

  const openPlace = (stop: RouteStop) => {
    setPlaceStop(stop)
    setPlaceOpen(true)
  }

  const closePlace = () => setPlaceOpen(false)

  const handlePlaceExited = () => {
    if (!placeOpen) setPlaceStop(null)
  }

  const checkCompletion = useCallback(
    (next: SavedTrip) => {
      const places = routePlaceStops(next.variant.stops)
      if (places.length === 0) return
      const visited = tripVisitedIds(next)
      const allDone = places.every((s) => visited.has(s.placeId))
      if (allDone && tripStatus(next) === 'in-progress') {
        void setTripStatus(next.id, 'completed').then((completed) => {
          if (completed) {
            onTripChange(completed)
            showCompleted()
          }
        })
      }
    },
    [onTripChange, showCompleted],
  )

  const handleToggleVisited = (placeId: string) => {
    void toggleTripVisited(trip.id, placeId).then((next) => {
      if (!next) return
      onTripChange(next)
      checkCompletion(next)
    })
  }

  const handleMarkFromSheet = () => {
    if (!placeStop) return
    handleToggleVisited(placeStop.placeId)
    setPlaceOpen(false)
  }

  const handleStart = () => {
    void setTripStatus(trip.id, 'in-progress').then((next) => {
      if (next) onTripChange(next)
    })
  }

  const handleDelete = () => {
    void deleteTrip(trip.id).then(() => {
      setDeleteOpen(false)
      setManageOpen(false)
      onDeleted()
    })
  }

  const handleCancel = () => {
    void cancelTrip(trip.id).then((next) => {
      setCancelOpen(false)
      setManageOpen(false)
      if (next) onTripChange(next)
    })
  }

  const segmented = (
    <Segmented<ViewTab>
      bordered
      ariaLabel="Вид маршрута"
      options={[
        { value: 'list', label: 'Список' },
        { value: 'map', label: 'Карта' },
      ]}
      value={view}
      onChange={setView}
    />
  )

  const headerAction =
    status === 'in-progress' ? (
      <Box
        as="button"
        aria-label="Меню маршрута"
        onClick={() => setManageOpen(true)}
        py="6px"
        color="primary"
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
        transition="opacity 150ms"
        _hover={{ opacity: 0.7 }}
      >
        <MoreVerticalIcon size={24} />
      </Box>
    ) : (
      <Box
        as="button"
        aria-label="Удалить маршрут"
        onClick={() => setDeleteOpen(true)}
        py="6px"
        color="primary"
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
        transition="opacity 150ms"
        _hover={{ opacity: 0.7 }}
      >
        <TrashIcon size={24} />
      </Box>
    )

  return (
    <Flex direction="column" h="full" minH="0" bg="background" position="relative">
      <Flex direction="column" gap="8px" pt="20px" pb="6px" px="16px" flexShrink={0}>
        <Flex align="flex-start" justify="space-between" w="full">
          <Box
            as="button"
            aria-label="Назад"
            onClick={onClose}
            py="6px"
            color="primary"
            cursor="pointer"
            display="inline-flex"
            alignItems="center"
            transition="opacity 150ms"
            _hover={{ opacity: 0.7 }}
          >
            <ChevronLeft size={24} />
          </Box>
          <Box key={status} css={PROFILE_FADE_IN_CSS}>
            {headerAction}
          </Box>
        </Flex>
        <Text
          fontFamily="heading"
          fontWeight="semibold"
          fontSize="title"
          lineHeight="title"
          color="primary"
          textTransform="uppercase"
          lineClamp={2}
        >
          {trip.variant.title}
        </Text>
      </Flex>

      <Flex align="center" px="16px" pb="16px" flexShrink={0} flexWrap="nowrap" minW="0">
        <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" whiteSpace="nowrap">
          {Math.round(trip.variant.totalKm)} км
        </Text>
        <MetricDot />
        <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" whiteSpace="nowrap">
          {formatTripMinutes(trip.variant.totalMinutes)}
        </Text>
        <MetricDot />
        <Text
          fontSize="sm"
          fontWeight="medium"
          lineHeight="sm"
          color="muted"
          whiteSpace="nowrap"
          truncate
        >
          {formatPlacesCount(placesCount)}
        </Text>
      </Flex>

      <Flex flexWrap="wrap" gap="8px" px="16px" pb="16px" flexShrink={0}>
        <MapChip
          label="Яндекс карта"
          iconSrc="/figma/map-yandex.svg"
          onClick={() => openExternalMap(yandexMapsRouteUrl(trip.variant.stops))}
        />
        <MapChip
          label="Google map"
          iconSrc="/figma/map-google.svg"
          onClick={() => openExternalMap(googleMapsRouteUrl(trip.variant.stops))}
        />
      </Flex>

      <Box flex="1" minH="0" position="relative" display="flex" flexDirection="column" overflow="hidden">
        {view === 'list' ? (
          <Box
            key={`list-${showVisitedActions ? 'active' : 'preview'}`}
            flex="1"
            minH="0"
            overflowY="auto"
            css={{
              ...PROFILE_FADE_IN_CSS,
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-line)',
                borderRadius: '4px',
              },
            }}
          >
            {trip.variant.stops.map((stop, index) => {
              const next = trip.variant.stops[index + 1]
              return (
                <TripStopRow
                  key={`${stop.placeId}-${stop.order}`}
                  stop={stop}
                  index={index}
                  total={trip.variant.stops.length}
                  visited={visitedIds.has(stop.placeId)}
                  nextActive={
                    next
                      ? tripStopBadgeActive(next, visitedIds.has(next.placeId))
                      : false
                  }
                  showVisitedActions={showVisitedActions}
                  onSelect={() => openPlace(stop)}
                  onToggleVisited={
                    isRoutePlaceStop(stop) ? () => handleToggleVisited(stop.placeId) : undefined
                  }
                />
              )
            })}
          </Box>
        ) : (
          <Box
            key={`map-${showVisitedActions ? 'active' : 'preview'}`}
            position="absolute"
            inset={0}
            borderTopRadius="28px"
            overflow="hidden"
            css={PROFILE_FADE_IN_CSS}
          >
            <InteractiveRouteMap
              ref={mapRef}
              stops={trip.variant.stops}
              geometry={trip.variant.geometry}
              onStopClick={(stop) => openPlace(stop)}
            />
            <MapZoomControls
              onZoomIn={() => mapRef.current?.zoomIn()}
              onZoomOut={() => mapRef.current?.zoomOut()}
            />
          </Box>
        )}

        <Flex
          direction="column"
          px="16px"
          pb="16px"
          pt="16px"
          flexShrink={0}
          bg={view === 'map' ? 'transparent' : 'background'}
          position={view === 'map' ? 'absolute' : 'relative'}
          left={view === 'map' ? 0 : undefined}
          right={view === 'map' ? 0 : undefined}
          bottom={view === 'map' ? 0 : undefined}
          zIndex={view === 'map' ? 5 : undefined}
          pointerEvents={view === 'map' ? 'none' : undefined}
        >
          <Box pointerEvents="auto">{segmented}</Box>
          {isNew ? (
            <Box pt="16px" css={PROFILE_FADE_IN_CSS} pointerEvents="auto">
              <PrimaryButton onClick={handleStart}>Поехали</PrimaryButton>
            </Box>
          ) : null}
        </Flex>
      </Box>

      {placeStop ? (
        <TripPlaceSheet
          open={placeOpen}
          stop={placeStop}
          visited={visitedIds.has(placeStop.placeId)}
          canMarkVisited={showVisitedActions && isRoutePlaceStop(placeStop)}
          onClose={closePlace}
          onExited={handlePlaceExited}
          onMarkVisited={handleMarkFromSheet}
        />
      ) : null}

      <TripManageMenu
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onCancelTrip={() => {
          setManageOpen(false)
          setCancelOpen(true)
        }}
        onDeleteTrip={() => {
          setManageOpen(false)
          setDeleteOpen(true)
        }}
      />

      <TripConfirmSheet
        open={deleteOpen}
        title="Удалить маршрут?"
        body="Маршрут будет удален без возможности восстановления"
        confirmLabel="Удалить"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <TripConfirmSheet
        open={cancelOpen}
        title="Отменить поездку?"
        body={
          'Поездку будет отменена, но\u00a0не\u00a0удалена, ее вы сможете найти в\u00a0“Моих маршрутах”'
        }
        confirmLabel="Отменить поездку"
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />

      {completedPresent ? (
        <Box
          position="absolute"
          inset={0}
          zIndex={30}
          bg="screen"
          opacity={completedVisible ? 1 : 0}
          transition={completedMotionReady ? CHROME_TRANSITION : 'none'}
          willChange="opacity"
          pointerEvents={completedVisible ? 'auto' : 'none'}
          aria-hidden={!completedVisible}
          onTransitionEnd={handleCompletedTransitionEnd}
        >
          <TripCompletedPanel
            onNewRoute={() => navigate('/plan')}
            onBackToRoute={hideCompleted}
          />
        </Box>
      ) : null}
    </Flex>
  )
}

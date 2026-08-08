import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Flex, Image, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SlideOverlay } from '@/components/SlideOverlay'
import { TripCard } from '@/components/TripCard'
import { useTabChrome } from '@/components/tab-chrome'
import { getTrip, loadTrips, type SavedTrip } from '@/lib/storage/trips'
import { RouteDetailPanel } from '@/pages/RouteDetail'

/** E5 — Мои маршруты. Figma 272:1124 (empty) / 272:1309 (list). */
export function Trips() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setForceHidden } = useTabChrome()

  const detailMatch = location.pathname.match(/^\/trips\/([^/]+)$/)
  const detailId = detailMatch?.[1] ?? null
  const isDetail = !!detailId

  const [trips, setTrips] = useState(() => loadTrips())
  const [detailOpen, setDetailOpen] = useState(() => isDetail)
  const [activeTrip, setActiveTrip] = useState<SavedTrip | null>(() =>
    detailId ? getTrip(detailId) : null,
  )

  useEffect(() => {
    setTrips(loadTrips())
  }, [location.pathname, location.key])

  useEffect(() => {
    if (!isDetail || !detailId) return
    const trip = getTrip(detailId)
    if (trip) {
      setActiveTrip(trip)
      setDetailOpen(true)
    } else {
      navigate('/trips', { replace: true })
    }
  }, [isDetail, detailId, navigate])

  const openDetail = (trip: SavedTrip) => {
    setActiveTrip(trip)
    setDetailOpen(true)
  }

  const closeDetail = () => setDetailOpen(false)

  const handleDetailEntered = () => {
    if (!activeTrip) return
    const target = `/trips/${encodeURIComponent(activeTrip.id)}`
    if (location.pathname !== target) {
      navigate(target, { replace: true })
    }
  }

  const handleDetailExited = () => {
    setActiveTrip(null)
    if (isDetail) {
      navigate('/trips', { replace: true })
    }
  }

  const detailPresent = isDetail || detailOpen

  useEffect(() => {
    setForceHidden(detailOpen)
    return () => setForceHidden(false)
  }, [detailOpen, setForceHidden])

  const empty = trips.length === 0

  return (
    <Flex direction="column" flex="1" minH="0" h="full" position="relative" overflow="hidden">
      <Header variant="title" title="Мои маршруты" />

      {empty ? (
        <Flex
          flex="1"
          direction="column"
          align="center"
          justify="center"
          p="16px"
          gap="40px"
          minH="0"
          overflow="hidden"
        >
          <Flex
            flex="1"
            direction="column"
            align="center"
            justify="center"
            gap="16px"
            minH="0"
            w="full"
          >
            <Box boxSize="200px" flexShrink={0} overflow="hidden">
              <Image
                src="/figma/trips-empty-stork.png"
                alt=""
                w="full"
                h="full"
                objectFit="contain"
              />
            </Box>
            <Text
              fontSize="sm"
              fontWeight="normal"
              lineHeight="sm"
              color="primary"
              textAlign="center"
              maxW="159px"
            >
              Пока еще нет созданных маршрутов
            </Text>
          </Flex>
          <Box w="full" flexShrink={0}>
            <PrimaryButton onClick={() => navigate('/plan')}>Создать маршрут</PrimaryButton>
          </Box>
        </Flex>
      ) : (
        <Flex
          flex="1"
          direction="column"
          gap="8px"
          px="16px"
          pb="16px"
          minH="0"
          overflowY={detailOpen ? 'hidden' : 'auto'}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': {
              background: 'var(--chakra-colors-line)',
              borderRadius: '4px',
            },
          }}
        >
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onSelect={() => openDetail(trip)} />
          ))}
        </Flex>
      )}

      {detailPresent && activeTrip ? (
        <SlideOverlay
          open={detailOpen}
          onEntered={handleDetailEntered}
          onExited={handleDetailExited}
          animateEnter={false}
          zIndex={16}
        >
          <RouteDetailPanel variant={activeTrip.variant} onClose={closeDetail} hideSave />
        </SlideOverlay>
      ) : null}
    </Flex>
  )
}

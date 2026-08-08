import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { Segmented } from '@/components/Segmented'
import { MapWidget } from '@/components/MapWidget'
import { ViewWidget } from '@/components/ViewWidget'
import { DurationWidget } from '@/components/DurationWidget'
import { DurationSheet } from '@/components/DurationSheet'
import { SlideOverlay } from '@/components/SlideOverlay'
import { PrimaryButton } from '@/components/PrimaryButton'
import { useTabChrome } from '@/components/tab-chrome'
import { InterestsPanel } from '@/pages/Interests'
import { LocationPanel } from '@/pages/Location'
import { ResultsPanel } from '@/pages/Results'
import { RouteDetailPanel } from '@/pages/RouteDetail'
import { RouteSavedPanel } from '@/pages/RouteSaved'
import { getTrip, type SavedTrip } from '@/lib/storage/trips'
import { useWizard } from '@/store/wizard-context'
import type { Transport } from '@/types'

/** E1 — Главный экран (хаб создания маршрута). 1:1 с Figma (node 137:204). */
export function Plan() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setForceHidden } = useTabChrome()
  const { state, setTransport, canGenerate } = useWizard()
  const [durationOpen, setDurationOpen] = useState(false)

  const isInterests = location.pathname === '/plan/interests'
  const isLocation = location.pathname === '/plan/location'
  const isResultsList = location.pathname === '/plan/results'
  const isRouteSaved = location.pathname === '/plan/results/saved'
  const routeDetailMatch = location.pathname.match(/^\/plan\/results\/([^/]+)$/)
  const isRouteDetail = !!routeDetailMatch && routeDetailMatch[1] !== 'saved'
  const isResultsStack = isResultsList || isRouteDetail || isRouteSaved

  const [interestsOpen, setInterestsOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(() => isResultsStack)
  const [routeDetailOpen, setRouteDetailOpen] = useState(() => isRouteDetail)
  const [routeSavedOpen, setRouteSavedOpen] = useState(() => isRouteSaved)
  const [savedTrip, setSavedTrip] = useState<SavedTrip | null>(() => {
    if (!isRouteSaved) return null
    const id = new URLSearchParams(location.search).get('id')
    return id ? getTrip(id) : null
  })
  const [locationPoint, setLocationPoint] = useState<'origin' | 'destination'>('origin')
  const [locationFocusSeq, setLocationFocusSeq] = useState(0)

  useEffect(() => {
    if (isInterests) setInterestsOpen(true)
  }, [isInterests])

  useEffect(() => {
    if (!isLocation) return
    const params = new URLSearchParams(location.search)
    setLocationPoint(params.get('point') === 'destination' ? 'destination' : 'origin')
    setLocationOpen(true)
  }, [isLocation, location.search])

  useEffect(() => {
    if (isResultsStack) setResultsOpen(true)
  }, [isResultsStack])

  useEffect(() => {
    if (isRouteDetail) setRouteDetailOpen(true)
  }, [isRouteDetail])

  useEffect(() => {
    if (!isRouteSaved) return
    setRouteSavedOpen(true)
    const id = new URLSearchParams(location.search).get('id')
    if (id) {
      const trip = getTrip(id)
      if (trip) setSavedTrip(trip)
    }
  }, [isRouteSaved, location.search])

  const openInterests = () => setInterestsOpen(true)
  const closeInterests = () => setInterestsOpen(false)
  const handleInterestsEntered = () => {
    if (location.pathname !== '/plan/interests') {
      navigate('/plan/interests', { replace: true })
    }
  }
  const handleInterestsExited = () => {
    if (location.pathname === '/plan/interests') {
      navigate('/plan', { replace: true })
    }
  }

  const openLocation = (point: 'origin' | 'destination') => {
    setLocationPoint(point)
    setLocationOpen(true)
  }
  const closeLocation = () => setLocationOpen(false)
  const handleLocationEntered = () => {
    const target = `/plan/location?point=${locationPoint}`
    if (`${location.pathname}${location.search}` !== target) {
      navigate(target, { replace: true })
    }
    setLocationFocusSeq((n) => n + 1)
  }
  const handleLocationExited = () => {
    if (location.pathname === '/plan/location') {
      navigate('/plan', { replace: true })
    }
  }

  const closeResults = () => setResultsOpen(false)
  const handleResultsExited = () => {
    if (location.pathname === '/plan/results') {
      navigate('/plan', { replace: true })
    }
  }

  const closeRouteDetail = () => setRouteDetailOpen(false)
  const handleRouteDetailExited = () => {
    if (isRouteDetail) {
      navigate('/plan/results', { replace: true })
    }
  }

  const openRouteSaved = (trip: SavedTrip) => {
    setSavedTrip(trip)
    setRouteSavedOpen(true)
    navigate(`/plan/results/saved?id=${encodeURIComponent(trip.id)}`)
  }

  const closeRouteSaved = () => setRouteSavedOpen(false)
  const handleRouteSavedExited = () => {
    setSavedTrip(null)
    if (location.pathname === '/plan/results/saved') {
      navigate('/plan/results', { replace: true })
    }
  }

  const openSavedTripDetail = (trip: SavedTrip) => {
    navigate(`/trips/${encodeURIComponent(trip.id)}`)
  }

  const goToTrips = () => {
    navigate('/trips')
  }

  const routeDetailPresent = isRouteDetail || routeDetailOpen
  const routeSavedPresent = isRouteSaved || routeSavedOpen
  const panelOpen =
    durationOpen || locationOpen || interestsOpen || resultsOpen || routeDetailOpen || routeSavedOpen
  const concealPlanChrome = isResultsStack && resultsOpen

  useEffect(() => {
    setForceHidden(panelOpen)
    return () => setForceHidden(false)
  }, [panelOpen, setForceHidden])

  return (
    <Flex direction="column" flex="1" minH="0" h="full" position="relative" overflow="hidden">
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        minH="0"
        visibility={concealPlanChrome ? 'hidden' : 'visible'}
        aria-hidden={concealPlanChrome}
      >
        <Header variant="main" />

        <Flex
          direction="column"
          flex="1"
          minH="0"
          px="16px"
          pb="16px"
          gap="16px"
          overflowY={panelOpen ? 'hidden' : 'auto'}
        >
          <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="primary">
            Время выехать из города
          </Text>

          <Segmented<Transport>
            ariaLabel="Тип транспорта"
            value={state.transport}
            onChange={setTransport}
            options={[
              { value: 'car', label: 'Авто' },
              { value: 'bike', label: 'Велосипед' },
            ]}
          />

          <MapWidget
            onOpenOrigin={() => openLocation('origin')}
            onOpenDestination={() => openLocation('destination')}
          />

          <ViewWidget onOpen={openInterests} />

          <DurationWidget onOpen={() => setDurationOpen(true)} />
        </Flex>

        <Box p="16px">
          <PrimaryButton onClick={() => navigate('/plan/loading')} disabled={!canGenerate}>
            Подобрать маршрут
          </PrimaryButton>
        </Box>
      </Box>

      <DurationSheet open={durationOpen} onClose={() => setDurationOpen(false)} />

      <SlideOverlay
        open={interestsOpen}
        onEntered={handleInterestsEntered}
        onExited={handleInterestsExited}
      >
        <InterestsPanel onClose={closeInterests} />
      </SlideOverlay>

      <SlideOverlay
        open={locationOpen}
        onEntered={handleLocationEntered}
        onExited={handleLocationExited}
      >
        <LocationPanel
          point={locationPoint}
          onClose={closeLocation}
          focusSeq={locationFocusSeq}
        />
      </SlideOverlay>

      <SlideOverlay open={resultsOpen} onExited={handleResultsExited} animateEnter={false}>
        <ResultsPanel onClose={closeResults} onRouteSaved={openRouteSaved} />
      </SlideOverlay>

      {routeDetailPresent ? (
        <SlideOverlay
          open={routeDetailOpen}
          onExited={handleRouteDetailExited}
          animateEnter={false}
          zIndex={16}
        >
          <RouteDetailPanel onClose={closeRouteDetail} />
        </SlideOverlay>
      ) : null}

      {routeSavedPresent && savedTrip ? (
        <SlideOverlay
          open={routeSavedOpen}
          onExited={handleRouteSavedExited}
          animateEnter={false}
          zIndex={16}
        >
          <RouteSavedPanel
            trip={savedTrip}
            onClose={closeRouteSaved}
            onOpenTrip={openSavedTripDetail}
            onGoToTrips={goToTrips}
          />
        </SlideOverlay>
      ) : null}
    </Flex>
  )
}

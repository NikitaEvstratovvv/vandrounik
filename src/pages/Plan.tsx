import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Screen } from '@/components/Screen'
import { Header } from '@/components/Header'
import { Segmented } from '@/components/Segmented'
import { MapWidget } from '@/components/MapWidget'
import { ViewWidget } from '@/components/ViewWidget'
import { DurationWidget } from '@/components/DurationWidget'
import { DurationSheet } from '@/components/DurationSheet'
import { SlideOverlay } from '@/components/SlideOverlay'
import { PrimaryButton } from '@/components/PrimaryButton'
import { InterestsPanel } from '@/pages/Interests'
import { LocationPanel } from '@/pages/Location'
import { ResultsPanel } from '@/pages/Results'
import { RouteDetailPanel } from '@/pages/RouteDetail'
import { useWizard } from '@/store/wizard-context'
import type { Transport } from '@/types'

/** E1 — Главный экран (хаб создания маршрута). 1:1 с Figma (node 137:204). */
export function Plan() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, setTransport, canGenerate } = useWizard()
  const [durationOpen, setDurationOpen] = useState(false)

  const isInterests = location.pathname === '/plan/interests'
  const isLocation = location.pathname === '/plan/location'
  const isResultsList = location.pathname === '/plan/results'
  const isRouteDetail = /^\/plan\/results\/[^/]+$/.test(location.pathname)
  const isResultsStack = isResultsList || isRouteDetail

  const [interestsOpen, setInterestsOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(() => isResultsStack)
  const [routeDetailOpen, setRouteDetailOpen] = useState(() => isRouteDetail)
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

  const openRouteDetail = (id: string) => {
    setRouteDetailOpen(true)
    navigate(`/plan/results/${id}`)
  }

  const routeDetailPresent = isRouteDetail || routeDetailOpen
  const panelOpen = durationOpen || locationOpen || interestsOpen || resultsOpen || routeDetailOpen
  const concealPlanChrome = isResultsStack && resultsOpen

  return (
    <Screen>
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
        <ResultsPanel onClose={closeResults} onSelectRoute={openRouteDetail} />
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
    </Screen>
  )
}

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { ChevronRight } from '@/components/icons'
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
import { walkStopCount, type Place, type Transport, type WalkStopCount } from '@/types'

function isTripPath(pathname: string) {
  return pathname === '/plan/trip' || pathname.startsWith('/plan/trip/')
}

function isWalkPath(pathname: string) {
  return pathname === '/plan/walk' || pathname.startsWith('/plan/walk/')
}

function formBase(pathname: string): '/plan/trip' | '/plan/walk' | '/plan' {
  if (isTripPath(pathname)) return '/plan/trip'
  if (isWalkPath(pathname)) return '/plan/walk'
  return '/plan'
}

function isInterestsPath(pathname: string) {
  return (
    pathname === '/plan/interests' ||
    pathname === '/plan/trip/interests' ||
    pathname === '/plan/walk/interests'
  )
}

function isLocationPath(pathname: string) {
  return (
    pathname === '/plan/location' ||
    pathname === '/plan/trip/location' ||
    pathname === '/plan/walk/location'
  )
}

/** E1 — Главный экран (хаб создания маршрута). 1:1 с Figma (node 137:204). */
export function Plan() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setForceHidden } = useTabChrome()
  const { state, setTransport, setIntent, setStopCount, canGenerate } = useWizard()
  const [durationOpen, setDurationOpen] = useState(false)

  const path = location.pathname
  const onTripForm = isTripPath(path)
  const onWalkForm = isWalkPath(path)
  const isInterests = isInterestsPath(path)
  const isLocation = isLocationPath(path)
  const isResultsList = path === '/plan/results'
  const isRouteSaved = path === '/plan/results/saved'
  const routeDetailMatch = path.match(/^\/plan\/results\/([^/]+)$/)
  const isRouteDetail = !!routeDetailMatch && routeDetailMatch[1] !== 'saved'
  const isResultsStack = isResultsList || isRouteDetail || isRouteSaved

  // Under results, keep the trip/walk form mounted so back does not flash the chooser.
  const [tripOpen, setTripOpen] = useState(
    () => onTripForm || (isResultsStack && state.intent !== 'walk'),
  )
  const [walkOpen, setWalkOpen] = useState(
    () => onWalkForm || (isResultsStack && state.intent === 'walk'),
  )
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

  // Only open from URL — never re-force open while the user is closing.
  // Do not call setIntent here: its identity changes with every wizard write and
  // would re-run this effect, slamming tripOpen back to true mid-exit.
  useEffect(() => {
    if (!onTripForm) return
    setWalkOpen(false)
    setTripOpen(true)
  }, [onTripForm])

  useEffect(() => {
    if (!onWalkForm) return
    setTripOpen(false)
    setWalkOpen(true)
  }, [onWalkForm])

  useEffect(() => {
    if (onTripForm && state.intent !== 'trip') setIntent('trip')
    if (onWalkForm && state.intent !== 'walk') setIntent('walk')
  }, [onTripForm, onWalkForm, state.intent, setIntent])

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
    if (!isResultsStack) return
    setResultsOpen(true)
    if (state.intent === 'walk') {
      setTripOpen(false)
      setWalkOpen(true)
    } else {
      setWalkOpen(false)
      setTripOpen(true)
    }
  }, [isResultsStack, state.intent])

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

  const openTrip = () => {
    setWalkOpen(false)
    setIntent('trip')
    setTripOpen(true)
    navigate('/plan/trip', { replace: true })
  }

  const closeTrip = () => {
    setTripOpen(false)
    if (isTripPath(location.pathname)) {
      navigate('/plan', { replace: true })
    }
  }
  const handleTripEntered = () => {
    // Don't steal URL while results stack covers the form.
    if (resultsOpen || location.pathname.startsWith('/plan/results')) return
    if (!isTripPath(location.pathname)) {
      navigate('/plan/trip', { replace: true })
    }
  }
  const handleTripExited = () => {
    if (isTripPath(location.pathname)) {
      navigate('/plan', { replace: true })
    }
  }

  const openWalk = () => {
    setTripOpen(false)
    setIntent('walk')
    setWalkOpen(true)
    navigate('/plan/walk', { replace: true })
  }

  const closeWalk = () => {
    setWalkOpen(false)
    if (isWalkPath(location.pathname)) {
      navigate('/plan', { replace: true })
    }
  }
  const handleWalkEntered = () => {
    if (resultsOpen || location.pathname.startsWith('/plan/results')) return
    if (!isWalkPath(location.pathname)) {
      navigate('/plan/walk', { replace: true })
    }
  }
  const handleWalkExited = () => {
    if (isWalkPath(location.pathname)) {
      navigate('/plan', { replace: true })
    }
  }

  const activeFormBase = (): '/plan/trip' | '/plan/walk' | '/plan' => {
    if (isWalkPath(path) || (walkOpen && !isTripPath(path))) return '/plan/walk'
    if (isTripPath(path) || tripOpen) return '/plan/trip'
    if (walkOpen) return '/plan/walk'
    return '/plan'
  }

  const openInterests = () => setInterestsOpen(true)
  const closeInterests = () => setInterestsOpen(false)
  const handleInterestsEntered = () => {
    const base = activeFormBase()
    const target = base === '/plan' ? '/plan/interests' : `${base}/interests`
    if (path !== target) {
      navigate(target, { replace: true })
    }
  }
  const handleInterestsExited = () => {
    if (!isInterests) return
    navigate(formBase(path), { replace: true })
  }

  const openLocation = (point: 'origin' | 'destination') => {
    setLocationPoint(point)
    setLocationOpen(true)
  }
  const closeLocation = () => setLocationOpen(false)
  const handleLocationEntered = () => {
    const base = activeFormBase()
    const prefix = base === '/plan' ? '/plan/location' : `${base}/location`
    const target = `${prefix}?point=${locationPoint}`
    if (`${path}${location.search}` !== target) {
      navigate(target, { replace: true })
    }
    setLocationFocusSeq((n) => n + 1)
  }
  const handleLocationExited = () => {
    if (!isLocation) return
    navigate(formBase(path), { replace: true })
  }

  const closeResults = () => {
    // Form already under results; reinforce before uncover so chooser never flashes.
    if (state.intent === 'walk') {
      setTripOpen(false)
      setWalkOpen(true)
    } else {
      setWalkOpen(false)
      setTripOpen(true)
    }
    setResultsOpen(false)
  }
  const handleResultsExited = () => {
    if (location.pathname !== '/plan/results') return
    // Back one step: trip/walk form (wizard intent), not the format chooser.
    const back =
      state.intent === 'walk' ? '/plan/walk' : state.intent === 'trip' ? '/plan/trip' : '/plan'
    navigate(back, { replace: true })
  }

  const closeRouteDetail = () => setRouteDetailOpen(false)
  const handleRouteDetailExited = () => {
    if (isRouteDetail) {
      navigate('/plan/results', { replace: true })
    }
  }

  const openRouteSaved = (trip: SavedTrip) => {
    const persisted = getTrip(trip.id) ?? trip
    setSavedTrip(persisted)
    setRouteSavedOpen(true)
    navigate(`/plan/results/saved?id=${encodeURIComponent(persisted.id)}`)
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

  const createNewRoute = () => {
    setRouteSavedOpen(false)
    setRouteDetailOpen(false)
    setResultsOpen(false)
    setTripOpen(false)
    setWalkOpen(false)
    setSavedTrip(null)
    navigate('/plan', { replace: true })
  }

  const routeDetailPresent = isRouteDetail || routeDetailOpen
  const routeSavedPresent = isRouteSaved || routeSavedOpen
  const panelOpen =
    durationOpen || locationOpen || interestsOpen || resultsOpen || routeDetailOpen || routeSavedOpen
  const concealPlanChrome = isResultsStack && resultsOpen
  const formChromeBusy = tripOpen || walkOpen || panelOpen

  useEffect(() => {
    setForceHidden(panelOpen)
    return () => setForceHidden(false)
  }, [panelOpen, setForceHidden])

  const walkFormOpen = walkOpen || onWalkForm

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
          overflowY={formChromeBusy ? 'hidden' : 'auto'}
        >
          <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="primary">
            Что хочешь спланировать
          </Text>
          <ChoiceCard
            title="Поездка по Беларуси"
            subtitle="Из города в город на авто или велосипеде"
            onClick={openTrip}
          />
          <ChoiceCard
            title="Погулять по городу"
            subtitle="Прогулка по достопримечательностям"
            onClick={openWalk}
          />
        </Flex>
      </Box>

      <SlideOverlay open={tripOpen} onEntered={handleTripEntered} onExited={handleTripExited}>
        <Flex direction="column" flex="1" minH="0" h="full">
          <Header variant="back" title="Поездка" onBack={closeTrip} />
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
          <Box px="16px" pt="16px" pb="16px">
            <PrimaryButton onClick={() => navigate('/plan/loading')} disabled={!canGenerate}>
              Подобрать маршрут
            </PrimaryButton>
          </Box>
        </Flex>
      </SlideOverlay>

      <SlideOverlay open={walkOpen} onEntered={handleWalkEntered} onExited={handleWalkExited}>
        <Flex direction="column" flex="1" minH="0" h="full">
          <Header variant="back" title="Прогулка" onBack={closeWalk} />
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
              Прогулка по достопримечательностям
            </Text>

            <CityWidget city={state.origin} onOpen={() => openLocation('origin')} />

            <ViewWidget onOpen={openInterests} />

            <Segmented<WalkStopCount>
              ariaLabel="Сколько мест"
              value={walkStopCount(state.stopCount)}
              onChange={setStopCount}
              options={[
                { value: 3, label: '3 места' },
                { value: 5, label: '5 мест' },
                { value: 8, label: '8 мест' },
              ]}
            />
          </Flex>
          <Box px="16px" pt="16px" pb="16px">
            <PrimaryButton onClick={() => navigate('/plan/loading')} disabled={!canGenerate}>
              Подобрать маршрут
            </PrimaryButton>
          </Box>
        </Flex>
      </SlideOverlay>

      <DurationSheet open={durationOpen} onClose={() => setDurationOpen(false)} />

      <SlideOverlay
        open={interestsOpen}
        onEntered={handleInterestsEntered}
        onExited={handleInterestsExited}
        zIndex={16}
      >
        <InterestsPanel onClose={closeInterests} />
      </SlideOverlay>

      <SlideOverlay
        open={locationOpen}
        onEntered={handleLocationEntered}
        onExited={handleLocationExited}
        zIndex={16}
      >
        <LocationPanel
          point={locationPoint}
          title={walkFormOpen ? 'Город' : undefined}
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
          <RouteDetailPanel onClose={closeRouteDetail} onRouteSaved={openRouteSaved} />
        </SlideOverlay>
      ) : null}

      {routeSavedPresent && savedTrip ? (
        <SlideOverlay open={routeSavedOpen} onExited={handleRouteSavedExited} zIndex={16}>
          <RouteSavedPanel
            trip={savedTrip}
            onClose={closeRouteSaved}
            onOpenTrip={openSavedTripDetail}
            onCreateNew={createNewRoute}
          />
        </SlideOverlay>
      ) : null}
    </Flex>
  )
}

function ChoiceCard({
  title,
  subtitle,
  onClick,
}: {
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      bg="background"
      borderRadius="card"
      w="full"
      align="center"
      gap="12px"
      px="16px"
      py="16px"
      textAlign="left"
      cursor="pointer"
      transition="opacity 150ms"
      _hover={{ opacity: 0.92 }}
    >
      <Flex direction="column" flex="1" minW="0" gap="4px">
        <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary">
          {title}
        </Text>
        <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted">
          {subtitle}
        </Text>
      </Flex>
      <Box color="primary" flexShrink={0} display="inline-flex">
        <ChevronRight size={16} />
      </Box>
    </Flex>
  )
}

function CityWidget({ city, onOpen }: { city: Place | null; onOpen: () => void }) {
  return (
    <Flex
      as="button"
      onClick={onOpen}
      aria-label="Город"
      bg="background"
      borderRadius="card"
      w="full"
      align="center"
      gap="12px"
      px="16px"
      py={city ? '15px' : '16px'}
      textAlign="left"
      cursor="pointer"
      transition="opacity 150ms"
      _hover={{ opacity: 0.92 }}
    >
      <Flex direction="column" flex="1" minW="0" gap={city ? '2px' : '0'}>
        {city ? (
          <>
            <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="primary">
              Город
            </Text>
            <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary" truncate w="full">
              {city.title}
            </Text>
          </>
        ) : (
          <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary">
            Город
          </Text>
        )}
      </Flex>
      <Box color="primary" flexShrink={0} display="inline-flex">
        <ChevronRight size={16} />
      </Box>
    </Flex>
  )
}

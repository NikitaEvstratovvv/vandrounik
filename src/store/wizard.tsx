import { useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { completeDurationForTransport } from '@/lib/transport/speed'
import type { Duration, Place, Transport, WizardState } from '@/types'
import { WizardContext, type WizardContextValue } from '@/store/wizard-context'

const STORAGE_KEY = 'vandrounik.wizard.v1'

const initialState: WizardState = {
  transport: 'car',
  origin: null,
  destination: null,
  interests: [],
  duration: null,
}

type Action =
  | { type: 'setTransport'; transport: Transport }
  | { type: 'setOrigin'; place: Place }
  | { type: 'setDestination'; place: Place }
  | { type: 'swapPoints' }
  | { type: 'setInterests'; interests: string[] }
  | { type: 'setDuration'; duration: Duration }
  | { type: 'reset' }
  | { type: 'applyPreset'; preset: Partial<WizardState> }

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'setTransport':
      return {
        ...state,
        transport: action.transport,
        duration: state.duration ? completeDurationForTransport(state.duration, action.transport) : null,
      }
    case 'setOrigin':
      return { ...state, origin: action.place }
    case 'setDestination':
      return { ...state, destination: action.place }
    case 'swapPoints':
      return { ...state, origin: state.destination, destination: state.origin }
    case 'setInterests':
      return { ...state, interests: action.interests }
    case 'setDuration':
      return { ...state, duration: action.duration }
    case 'reset':
      return initialState
    case 'applyPreset':
      return { ...state, ...action.preset }
    default:
      return state
  }
}

function migrateDuration(raw: unknown): Duration | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Record<string, unknown>
  if ('hours' in d || 'km' in d) {
    return {
      unit: (d.unit as Duration['unit']) ?? 'hours',
      hours: typeof d.hours === 'number' ? d.hours : null,
      km: typeof d.km === 'number' ? d.km : null,
    }
  }
  if ('unit' in d && 'value' in d && typeof d.value === 'number') {
    const unit = d.unit as Duration['unit']
    return {
      unit,
      hours: unit === 'hours' ? d.value : null,
      km: unit === 'km' ? d.value : null,
    }
  }
  return null
}

function migratePlace(raw: unknown): Place | null {
  if (!raw || typeof raw !== 'object') return null
  const place = raw as Partial<Place>
  if (
    typeof place.id !== 'string' ||
    typeof place.title !== 'string' ||
    typeof place.subtitle !== 'string' ||
    typeof place.lat !== 'number' ||
    typeof place.lng !== 'number'
  ) {
    return null
  }
  return {
    id: place.id,
    title: place.title,
    subtitle: place.subtitle,
    lat: place.lat,
    lng: place.lng,
    distanceKm: place.distanceKm,
  }
}

function loadState(): WizardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<WizardState>
    return {
      ...initialState,
      ...parsed,
      origin: migratePlace(parsed.origin),
      destination: migratePlace(parsed.destination),
      duration: migrateDuration(parsed.duration),
    }
  } catch {
    return initialState
  }
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // localStorage недоступен (приватный режим) — игнорируем, online-first.
    }
  }, [state])

  const value = useMemo<WizardContextValue>(() => {
    const hasOrigin = state.origin !== null
    const hasDestination = state.destination !== null
    const hasInterests = state.interests.length > 0
    return {
      state,
      setTransport: (transport) => dispatch({ type: 'setTransport', transport }),
      setOrigin: (place) => dispatch({ type: 'setOrigin', place }),
      setDestination: (place) => dispatch({ type: 'setDestination', place }),
      swapPoints: () => dispatch({ type: 'swapPoints' }),
      setInterests: (interests) => dispatch({ type: 'setInterests', interests }),
      setDuration: (duration) => dispatch({ type: 'setDuration', duration }),
      reset: () => dispatch({ type: 'reset' }),
      applyPreset: (preset) => dispatch({ type: 'applyPreset', preset }),
      canGenerate: hasOrigin && hasDestination && hasInterests,
    }
  }, [state])

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

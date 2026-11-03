import { createContext, useContext } from 'react'
import type { Duration, InterestId, Place, RouteIntent, Transport, WalkStopCount, WizardState } from '@/types'

export type WizardContextValue = {
  state: WizardState
  setIntent: (intent: RouteIntent) => void
  setTransport: (transport: Transport) => void
  setOrigin: (place: Place) => void
  setDestination: (place: Place) => void
  swapPoints: () => void
  setInterests: (interests: InterestId[]) => void
  setDuration: (duration: Duration | null) => void
  setStopCount: (stopCount: WalkStopCount) => void
  reset: () => void
  /** Атомарно применить пресет (например, демо-маршрут). */
  applyPreset: (preset: Partial<WizardState>) => void
  /** Можно ли запускать генерацию (CTA enabled). */
  canGenerate: boolean
}

export const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}

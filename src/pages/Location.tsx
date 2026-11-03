import { LocationMapPanel } from '@/pages/LocationMapPanel'
import { useWizard } from '@/store/wizard-context'

type LocationPanelProps = {
  point: 'origin' | 'destination'
  onClose: () => void
  /** Kept for Plan overlay enter focus — map-first opens without auto keyboard. */
  focusSeq?: number
  title?: string
}

/**
 * S1 — Выбор «Откуда» / «Куда» / город прогулки.
 * Map-first + search sheet ([`LocationMapPanel`](./LocationMapPanel.tsx) `enableSearch`).
 */
export function LocationPanel({ point, onClose, title }: LocationPanelProps) {
  const { state, setOrigin, setDestination } = useWizard()

  const mapSeed =
    point === 'destination'
      ? (state.destination ?? state.origin)
      : (state.origin ?? state.destination)

  const near = point === 'destination' && state.origin ? state.origin : undefined

  return (
    <LocationMapPanel
      point={point}
      enableSearch
      title={title ?? (point === 'destination' ? 'Куда' : 'Откуда')}
      initialCenter={mapSeed}
      near={near}
      onClose={onClose}
      onConfirm={(place) => {
        if (point === 'destination') setDestination(place)
        else setOrigin(place)
        onClose()
      }}
    />
  )
}

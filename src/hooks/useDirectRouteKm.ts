import { useEffect, useState } from 'react'
import { fetchDirectRouteKm } from '@/lib/routing/directRouteKm'
import type { Place, Transport } from '@/types'

export function useDirectRouteKm(
  origin: Place | null,
  destination: Place | null,
  transport: Transport,
  enabled: boolean,
): { km: number | null; loading: boolean } {
  const [km, setKm] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !origin || !destination) {
      setKm(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchDirectRouteKm(origin, destination, transport)
      .then((routeKm) => {
        if (!cancelled) {
          setKm(routeKm)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setKm(null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled, origin?.lat, origin?.lng, destination?.lat, destination?.lng, transport])

  return { km, loading }
}

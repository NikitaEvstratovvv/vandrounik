import type { Duration, Transport } from '@/types'

export const TRANSPORT_SPEED_KMH: Record<Transport, number> = {
  car: 90,
  bike: 20,
}

export function hoursToKm(hours: number, transport: Transport): number {
  return Math.max(1, Math.round(hours * TRANSPORT_SPEED_KMH[transport]))
}

export function kmToHours(km: number, transport: Transport): number {
  return Math.max(1, Math.round(km / TRANSPORT_SPEED_KMH[transport]))
}

export function minutesForDistanceKm(km: number, transport: Transport): number {
  return Math.max(1, Math.round((km / TRANSPORT_SPEED_KMH[transport]) * 60))
}

export function completeDurationForTransport(duration: Duration, transport: Transport): Duration {
  if (duration.unit === 'km' && duration.km !== null) {
    return {
      ...duration,
      hours: kmToHours(duration.km, transport),
    }
  }

  if (duration.unit === 'hours' && duration.hours !== null) {
    return {
      ...duration,
      km: hoursToKm(duration.hours, transport),
    }
  }

  return duration
}

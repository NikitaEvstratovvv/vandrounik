import type { Duration } from '@/types'

/** Форматирование расстояния по voice.md §5: «82 км», «5,3 км» (запятая). */
export function formatDistance(km: number): string {
  const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
  return `${text} км`
}

/** Форматирование длительности для виджета E1: «4 часа» / «200 км». */
export function formatDuration(duration: Duration): string {
  const value = duration.unit === 'km' ? duration.km : duration.hours
  if (value === null) return '—'
  if (duration.unit === 'km') {
    return `${value} км`
  }
  return hoursLabel(value)
}

/** Активное сохранённое значение длительности для выбранной единицы. */
export function activeDurationValue(duration: Duration): number | null {
  return duration.unit === 'km' ? duration.km : duration.hours
}

/** Длительность поездки по маршруту: «~6 ч», «~4 ч 30 мин». */
export function formatTripMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `~${m} мин`
  if (m === 0) return `~${h} ч`
  return `~${h} ч ${m} мин`
}

/** Количество мест: «6 мест». */
export function formatPlacesCount(count: number): string {
  const word = count === 1 ? 'место' : count >= 2 && count <= 4 ? 'места' : 'мест'
  return `${count} ${word}`
}

/** Время в пути до следующей точки: «~45 мин». */
export function formatDriveMinutes(minutes?: number): string {
  if (!minutes) return '—'
  return `~${minutes} мин`
}

/** Метрики шита деталей маршрута (sm): «238 км · ~6 ч · 6 мест». */
export function formatRouteSummarySm(km: number, minutes: number, places: number): string {
  return `${Math.round(km)} км · ${formatTripMinutes(minutes)} · ${formatPlacesCount(places)}`
}

/** Метрики панели E2: «238 км · ~6 ч · 6 мест». */
export function formatRouteSummary(km: number, minutes: number, places: number): string {
  return `${Math.round(km)} км · ${formatTripMinutes(minutes)} · ${formatPlacesCount(places)}`
}

/** Метрики карточки маршрута: «7 остановок · 238 км · ~6 ч». */
export function formatRouteMetrics(stops: number, km: number, minutes: number): string {
  const stopWord = stops === 1 ? 'остановка' : stops >= 2 && stops <= 4 ? 'остановки' : 'остановок'
  return `${stops} ${stopWord} · ${Math.round(km)} км · ${formatTripMinutes(minutes)}`
}

/** Правильные падежи: «1 час» / «4 часа» / «6 часов». */
export function hoursLabel(value: number): string {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return `${value} час`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${value} часа`
  return `${value} часов`
}

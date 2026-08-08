/** Тип транспорта на E1 (segmented picker): «Авто» / «Велосипед». */
export type Transport = 'car' | 'bike'

/** Единица длительности поездки (BS1): «В часах» / «В километрах». */
export type DurationUnit = 'hours' | 'km'

/** Выбранная точка (откуда / куда). */
export type Place = {
  id: string
  title: string
  subtitle: string
  lat: number
  lng: number
  distanceKm?: number
}

/** Категория интересов (S2). */
export type Interest = {
  id: InterestId
  title: string
  description: string
}

export type InterestId = 'estates' | 'castles' | 'temples' | 'reserves' | 'dots'

export type TypeGroupId =
  | 'fortresses'
  | 'manors'
  | 'palaces'
  | 'christian'
  | 'jewish'
  | 'muslim'
  | 'national_parks'
  | 'nature_reserves'
  | 'dots'

/** Длительность поездки: отдельные значения для часов и километров. */
export type Duration = {
  unit: DurationUnit
  hours: number | null
  km: number | null
}

/** Полное состояние мастера создания маршрута. */
export type WizardState = {
  transport: Transport
  origin: Place | null
  destination: Place | null
  interests: InterestId[]
  /** Опционально: желаемая длительность / дистанция поездки. */
  duration: Duration | null
}

/** Точка маршрута (остановка). */
export type RouteStop = {
  placeId: string
  order: number
  name: string
  type: string
  typeGroup: TypeGroupId
  typeGroupLabel: string
  interests: InterestId[]
  primaryInterest: InterestId
  lat: number
  lng: number
  description?: string
  wikipediaUrl?: string
  imageUrl?: string
  driveMinutesToNext?: number
}

/** Вариант маршрута на E2 / E3. */
export type RouteVariant = {
  id: string
  title: string
  stops: RouteStop[]
  geometry?: LatLng[]
  totalKm: number
  totalMinutes: number
  interestLabels: string[]
}

/** Снимок параметров генерации (для сохранения и отладки). */
export type GenerationParams = {
  originTitle: string
  originLat: number | null
  originLng: number | null
  destinationTitle: string
  destinationLat: number | null
  destinationLng: number | null
  circular: boolean
  transport: Transport
  durationUnit: DurationUnit | null
  durationHours: number | null
  durationKm: number | null
  interests: InterestId[]
}

/** POI для генерации маршрута (seed и OSM-импорт). */
export type RoutePlace = {
  id: string
  name: string
  type: string
  typeGroup: TypeGroupId
  typeGroupLabel: string
  lat: number
  lng: number
  interests: InterestId[]
  description: string
  wikipediaUrl?: string
  imageUrl?: string
  source?: 'seed' | 'osm'
}

export type LatLng = {
  lat: number
  lng: number
}

/** Результат генерации: минимум 3 варианта в v1. */
export type GenerationResult = {
  params: GenerationParams
  variants: RouteVariant[]
  createdAt: string
}

import { INTERESTS } from '@/data/interests'
import type {
  GenerationParams,
  GenerationResult,
  RouteStop,
  RouteVariant,
  WizardState,
} from '@/types'

type MockPlace = {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  interests: string[]
  description: string
}

const MOCK_PLACES: MockPlace[] = [
  {
    id: 'mir',
    name: 'Мирский замок',
    type: 'Замок',
    lat: 53.4514,
    lng: 26.473,
    interests: ['estates', 'castles'],
    description:
      'Мирский замок — памятник архитектуры XVI века и объект Всемирного наследия ЮНЕСКО. Комплекс включает жилой корпус, башни, фортификационные сооружения и живописный прудовый парк в городе Мир.',
  },
  {
    id: 'nesvizh',
    name: 'Несвижский дворец',
    type: 'Дворец',
    lat: 53.2226,
    lng: 26.6912,
    interests: ['estates'],
    description:
      'Несвижский дворец — резиденция рода Радзивиллов, один из первых дворцов в стиле ренессанса в Восточной Европе. В ансамбль входят дворец, городская ратуша, костёл и обширный ландшафтный парк.',
  },
  {
    id: 'lida',
    name: 'Лидский замок',
    type: 'Замок',
    lat: 53.8883,
    lng: 25.2997,
    interests: ['castles'],
    description:
      'Лидский замок XIV века — один из старейших каменных замков Великого княжества Литовского. Сохранились стены с башнями и внутренний двор, откуда открывается вид на исторический центр Лиды.',
  },
  {
    id: 'novogrudok',
    name: 'Новогрудский замок',
    type: 'Замок',
    lat: 53.5942,
    lng: 25.8191,
    interests: ['castles'],
    description:
      'Руины Новогрудского замка на Замковой горе — одна из древнейших точек Беларуси. С высоты открывается панорама города, а рядом проходят туристические маршруты по историческому центру.',
  },
  {
    id: 'slutsk',
    name: 'Костёл Святого Антония',
    type: 'Храм',
    lat: 53.0279,
    lng: 27.5497,
    interests: ['temples'],
    description:
      'Костёл Святого Антония в Слуцке — барочный храм с выразительным фасадом и богатым внутренним убранством. Один из главных архитектурных символов города и остановка на маршрутах по Минской области.',
  },
  {
    id: 'grodno',
    name: 'Старый замок в Гродно',
    type: 'Замок',
    lat: 53.6778,
    lng: 23.829,
    interests: ['castles', 'temples'],
    description:
      'Старый замок в Гродно — резиденция польских королей и важный оборонительный объект на Немане. Сегодня здесь музей, а рядом — Новый замок и историческая застройка центра города.',
  },
  {
    id: 'braslav',
    name: 'Браславские озёра',
    type: 'Заповедник',
    lat: 55.6406,
    lng: 27.0469,
    interests: ['reserves'],
    description:
      'Браславские озёра — крупнейший национальный парк Беларуси с сотнями озёр, сосновыми лесами и смотровыми точками. Популярное место для однодневных поездок на природу и фотопрогулок.',
  },
  {
    id: 'belovezh',
    name: 'Беловежская пуща',
    type: 'Заповедник',
    lat: 52.5719,
    lng: 23.8,
    interests: ['reserves'],
    description:
      'Беловежская пуща — древний лесной массив и объект Всемирного наследия ЮНЕСКО. Здесь можно увидеть зубров, пройти экологические тропы и посетить музей природы.',
  },
  {
    id: 'polotsk',
    name: 'Софийский собор',
    type: 'Храм',
    lat: 55.4869,
    lng: 28.7686,
    interests: ['temples'],
    description:
      'Софийский собор в Полоцке — один из первых каменных храмов Древней Руси. В ансамбль входят колокольня и музей, а рядом находятся другие памятники древней столицы Полоцкого княжества.',
  },
  {
    id: 'khatyn',
    name: 'Мемориальный комплекс Хатынь',
    type: 'Мемориал',
    lat: 54.335,
    lng: 27.9467,
    interests: ['estates'],
    description:
      'Мемориальный комплекс Хатынь посвящён памяти жертв Великой Отечественной войны. Пространство с колоколами, кладбищем деревень и музеем — важная остановка на маршрутах по Беларуси.',
  },
]

const VARIANT_TITLES = ['Через Несвиж', 'По главным дорогам', 'Через заповедники'] as const

/** Минимальное число вариантов на E2. */
export const MIN_ROUTE_VARIANTS = 3

function isCircular(state: WizardState): boolean {
  if (!state.origin) return false
  if (!state.destination) return true
  return state.origin.id === state.destination.id
}

function buildParams(state: WizardState): GenerationParams {
  const originTitle = state.origin?.title ?? '—'
  const destinationTitle = state.destination?.title ?? originTitle
  return {
    originTitle,
    destinationTitle,
    circular: isCircular(state),
    transport: state.transport,
    durationUnit: state.duration?.unit ?? null,
    durationHours: state.duration?.hours ?? null,
    durationKm: state.duration?.km ?? null,
    interests: [...state.interests],
  }
}

function pickPlaces(interestIds: string[], count: number, offset: number): MockPlace[] {
  const pool = MOCK_PLACES.filter((p) => p.interests.some((id) => interestIds.includes(id)))
  const source = pool.length >= count ? pool : MOCK_PLACES
  const picked: MockPlace[] = []
  for (let i = 0; i < count; i++) {
    picked.push(source[(i + offset) % source.length])
  }
  return picked
}

function buildStops(places: MockPlace[]): RouteStop[] {
  return places.map((place, index) => ({
    placeId: place.id,
    order: index + 1,
    name: place.name,
    type: place.type,
    lat: place.lat,
    lng: place.lng,
    description: place.description,
    driveMinutesToNext: index < places.length - 1 ? 35 + index * 8 : undefined,
  }))
}

function estimateMetrics(
  state: WizardState,
  stopCount: number,
  variantIndex: number,
): { km: number; minutes: number } {
  const scales = [1, 0.72, 0.55]
  const scale = scales[variantIndex] ?? scales[scales.length - 1]

  if (state.duration?.unit === 'km' && state.duration.km) {
    const km = Math.round(state.duration.km * scale)
    return { km, minutes: Math.round((km / 50) * 60) }
  }

  if (state.duration?.unit === 'hours' && state.duration.hours) {
    const minutes = Math.round(state.duration.hours * 60 * scale)
    return { km: Math.round((minutes / 60) * 50), minutes }
  }

  const defaults = [
    { km: 238, minutes: 360 },
    { km: 172, minutes: 260 },
    { km: 132, minutes: 200 },
  ]
  const base = defaults[variantIndex] ?? defaults[0]
  const stopFactor = stopCount / 7
  return {
    km: Math.round(base.km * stopFactor),
    minutes: Math.round(base.minutes * stopFactor),
  }
}

function buildVariant(
  state: WizardState,
  variantIndex: number,
  interestLabels: string[],
): RouteVariant {
  const stopCounts = [7, 5, 6]
  const stopCount = stopCounts[variantIndex] ?? 6
  const places = pickPlaces(state.interests, stopCount, variantIndex * 2)
  const stops = buildStops(places)
  const { km, minutes } = estimateMetrics(state, stops.length, variantIndex)

  return {
    id: `variant-${variantIndex + 1}`,
    title: VARIANT_TITLES[variantIndex] ?? `Вариант ${variantIndex + 1}`,
    stops,
    totalKm: km,
    totalMinutes: minutes,
    interestLabels,
  }
}

/** Mock-генерация вариантов маршрута по параметрам мастера (минимум 3). */
export function generateMockRoutes(state: WizardState): GenerationResult {
  const interestLabels = INTERESTS.filter((i) => state.interests.includes(i.id)).map((i) => i.title)

  const variants: RouteVariant[] = Array.from({ length: MIN_ROUTE_VARIANTS }, (_, i) =>
    buildVariant(state, i, interestLabels),
  )

  return {
    params: buildParams(state),
    variants,
    createdAt: new Date().toISOString(),
  }
}

/** Восстановить состояние мастера из сохранённых параметров генерации. */
export function wizardStateFromGenerationParams(params: GenerationParams): WizardState {
  const origin =
    params.originTitle !== '—'
      ? { id: 'cached-origin', title: params.originTitle, subtitle: '' }
      : null
  const destination =
    params.circular && origin
      ? origin
      : params.destinationTitle !== '—'
        ? { id: 'cached-destination', title: params.destinationTitle, subtitle: '' }
        : null

  const duration =
    params.durationUnit === 'hours' && params.durationHours !== null
      ? { unit: 'hours' as const, hours: params.durationHours, km: params.durationKm }
      : params.durationUnit === 'km' && params.durationKm !== null
        ? { unit: 'km' as const, hours: params.durationHours, km: params.durationKm }
        : null

  return {
    transport: params.transport,
    origin,
    destination,
    interests: [...params.interests],
    duration,
  }
}

/** Дополняет устаревший результат до MIN_ROUTE_VARIANTS (миграция localStorage). */
export function ensureMinRouteVariants(result: GenerationResult): GenerationResult {
  if (result.variants.length >= MIN_ROUTE_VARIANTS) return result
  const refreshed = generateMockRoutes(wizardStateFromGenerationParams(result.params))
  return {
    ...refreshed,
    createdAt: result.createdAt,
  }
}

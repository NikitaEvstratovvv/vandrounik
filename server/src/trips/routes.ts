import { Hono } from 'hono'
import { requireAuth, type AuthVars } from '../auth/middleware.js'
import { ApiError } from '../errors.js'
import {
  createTrip,
  deleteTrip,
  getTrip,
  importTrips,
  listTrips,
  updateTrip,
  type TripStatus,
} from './repo.js'

function parseStatus(value: unknown): TripStatus | undefined {
  if (value === undefined) return undefined
  if (value === 'new' || value === 'in-progress' || value === 'completed') return value
  throw new ApiError(400, 'validation_error', 'Некорректный status')
}

export const tripsRoutes = new Hono<{ Variables: AuthVars }>()

tripsRoutes.use('*', requireAuth)

tripsRoutes.get('/', (c) => c.json({ trips: listTrips(c.get('user').id) }))

tripsRoutes.post('/import', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const trips = (body as { trips?: unknown }).trips
  if (!Array.isArray(trips)) {
    throw new ApiError(400, 'validation_error', 'Нужен массив trips')
  }
  const imported = importTrips(c.get('user').id, trips as Parameters<typeof importTrips>[1])
  return c.json({ trips: imported })
})

tripsRoutes.get('/:id', (c) => {
  const trip = getTrip(c.get('user').id, c.req.param('id'))
  if (!trip) throw new ApiError(404, 'not_found', 'Поездка не найдена')
  return c.json(trip)
})

tripsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const trip = createTrip(c.get('user').id, {
    variant: (body as { variant?: unknown }).variant,
    params: (body as { params?: unknown }).params ?? null,
  })
  return c.json(trip, 201)
})

tripsRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const trip = updateTrip(c.get('user').id, c.req.param('id'), {
    status: parseStatus((body as { status?: unknown }).status),
    visitedPlaceIds: Array.isArray((body as { visitedPlaceIds?: unknown }).visitedPlaceIds)
      ? ((body as { visitedPlaceIds: unknown[] }).visitedPlaceIds.filter(
          (id): id is string => typeof id === 'string',
        ) as string[])
      : undefined,
  })
  return c.json(trip)
})

tripsRoutes.delete('/:id', (c) => {
  if (!deleteTrip(c.get('user').id, c.req.param('id'))) {
    throw new ApiError(404, 'not_found', 'Поездка не найдена')
  }
  return c.body(null, 204)
})

import { Hono } from 'hono'
import { requireAuth, type AuthVars } from '../auth/middleware.js'
import { ApiError } from '../errors.js'
import { addVisited, listVisited, removeVisited, replaceVisited } from '../trips/repo.js'

export const visitedRoutes = new Hono<{ Variables: AuthVars }>()

visitedRoutes.use('*', requireAuth)

visitedRoutes.get('/', (c) => c.json({ placeIds: listVisited(c.get('user').id) }))

visitedRoutes.put('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const placeIds = (body as { placeIds?: unknown }).placeIds
  if (!Array.isArray(placeIds)) {
    throw new ApiError(400, 'validation_error', 'Нужен placeIds')
  }
  const ids = placeIds.filter((id): id is string => typeof id === 'string')
  return c.json({ placeIds: replaceVisited(c.get('user').id, ids) })
})

visitedRoutes.post('/:placeId', (c) => {
  const placeId = c.req.param('placeId')
  if (!placeId) throw new ApiError(400, 'validation_error', 'Нужен placeId')
  return c.json({ placeIds: addVisited(c.get('user').id, placeId) })
})

visitedRoutes.delete('/:placeId', (c) => {
  const placeId = c.req.param('placeId')
  if (!placeId) throw new ApiError(400, 'validation_error', 'Нужен placeId')
  return c.json({ placeIds: removeVisited(c.get('user').id, placeId) })
})

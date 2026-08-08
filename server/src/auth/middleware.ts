import { createMiddleware } from 'hono/factory'
import { ApiError } from '../errors.js'
import { verifyAccessToken } from '../auth/tokens.js'
import { findUserById, type User } from '../users/repo.js'

export type AuthVars = { user: User }

export const requireAuth = createMiddleware<{ Variables: AuthVars }>(async (c, next) => {
  const header = c.req.header('authorization')
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'unauthorized', 'Требуется авторизация')
  }
  const token = header.slice('Bearer '.length).trim()
  const userId = await verifyAccessToken(token)
  if (!userId) throw new ApiError(401, 'unauthorized', 'Сессия истекла')
  const user = findUserById(userId)
  if (!user) throw new ApiError(401, 'unauthorized', 'Пользователь не найден')
  c.set('user', user)
  await next()
})

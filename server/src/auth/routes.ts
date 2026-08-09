import { Hono } from 'hono'
import { ApiError } from '../errors.js'
import { createEmailUser, findUserByEmail, findUserById } from '../users/repo.js'
import {
  assertAllowed,
  issueEmailChallenge,
  normalizeEmail,
  verifyEmailChallenge,
} from './challenge.js'
import { findValidRefresh, issueTokens, revokeRefreshToken } from './tokens.js'

export const authRoutes = new Hono()

authRoutes.post('/email/start', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = normalizeEmail((body as { email?: unknown }).email)
  assertAllowed(email)
  await issueEmailChallenge(email, 'login')
  return c.json({ ok: true })
})

authRoutes.post('/email/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = normalizeEmail((body as { email?: unknown }).email)
  assertAllowed(email)
  verifyEmailChallenge(email, (body as { code?: unknown }).code)

  let user = findUserByEmail(email)
  if (!user) user = createEmailUser(email)

  const tokens = await issueTokens(user)
  return c.json({
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  })
})

authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const refreshToken = (body as { refreshToken?: unknown }).refreshToken
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw new ApiError(400, 'validation_error', 'Укажите refreshToken')
  }
  const row = findValidRefresh(refreshToken)
  if (!row) throw new ApiError(401, 'unauthorized', 'Сессия истекла')

  revokeRefreshToken(refreshToken)
  const user = findUserById(row.userId)
  if (!user) throw new ApiError(401, 'unauthorized', 'Пользователь не найден')

  const tokens = await issueTokens(user)
  return c.json(tokens)
})

authRoutes.post('/logout', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const refreshToken = (body as { refreshToken?: unknown }).refreshToken
  if (typeof refreshToken === 'string' && refreshToken) {
    revokeRefreshToken(refreshToken)
  }
  return c.body(null, 204)
})

authRoutes.post('/google', (c) =>
  c.json(
    {
      error: {
        code: 'not_implemented',
        message: 'Вход через Google пока недоступен',
      },
    },
    501,
  ),
)

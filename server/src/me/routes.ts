import { Hono } from 'hono'
import { ApiError } from '../errors.js'
import { requireAuth, type AuthVars } from '../auth/middleware.js'
import { updateUser, type ProfileAvatar } from '../users/repo.js'

const PRESET_IDS = new Set(['stork', 'fox', 'bison', 'frog', 'snake', 'beaver', 'mouse'])

function parseAvatar(value: unknown): ProfileAvatar | undefined {
  if (value == null) return undefined
  if (typeof value !== 'object') {
    throw new ApiError(400, 'validation_error', 'Некорректный avatar')
  }
  const v = value as { kind?: unknown; id?: unknown; dataUrl?: unknown }
  if (v.kind === 'preset' && typeof v.id === 'string' && PRESET_IDS.has(v.id)) {
    return { kind: 'preset', id: v.id }
  }
  if (v.kind === 'custom' && typeof v.dataUrl === 'string' && v.dataUrl.startsWith('data:image/')) {
    if (v.dataUrl.length > 400_000) {
      throw new ApiError(400, 'validation_error', 'Слишком большой файл аватара')
    }
    return { kind: 'custom', dataUrl: v.dataUrl }
  }
  throw new ApiError(400, 'validation_error', 'Некорректный avatar')
}

export const meRoutes = new Hono<{ Variables: AuthVars }>()

meRoutes.use('*', requireAuth)

meRoutes.get('/', (c) => c.json(c.get('user')))

meRoutes.patch('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const displayName = (body as { displayName?: unknown }).displayName
  const avatar = parseAvatar((body as { avatar?: unknown }).avatar)

  if (displayName !== undefined && typeof displayName !== 'string') {
    throw new ApiError(400, 'validation_error', 'Некорректное имя')
  }
  if (displayName === undefined && avatar === undefined) {
    throw new ApiError(400, 'validation_error', 'Нечего обновлять')
  }

  const updated = updateUser(c.get('user').id, {
    displayName: typeof displayName === 'string' ? displayName : undefined,
    avatar,
  })
  if (!updated) throw new ApiError(404, 'not_found', 'Пользователь не найден')
  return c.json(updated)
})

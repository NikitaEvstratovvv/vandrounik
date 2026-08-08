import {
  DEFAULT_AVATAR,
  defaultDisplayName,
  type ProfileAvatar,
} from '@/lib/profile/avatar'
import {
  apiFetch,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  type ApiUser,
  type AuthResponse,
} from '@/lib/api/client'

export type AuthProvider = 'email' | 'google'

export type AuthSession = {
  userId: string
  email: string
  username: string
  displayName: string
  avatar: ProfileAvatar
  provider: AuthProvider
  createdAt: string
}

const SESSION_KEY = 'vandrounik.auth.session.v1'
const PENDING_KEY = 'vandrounik.auth.pending.v1'
const EMAIL_CHANGE_PENDING_KEY = 'vandrounik.auth.email-change.v1'

export type AuthPending = {
  email: string
  codeSentAt: string
}

export type EmailChangePending = {
  email: string
  codeSentAt: string
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage недоступен — игнорируем.
  }
}

export function userToSession(user: ApiUser): AuthSession {
  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    provider: user.provider,
    createdAt: user.createdAt,
  }
}

function normalizeSession(raw: Partial<AuthSession> & { email?: string; userId?: string }): AuthSession | null {
  if (!raw?.userId || !raw.email) return null
  const email = raw.email
  const username = raw.username || email.split('@')[0] || 'user'
  return {
    userId: raw.userId,
    email,
    username,
    displayName: raw.displayName?.trim() || defaultDisplayName(email, username),
    avatar: raw.avatar ?? DEFAULT_AVATAR,
    provider: raw.provider === 'google' ? 'google' : 'email',
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

export function loadSession(): AuthSession | null {
  if (!getAccessToken()) return null
  const raw = readJson<Partial<AuthSession>>(SESSION_KEY)
  if (!raw) return null
  return normalizeSession(raw)
}

export function saveSession(session: AuthSession): void {
  writeJson(SESSION_KEY, session)
  clearPending()
}

export async function updateSession(
  patch: Partial<Pick<AuthSession, 'displayName' | 'avatar' | 'email' | 'username'>>,
): Promise<AuthSession | null> {
  const current = loadSession()
  if (!current) return null

  // Email change stays local-pending until /me/email API exists; profile name/photo hit API.
  if (patch.displayName !== undefined || patch.avatar !== undefined) {
    try {
      const user = await apiFetch<ApiUser>('/me', {
        method: 'PATCH',
        body: JSON.stringify({
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
        }),
      })
      const session = userToSession(user)
      saveSession(session)
      if (patch.email) {
        session.email = patch.email.trim().toLowerCase()
        saveSession(session)
      }
      return session
    } catch {
      // fall through to local cache update if API unavailable
    }
  }

  const next: AuthSession = {
    ...current,
    ...patch,
    displayName: (patch.displayName ?? current.displayName).trim() || current.displayName,
  }
  if (patch.email) {
    next.email = patch.email.trim().toLowerCase()
  }
  saveSession(next)
  return next
}

export function clearSession(): void {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    void apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    }).catch(() => undefined)
  }
  clearTokens()
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
  clearEmailChangePending()
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken() && loadSession())
}

export function loadPending(): AuthPending | null {
  const pending = readJson<AuthPending>(PENDING_KEY)
  if (!pending?.email) return null
  return pending
}

export function savePending(email: string): AuthPending {
  const pending: AuthPending = { email: email.trim().toLowerCase(), codeSentAt: new Date().toISOString() }
  writeJson(PENDING_KEY, pending)
  return pending
}

export function clearPending(): void {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

export function loadEmailChangePending(): EmailChangePending | null {
  const pending = readJson<EmailChangePending>(EMAIL_CHANGE_PENDING_KEY)
  if (!pending?.email) return null
  return pending
}

export function saveEmailChangePending(email: string): EmailChangePending {
  const pending: EmailChangePending = {
    email: email.trim().toLowerCase(),
    codeSentAt: new Date().toISOString(),
  }
  writeJson(EMAIL_CHANGE_PENDING_KEY, pending)
  return pending
}

export function clearEmailChangePending(): void {
  try {
    localStorage.removeItem(EMAIL_CHANGE_PENDING_KEY)
  } catch {
    // ignore
  }
}

const EMAIL_RE = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
/** Допустимые символы в поле email по тексту ошибки Figma (+ @ для почты). */
const EMAIL_CHARS_RE = /^[a-zA-Z0-9.@_+-]*$/

export function isValidEmail(value: string): boolean {
  const v = value.trim()
  return EMAIL_CHARS_RE.test(v) && EMAIL_RE.test(v)
}

/** Есть ли недопустимые символы (кириллица и т.п.) — Figma 320:1734. */
export function hasInvalidEmailChars(value: string): boolean {
  return !EMAIL_CHARS_RE.test(value)
}

/** Текст ошибки под полем email — Figma node 320:1734 / 320:1731. */
export const EMAIL_HINT = 'Используйте латиницу, цифры, точку и дефис'

/** Код из письма: ≥4 символа. */
export function isValidMockCode(value: string): boolean {
  return value.trim().length >= 4
}

export async function startEmailLogin(email: string): Promise<void> {
  await apiFetch<{ ok: true }>('/auth/email/start', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
    skipAuth: true,
  })
  savePending(email)
}

export async function verifyEmailLogin(email: string, code: string): Promise<AuthSession> {
  const data = await apiFetch<AuthResponse>('/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
    skipAuth: true,
  })
  saveTokens(data.accessToken, data.refreshToken)
  const session = userToSession(data.user)
  saveSession(session)
  const { syncProfileDataAfterLogin } = await import('@/lib/storage/trips')
  await syncProfileDataAfterLogin(session.userId)
  return session
}

/** Тесты / offline: локальная сессия без API. */
export function createEmailSession(email: string): AuthSession {
  const normalized = email.trim().toLowerCase()
  const local = normalized.split('@')[0] || 'user'
  const session: AuthSession = {
    userId: `email:${normalized}`,
    email: normalized,
    username: local,
    displayName: defaultDisplayName(normalized, local),
    avatar: DEFAULT_AVATAR,
    provider: 'email',
    createdAt: new Date().toISOString(),
  }
  // Tests expect session without tokens — seed a dummy access token so loadSession works.
  saveTokens('test-access', 'test-refresh')
  saveSession(session)
  return session
}

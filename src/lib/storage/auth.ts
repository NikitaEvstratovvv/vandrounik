import {
  DEFAULT_AVATAR,
  defaultDisplayName,
  type ProfileAvatar,
} from '@/lib/profile/avatar'

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
  const raw = readJson<Partial<AuthSession>>(SESSION_KEY)
  if (!raw) return null
  const session = normalizeSession(raw)
  if (!session) return null
  // Миграция старых сессий без displayName/avatar.
  if (!raw.displayName || !raw.avatar) {
    saveSession(session)
  }
  return session
}

export function saveSession(session: AuthSession): void {
  writeJson(SESSION_KEY, session)
  clearPending()
}

export function updateSession(patch: Partial<Pick<AuthSession, 'displayName' | 'avatar' | 'email' | 'username'>>): AuthSession | null {
  const current = loadSession()
  if (!current) return null
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
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
  clearEmailChangePending()
}

export function isAuthenticated(): boolean {
  return loadSession() !== null
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

/** Mock: принимаем любой код из ≥4 символов. */
export function isValidMockCode(value: string): boolean {
  return value.trim().length >= 4
}

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
  saveSession(session)
  return session
}

export function createGoogleSession(): AuthSession {
  const session: AuthSession = {
    userId: 'google:mock',
    email: 'user@gmail.com',
    username: 'google-user',
    displayName: 'Google User',
    avatar: DEFAULT_AVATAR,
    provider: 'google',
    createdAt: new Date().toISOString(),
  }
  saveSession(session)
  return session
}

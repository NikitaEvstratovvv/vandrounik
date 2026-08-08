import type { ProfileAvatar } from '@/lib/profile/avatar'

const ACCESS_KEY = 'vandrounik.auth.access.v1'
const REFRESH_KEY = 'vandrounik.auth.refresh.v1'

export type ApiUser = {
  id: string
  email: string
  username: string
  displayName: string
  avatar: ProfileAvatar
  provider: 'email' | 'google'
  createdAt: string
}

export type AuthResponse = {
  user: ApiUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type ApiErrorBody = {
  error: { code: string; message: string }
}

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  } catch {
    // ignore
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // ignore
  }
}

type ApiFetchOptions = RequestInit & { skipAuth?: boolean; retry?: boolean }

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string }
    saveTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, retry = true, headers: initHeaders, ...rest } = options
  const headers = new Headers(initHeaders)
  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`/api/v1${path}`, { ...rest, headers })

  if (res.status === 401 && !skipAuth && retry) {
    if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
    const ok = await refreshPromise
    if (ok) return apiFetch<T>(path, { ...options, retry: false })
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const err = data as ApiErrorBody | null
    throw new ApiClientError(
      res.status,
      err?.error?.code ?? 'internal',
      err?.error?.message ?? 'Ошибка запроса',
    )
  }

  return data as T
}

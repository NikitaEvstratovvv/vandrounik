import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSession,
  createEmailSession,
  hasInvalidEmailChars,
  isValidEmail,
  isValidMockCode,
  loadSession,
  updateSession,
} from '@/lib/storage/auth'

function installMemoryStorage() {
  const store = new Map<string, string>()
  const memory = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
  }
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true })
}

describe('auth validation', () => {
  it('accepts simple emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('  user@example.com ')).toBe(true)
  })

  it('rejects bad emails and non-latin', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('oqiwjqi')).toBe(false)
    expect(isValidEmail('ывывв')).toBe(false)
    expect(hasInvalidEmailChars('ывывв')).toBe(true)
    expect(hasInvalidEmailChars('oqiwjqi')).toBe(false)
  })

  it('accepts mock codes of length >= 4', () => {
    expect(isValidMockCode('0000')).toBe(true)
    expect(isValidMockCode('123')).toBe(false)
  })
})

describe('auth session profile fields', () => {
  beforeEach(() => {
    installMemoryStorage()
    clearSession()
  })

  it('creates session with displayName and default avatar', () => {
    const session = createEmailSession('nikita@example.com')
    expect(session.displayName).toBe('nikita')
    expect(session.avatar).toEqual({ kind: 'preset', id: 'stork' })
    expect(loadSession()?.displayName).toBe('nikita')
  })

  it('updates displayName, email, and avatar', () => {
    createEmailSession('a@b.co')
    const next = updateSession({
      displayName: 'Vandro',
      email: 'new@mail.com',
      avatar: { kind: 'preset', id: 'fox' },
    })
    expect(next?.displayName).toBe('Vandro')
    expect(next?.email).toBe('new@mail.com')
    expect(next?.avatar).toEqual({ kind: 'preset', id: 'fox' })
    expect(loadSession()?.avatar).toEqual({ kind: 'preset', id: 'fox' })
  })
})

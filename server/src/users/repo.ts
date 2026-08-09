import { randomUUID } from 'node:crypto'
import { getDb, type UserRow } from '../db.js'

export type ProfileAvatar =
  | { kind: 'preset'; id: string }
  | { kind: 'custom'; dataUrl: string }

export type User = {
  id: string
  email: string
  username: string
  displayName: string
  avatar: ProfileAvatar
  provider: 'email' | 'google'
  createdAt: string
}

const DEFAULT_AVATAR: ProfileAvatar = { kind: 'preset', id: 'stork' }

export function rowToUser(row: UserRow): User {
  let avatar: ProfileAvatar = DEFAULT_AVATAR
  try {
    avatar = JSON.parse(row.avatar_json) as ProfileAvatar
  } catch {
    avatar = DEFAULT_AVATAR
  }
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatar,
    provider: row.provider,
    createdAt: row.created_at,
  }
}

export function findUserByEmail(email: string): User | null {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
    .get(email.trim().toLowerCase()) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export function findUserById(id: string): User | null {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export function createEmailUser(email: string): User {
  const normalized = email.trim().toLowerCase()
  const local = normalized.split('@')[0] || 'user'
  const user: User = {
    id: randomUUID(),
    email: normalized,
    username: local,
    displayName: local,
    avatar: DEFAULT_AVATAR,
    provider: 'email',
    createdAt: new Date().toISOString(),
  }
  getDb()
    .prepare(
      `INSERT INTO users (id, email, username, display_name, avatar_json, provider, created_at)
       VALUES (@id, @email, @username, @display_name, @avatar_json, @provider, @created_at)`,
    )
    .run({
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.displayName,
      avatar_json: JSON.stringify(user.avatar),
      provider: user.provider,
      created_at: user.createdAt,
    })
  return user
}

export function updateUser(
  id: string,
  patch: { displayName?: string; avatar?: ProfileAvatar },
): User | null {
  const current = findUserById(id)
  if (!current) return null
  const next: User = {
    ...current,
    displayName: patch.displayName?.trim() || current.displayName,
    avatar: patch.avatar ?? current.avatar,
  }
  getDb()
    .prepare('UPDATE users SET display_name = ?, avatar_json = ? WHERE id = ?')
    .run(next.displayName, JSON.stringify(next.avatar), id)
  return next
}

export function updateUserEmail(id: string, email: string): User | null {
  const current = findUserById(id)
  if (!current) return null
  const normalized = email.trim().toLowerCase()
  try {
    getDb().prepare('UPDATE users SET email = ? WHERE id = ?').run(normalized, id)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('UNIQUE')) {
      return null
    }
    throw error
  }
  return { ...current, email: normalized }
}

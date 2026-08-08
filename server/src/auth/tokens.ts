import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'
import { getDb } from '../db.js'
import type { User } from '../users/repo.js'

const accessKey = () => new TextEncoder().encode(env.jwtAccessSecret)
const refreshKey = () => new TextEncoder().encode(env.jwtRefreshSecret)

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function hashCode(code: string): string {
  return hashToken(code.trim())
}

export function safeEqualHash(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${env.accessTtlSeconds}s`)
    .sign(accessKey())
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, accessKey())
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') return null
    return payload.sub
  } catch {
    return null
  }
}

function newRefreshPlain(): string {
  return randomBytes(48).toString('base64url')
}

export async function issueTokens(user: User): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const accessToken = await signAccessToken(user.id)
  const refreshToken = newRefreshPlain()
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + env.refreshTtlSeconds * 1000).toISOString()
  getDb()
    .prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)
       VALUES (?, ?, ?, ?, NULL)`,
    )
    .run(id, user.id, hashToken(refreshToken), expiresAt)
  return {
    accessToken,
    refreshToken,
    expiresIn: env.accessTtlSeconds,
  }
}

export function revokeRefreshToken(plain: string): void {
  getDb()
    .prepare(
      `UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`,
    )
    .run(new Date().toISOString(), hashToken(plain))
}

export function findValidRefresh(plain: string): { id: string; userId: string } | null {
  const row = getDb()
    .prepare(
      `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?`,
    )
    .get(hashToken(plain)) as
    | { id: string; user_id: string; expires_at: string; revoked_at: string | null }
    | undefined
  if (!row || row.revoked_at) return null
  if (new Date(row.expires_at).getTime() < Date.now()) return null
  return { id: row.id, userId: row.user_id }
}

export function revokeAllUserRefresh(userId: string): void {
  getDb()
    .prepare(
      `UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
    )
    .run(new Date().toISOString(), userId)
}

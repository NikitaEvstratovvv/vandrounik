import { randomInt } from 'node:crypto'
import { ApiError } from '../errors.js'
import { env } from '../env.js'
import { getDb } from '../db.js'
import { sendLoginCode } from './email.js'
import { hashCode, safeEqualHash } from './tokens.js'

const EMAIL_RE = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const CHALLENGE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 30 * 1000
const MAX_ATTEMPTS = 8

export function normalizeEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new ApiError(400, 'validation_error', 'Укажите email')
  }
  const normalized = email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized)) {
    throw new ApiError(400, 'validation_error', 'Некорректный email')
  }
  return normalized
}

export function assertAllowed(email: string) {
  if (env.allowedEmails.length === 0) return
  if (!env.allowedEmails.includes(email)) {
    throw new ApiError(403, 'forbidden', 'Доступ пока только по приглашению')
  }
}

function generateCode(): string {
  if (!env.resendApiKey && env.devLoginCode) return env.devLoginCode
  return String(randomInt(1000, 10000))
}

export async function issueEmailChallenge(
  email: string,
  purpose: 'login' | 'email_change' = 'login',
): Promise<void> {
  const now = Date.now()
  const existing = getDb()
    .prepare('SELECT last_sent_at FROM auth_challenges WHERE email = ? COLLATE NOCASE')
    .get(email) as { last_sent_at: string } | undefined
  if (existing) {
    const last = new Date(existing.last_sent_at).getTime()
    if (now - last < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, 'rate_limited', 'Подождите немного перед повторной отправкой')
    }
  }

  const code = generateCode()
  const expiresAt = new Date(now + CHALLENGE_TTL_MS).toISOString()
  const lastSentAt = new Date(now).toISOString()
  getDb()
    .prepare(
      `INSERT INTO auth_challenges (email, code_hash, expires_at, attempts, last_sent_at)
       VALUES (?, ?, ?, 0, ?)
       ON CONFLICT(email) DO UPDATE SET
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         attempts = 0,
         last_sent_at = excluded.last_sent_at`,
    )
    .run(email, hashCode(code), expiresAt, lastSentAt)

  try {
    await sendLoginCode(email, code, purpose)
  } catch {
    throw new ApiError(500, 'internal', 'Не удалось отправить код')
  }
}

export function verifyEmailChallenge(email: string, codeRaw: unknown): void {
  if (typeof codeRaw !== 'string' || codeRaw.trim().length < 4) {
    throw new ApiError(400, 'validation_error', 'Введите код из письма (не меньше 4 символов)')
  }

  const challenge = getDb()
    .prepare('SELECT * FROM auth_challenges WHERE email = ? COLLATE NOCASE')
    .get(email) as
    | { code_hash: string; expires_at: string; attempts: number }
    | undefined

  if (!challenge) {
    throw new ApiError(401, 'unauthorized', 'Сначала запросите код')
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    throw new ApiError(429, 'rate_limited', 'Слишком много попыток. Запросите новый код')
  }
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    throw new ApiError(401, 'unauthorized', 'Код истёк. Запросите новый')
  }

  const ok = safeEqualHash(challenge.code_hash, hashCode(codeRaw))
  if (!ok) {
    getDb()
      .prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE email = ? COLLATE NOCASE')
      .run(email)
    throw new ApiError(401, 'unauthorized', 'Неверный код')
  }

  getDb().prepare('DELETE FROM auth_challenges WHERE email = ? COLLATE NOCASE').run(email)
}

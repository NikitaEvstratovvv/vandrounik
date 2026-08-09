import { readFileSync, existsSync } from 'node:fs'
import { isAbsolute, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resolvePath(raw: string, base: string): string {
  return isAbsolute(raw) ? raw : resolve(base, raw)
}

function loadDotEnv() {
  const path = resolve(root, '.env')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadDotEnv()

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  databasePath: resolvePath(process.env.DATABASE_PATH ?? './data/vandrounik.sqlite', root),
  /** Built Vite app (`dist/`). Absolute in Docker via STATIC_DIR. */
  staticDir: resolvePath(process.env.STATIC_DIR ?? '../dist', root),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  accessTtlSeconds: Number(process.env.ACCESS_TTL_SECONDS ?? 900),
  refreshTtlSeconds: Number(process.env.REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 30),
  resendApiKey: process.env.RESEND_API_KEY?.trim() || '',
  emailFrom: process.env.EMAIL_FROM ?? 'Vandrounik <noreply@vandrounik.of.by>',
  /** Empty in prod when Resend is on — leave unset to disable fixed code. */
  devLoginCode: process.env.DEV_LOGIN_CODE?.trim() || '',
  corsOrigins: (process.env.CORS_ORIGINS ??
    'http://localhost:5173,http://127.0.0.1:5173,https://vandrounik.of.by')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  allowedEmails: (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
}

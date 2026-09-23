import { existsSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { env } from '../env.js'
import { ApiError } from '../errors.js'

const DATA_URL_RE = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/i
const FILE_RE = /^[0-9a-f-]{36}-\d+\.jpg$/i

export type StoredCustomAvatar = { kind: 'custom'; url: string }

function absolutePath(fileName: string): string {
  return join(env.avatarsDir, fileName)
}

function urlFor(fileName: string): string {
  return `/media/avatars/${fileName}`
}

/** Remove all avatar files for this user (versioned `{userId}-{unix}.jpg`). */
export function deleteUserAvatarFiles(userId: string): void {
  const prefix = `${userId}-`
  for (const name of readdirSync(env.avatarsDir)) {
    if (name.startsWith(prefix) && name.endsWith('.jpg')) {
      try {
        unlinkSync(absolutePath(name))
      } catch {
        // ignore missing
      }
    }
  }
}

export function writeAvatarFromDataUrl(userId: string, dataUrl: string): StoredCustomAvatar {
  const match = DATA_URL_RE.exec(dataUrl.trim())
  if (!match) {
    throw new ApiError(400, 'validation_error', 'Некорректный avatar')
  }
  let bytes: Buffer
  try {
    bytes = Buffer.from(match[1], 'base64')
  } catch {
    throw new ApiError(400, 'validation_error', 'Некорректный avatar')
  }
  if (bytes.length === 0 || bytes.length > 300_000) {
    throw new ApiError(400, 'validation_error', 'Слишком большой файл аватара')
  }

  deleteUserAvatarFiles(userId)
  const fileName = `${userId}-${Date.now()}.jpg`
  writeFileSync(absolutePath(fileName), bytes)
  return { kind: 'custom', url: urlFor(fileName) }
}

export function resolveAvatarFile(urlPath: string): string | null {
  const name = basename(urlPath)
  if (!FILE_RE.test(name)) return null
  const full = absolutePath(name)
  return existsSync(full) ? full : null
}

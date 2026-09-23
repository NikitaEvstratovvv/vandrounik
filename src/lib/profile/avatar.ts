export type AvatarPresetId =
  | 'stork'
  | 'fox'
  | 'bison'
  | 'frog'
  | 'snake'
  | 'beaver'
  | 'mouse'

/** Stored / API avatar. Custom photos are URLs under `/media/avatars/…`. */
export type ProfileAvatar =
  | { kind: 'preset'; id: AvatarPresetId }
  | { kind: 'custom'; url: string }

/** Local draft before save may still hold a JPEG data URL for preview. */
export type AvatarDraft =
  | ProfileAvatar
  | { kind: 'custom'; dataUrl: string }

export const AVATAR_PRESETS: { id: AvatarPresetId; src: string; label: string }[] = [
  { id: 'stork', src: '/figma/avatars/stork.png', label: 'Аист' },
  { id: 'fox', src: '/figma/avatars/fox.png', label: 'Лиса' },
  { id: 'bison', src: '/figma/avatars/bison.png', label: 'Зубр' },
  { id: 'frog', src: '/figma/avatars/frog.png', label: 'Лягушка' },
  { id: 'snake', src: '/figma/avatars/snake.png', label: 'Змея' },
  { id: 'beaver', src: '/figma/avatars/beaver.png', label: 'Бобёр' },
  { id: 'mouse', src: '/figma/avatars/mouse.png', label: 'Мышь' },
]

export const DEFAULT_AVATAR: ProfileAvatar = { kind: 'preset', id: 'stork' }

export function avatarSrc(avatar: ProfileAvatar | AvatarDraft | undefined | null): string {
  if (!avatar) return '/figma/avatars/stork.png'
  if (avatar.kind === 'custom') {
    if ('url' in avatar && typeof avatar.url === 'string') return avatar.url
    if ('dataUrl' in avatar && typeof avatar.dataUrl === 'string') return avatar.dataUrl
    return '/figma/avatars/stork.png'
  }
  const preset = AVATAR_PRESETS.find((p) => p.id === avatar.id)
  return preset?.src ?? '/figma/avatars/stork.png'
}

export function avatarsEqual(a: AvatarDraft, b: AvatarDraft): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'preset' && b.kind === 'preset') return a.id === b.id
  if (a.kind === 'custom' && b.kind === 'custom') {
    const aUrl = 'url' in a ? a.url : undefined
    const bUrl = 'url' in b ? b.url : undefined
    const aData = 'dataUrl' in a ? a.dataUrl : undefined
    const bData = 'dataUrl' in b ? b.dataUrl : undefined
    if (aUrl && bUrl) return aUrl === bUrl
    if (aData && bData) return aData === bData
    return false
  }
  return false
}

/** Normalize legacy session/API payloads that still used dataUrl. */
export function normalizeProfileAvatar(raw: unknown): ProfileAvatar {
  if (!raw || typeof raw !== 'object') return DEFAULT_AVATAR
  const v = raw as { kind?: unknown; id?: unknown; url?: unknown; dataUrl?: unknown }
  if (v.kind === 'preset' && typeof v.id === 'string') {
    const id = v.id as AvatarPresetId
    if (AVATAR_PRESETS.some((p) => p.id === id)) return { kind: 'preset', id }
  }
  if (v.kind === 'custom' && typeof v.url === 'string' && v.url.startsWith('/media/avatars/')) {
    return { kind: 'custom', url: v.url }
  }
  // Stale local dataUrl cannot be shown after refresh without API migrate — fall back.
  return DEFAULT_AVATAR
}

/** Сжать изображение до maxPx JPEG data URL для превью и загрузки. */
export function resizeImageFile(file: File, maxPx = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load'))
    }
    img.src = url
  })
}

export function defaultDisplayName(email: string, username?: string): string {
  if (username?.trim()) return username.trim()
  const local = email.split('@')[0] || 'user'
  return local
}

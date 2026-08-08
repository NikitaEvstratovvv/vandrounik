export type AvatarPresetId =
  | 'stork'
  | 'fox'
  | 'bison'
  | 'frog'
  | 'snake'
  | 'beaver'
  | 'mouse'

export type ProfileAvatar =
  | { kind: 'preset'; id: AvatarPresetId }
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

export function avatarSrc(avatar: ProfileAvatar | undefined | null): string {
  if (!avatar) return '/figma/avatars/stork.png'
  if (avatar.kind === 'custom') return avatar.dataUrl
  const preset = AVATAR_PRESETS.find((p) => p.id === avatar.id)
  return preset?.src ?? '/figma/avatars/stork.png'
}

export function avatarsEqual(a: ProfileAvatar, b: ProfileAvatar): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'preset' && b.kind === 'preset') return a.id === b.id
  if (a.kind === 'custom' && b.kind === 'custom') return a.dataUrl === b.dataUrl
  return false
}

/** Сжать изображение до maxPx JPEG data URL для localStorage. */
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

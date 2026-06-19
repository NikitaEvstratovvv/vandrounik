import { ensureMinRouteVariants } from '@/lib/routing/generateMockRoutes'
import type { GenerationResult } from '@/types'

const STORAGE_KEY = 'vandrounik.generation.v2'
const LEGACY_STORAGE_KEY = 'vandrounik.generation.v1'

export function saveGeneration(result: GenerationResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // localStorage недоступен — игнорируем.
  }
}

export function loadGeneration(): GenerationResult | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as GenerationResult
    const normalized = ensureMinRouteVariants(parsed)

    if (normalized.variants.length !== parsed.variants.length || raw !== localStorage.getItem(STORAGE_KEY)) {
      saveGeneration(normalized)
    }

    return normalized
  } catch {
    return null
  }
}

export function clearGeneration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // ignore
  }
}

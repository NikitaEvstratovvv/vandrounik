import { hasGenerationCoordinates, MIN_ROUTE_VARIANTS } from '@/lib/routing/generateRoutes'
import type { GenerationResult } from '@/types'

const STORAGE_KEY = 'vandrounik.generation.v3'
const LEGACY_STORAGE_KEYS = ['vandrounik.generation.v2', 'vandrounik.generation.v1'] as const

function isUsableGeneration(result: GenerationResult): boolean {
  return hasGenerationCoordinates(result) && result.variants.length >= MIN_ROUTE_VARIANTS
}

export function saveGeneration(result: GenerationResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // localStorage недоступен — игнорируем.
  }
}

export function loadGeneration(): GenerationResult | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean)
    if (!raw) return null

    const parsed = JSON.parse(raw) as GenerationResult
    if (!isUsableGeneration(parsed)) {
      clearGeneration()
      return null
    }

    if (raw !== localStorage.getItem(STORAGE_KEY)) {
      saveGeneration(parsed)
    }

    return parsed
  } catch {
    return null
  }
}

export function clearGeneration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

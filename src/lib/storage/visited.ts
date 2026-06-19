const STORAGE_KEY = 'vandrounik.visited-places.v1'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage недоступен — игнорируем.
  }
}

export function loadVisitedPlaceIds(): Set<string> {
  return new Set(readIds())
}

export function isPlaceVisited(placeId: string): boolean {
  return loadVisitedPlaceIds().has(placeId)
}

/** Переключает отметку «был здесь»; возвращает новое состояние. */
export function toggleVisitedPlace(placeId: string): boolean {
  const ids = new Set(readIds())
  if (ids.has(placeId)) {
    ids.delete(placeId)
    writeIds([...ids])
    return false
  }
  ids.add(placeId)
  writeIds([...ids])
  return true
}

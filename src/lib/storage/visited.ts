import { apiFetch, getAccessToken } from '@/lib/api/client'

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
    // ignore
  }
}

function useRemote(): boolean {
  return Boolean(getAccessToken())
}

/** Local-only read (for import). */
export function loadVisitedPlaceIdsLocal(): Set<string> {
  return new Set(readIds())
}

export function loadVisitedPlaceIds(): Set<string> {
  return new Set(readIds())
}

export async function refreshVisited(): Promise<Set<string>> {
  if (!useRemote()) return loadVisitedPlaceIds()
  const data = await apiFetch<{ placeIds: string[] }>('/visited')
  writeIds(data.placeIds)
  return new Set(data.placeIds)
}

export async function replaceVisitedRemote(placeIds: string[]): Promise<Set<string>> {
  const data = await apiFetch<{ placeIds: string[] }>('/visited', {
    method: 'PUT',
    body: JSON.stringify({ placeIds }),
  })
  writeIds(data.placeIds)
  return new Set(data.placeIds)
}

export function isPlaceVisited(placeId: string): boolean {
  return loadVisitedPlaceIds().has(placeId)
}

export async function markPlaceVisited(placeId: string): Promise<void> {
  if (useRemote()) {
    const data = await apiFetch<{ placeIds: string[] }>(`/visited/${encodeURIComponent(placeId)}`, {
      method: 'POST',
    })
    writeIds(data.placeIds)
    return
  }
  const ids = new Set(readIds())
  if (ids.has(placeId)) return
  ids.add(placeId)
  writeIds([...ids])
}

export async function toggleVisitedPlace(placeId: string): Promise<boolean> {
  const ids = new Set(readIds())
  const currently = ids.has(placeId)

  if (useRemote()) {
    const data = currently
      ? await apiFetch<{ placeIds: string[] }>(`/visited/${encodeURIComponent(placeId)}`, {
          method: 'DELETE',
        })
      : await apiFetch<{ placeIds: string[] }>(`/visited/${encodeURIComponent(placeId)}`, {
          method: 'POST',
        })
    writeIds(data.placeIds)
    return data.placeIds.includes(placeId)
  }

  if (currently) {
    ids.delete(placeId)
    writeIds([...ids])
    return false
  }
  ids.add(placeId)
  writeIds([...ids])
  return true
}

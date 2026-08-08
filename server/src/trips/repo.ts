import { randomUUID } from 'node:crypto'
import { getDb } from '../db.js'
import { ApiError } from '../errors.js'

export type TripStatus = 'new' | 'in-progress' | 'completed'

export type Trip = {
  id: string
  status: TripStatus
  visitedPlaceIds: string[]
  variant: unknown
  params: unknown
  savedAt: string
  updatedAt: string
}

type TripRow = {
  id: string
  user_id: string
  status: TripStatus
  visited_place_ids_json: string
  variant_json: string
  params_json: string | null
  saved_at: string
  updated_at: string
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function slimVariant(variant: Record<string, unknown>): Record<string, unknown> {
  const { geometry: _geometry, ...rest } = variant
  return rest
}

function rowToTrip(row: TripRow): Trip {
  let visitedPlaceIds: string[] = []
  try {
    const parsed = JSON.parse(row.visited_place_ids_json) as unknown
    if (Array.isArray(parsed)) {
      visitedPlaceIds = parsed.filter((id): id is string => typeof id === 'string')
    }
  } catch {
    visitedPlaceIds = []
  }
  return {
    id: row.id,
    status: row.status,
    visitedPlaceIds,
    variant: JSON.parse(row.variant_json) as unknown,
    params: row.params_json ? (JSON.parse(row.params_json) as unknown) : null,
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
  }
}

export function listTrips(userId: string): Trip[] {
  const rows = getDb()
    .prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY saved_at DESC')
    .all(userId) as TripRow[]
  return rows.map(rowToTrip)
}

export function getTrip(userId: string, id: string): Trip | null {
  const row = getDb()
    .prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?')
    .get(id, userId) as TripRow | undefined
  return row ? rowToTrip(row) : null
}

export function createTrip(
  userId: string,
  input: { variant: unknown; params?: unknown; id?: string; status?: TripStatus; visitedPlaceIds?: string[]; savedAt?: string },
): Trip {
  if (!input.variant || typeof input.variant !== 'object') {
    throw new ApiError(400, 'validation_error', 'Нужен variant')
  }
  const now = new Date().toISOString()
  const id =
    typeof input.id === 'string' && UUID_RE.test(input.id) ? input.id : randomUUID()
  const status: TripStatus = input.status ?? 'new'
  const visitedPlaceIds = Array.isArray(input.visitedPlaceIds)
    ? input.visitedPlaceIds.filter((x): x is string => typeof x === 'string')
    : []
  const savedAt = typeof input.savedAt === 'string' ? input.savedAt : now
  const variant = slimVariant(input.variant as Record<string, unknown>)

  getDb()
    .prepare(
      `INSERT INTO trips (id, user_id, status, visited_place_ids_json, variant_json, params_json, saved_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      userId,
      status,
      JSON.stringify(visitedPlaceIds),
      JSON.stringify(variant),
      input.params == null ? null : JSON.stringify(input.params),
      savedAt,
      now,
    )

  for (const placeId of visitedPlaceIds) {
    addVisited(userId, placeId)
  }

  return getTrip(userId, id)!
}

export function updateTrip(
  userId: string,
  id: string,
  patch: { status?: TripStatus; visitedPlaceIds?: string[] },
): Trip {
  const current = getTrip(userId, id)
  if (!current) throw new ApiError(404, 'not_found', 'Поездка не найдена')
  if (patch.status === undefined && patch.visitedPlaceIds === undefined) {
    throw new ApiError(400, 'validation_error', 'Нечего обновлять')
  }

  const status = patch.status ?? current.status
  const visitedPlaceIds = patch.visitedPlaceIds ?? current.visitedPlaceIds
  const updatedAt = new Date().toISOString()

  getDb()
    .prepare(
      `UPDATE trips SET status = ?, visited_place_ids_json = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(status, JSON.stringify(visitedPlaceIds), updatedAt, id, userId)

  if (patch.visitedPlaceIds) {
    const prev = new Set(current.visitedPlaceIds)
    for (const placeId of visitedPlaceIds) {
      if (!prev.has(placeId)) addVisited(userId, placeId)
    }
  }

  return getTrip(userId, id)!
}

export function deleteTrip(userId: string, id: string): boolean {
  const result = getDb().prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').run(id, userId)
  return result.changes > 0
}

export function listVisited(userId: string): string[] {
  const rows = getDb()
    .prepare('SELECT place_id FROM visited_places WHERE user_id = ? ORDER BY place_id')
    .all(userId) as { place_id: string }[]
  return rows.map((r) => r.place_id)
}

export function addVisited(userId: string, placeId: string): string[] {
  getDb()
    .prepare(
      `INSERT INTO visited_places (user_id, place_id) VALUES (?, ?)
       ON CONFLICT(user_id, place_id) DO NOTHING`,
    )
    .run(userId, placeId)
  return listVisited(userId)
}

export function removeVisited(userId: string, placeId: string): string[] {
  getDb().prepare('DELETE FROM visited_places WHERE user_id = ? AND place_id = ?').run(userId, placeId)
  return listVisited(userId)
}

export function replaceVisited(userId: string, placeIds: string[]): string[] {
  const db = getDb()
  const tx = db.transaction((ids: string[]) => {
    db.prepare('DELETE FROM visited_places WHERE user_id = ?').run(userId)
    const insert = db.prepare(
      'INSERT INTO visited_places (user_id, place_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
    )
    for (const id of ids) {
      if (typeof id === 'string' && id) insert.run(userId, id)
    }
  })
  tx(placeIds)
  return listVisited(userId)
}

export function importTrips(
  userId: string,
  trips: Array<{
    id?: string
    status?: TripStatus
    visitedPlaceIds?: string[]
    variant: unknown
    params?: unknown
    savedAt?: string
  }>,
): Trip[] {
  for (const item of trips) {
    if (!item?.variant) continue
    const id = typeof item.id === 'string' ? item.id : undefined
    if (id) {
      const existing = getTrip(userId, id)
      if (existing) {
        // keep newer server copy
        const incomingSaved = item.savedAt ? Date.parse(item.savedAt) : 0
        const serverSaved = Date.parse(existing.updatedAt || existing.savedAt)
        if (!Number.isNaN(incomingSaved) && incomingSaved > serverSaved) {
          updateTrip(userId, id, {
            status: item.status,
            visitedPlaceIds: item.visitedPlaceIds,
          })
          // variant not overwritten in v1 import update — status/visited only if newer
        }
        continue
      }
    }
    createTrip(userId, {
      id,
      variant: item.variant,
      params: item.params ?? null,
      status: item.status,
      visitedPlaceIds: item.visitedPlaceIds,
      savedAt: item.savedAt,
    })
  }
  return listTrips(userId)
}

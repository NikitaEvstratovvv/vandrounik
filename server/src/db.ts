import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from './env.js'

export type UserRow = {
  id: string
  email: string
  username: string
  display_name: string
  avatar_json: string
  provider: 'email' | 'google'
  created_at: string
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db
  mkdirSync(dirname(env.databasePath), { recursive: true })
  db = new Database(env.databasePath)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_json TEXT NOT NULL,
      provider TEXT NOT NULL CHECK (provider IN ('email', 'google')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_challenges (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      revoked_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('new', 'in-progress', 'completed')),
      visited_place_ids_json TEXT NOT NULL DEFAULT '[]',
      variant_json TEXT NOT NULL,
      params_json TEXT,
      saved_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_trips_user_saved ON trips(user_id, saved_at DESC);

    CREATE TABLE IF NOT EXISTS visited_places (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_id TEXT NOT NULL,
      PRIMARY KEY (user_id, place_id)
    );
  `)
  return db
}

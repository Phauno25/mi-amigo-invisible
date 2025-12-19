import Database from "better-sqlite3"
import path from "path"

const dbPath = path.join(process.cwd(), "amigo-invisible.db")

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")

    // Initialize tables if they don't exist
    db.exec(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT,
        is_super_admin BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Games table (sorteos)
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Game participants table
      CREATE TABLE IF NOT EXISTS game_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        access_code TEXT NOT NULL,
        assigned_to_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to_id) REFERENCES game_participants(id) ON DELETE SET NULL,
        UNIQUE(game_id, name),
        UNIQUE(game_id, slug)
      );

      -- Legacy tables for backward compatibility
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        access_code TEXT NOT NULL,
        assigned_to_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to_id) REFERENCES participants(id)
      );

      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        is_active BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO game_state (id, is_active) VALUES (1, FALSE);
    `)
  }
  return db
}

// New interfaces for multi-user support
export interface User {
  id: number
  username: string
  password_hash: string
  email: string | null
  is_super_admin: boolean
  created_at: string
  updated_at: string
}

export interface Game {
  id: number
  user_id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GameParticipant {
  id: number
  game_id: number
  name: string
  slug: string
  access_code: string
  assigned_to_id: number | null
  created_at: string
}

// Legacy interfaces (kept for backward compatibility)
export interface Participant {
  id: number
  name: string
  slug: string
  access_code: string
  assigned_to_id: number | null
  created_at: string
}

export interface GameState {
  id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

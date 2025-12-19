-- Migration: Add multi-user support
-- This migration adds users table and games table to support multiple users
-- each managing their own secret santa games

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create games table (sorteos)
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

-- Create new game_participants table (replaces participants)
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

-- Migrate existing data if participants table exists and has data
-- This assumes we're migrating from the old single-admin structure
-- We'll create a default admin user and a default game

-- Create default super admin user (you should change the password!)
INSERT OR IGNORE INTO users (id, username, password_hash, is_super_admin) 
VALUES (1, 'admin', '$2a$10$placeholder', TRUE);

-- Create default game for existing participants
INSERT OR IGNORE INTO games (id, user_id, name, description, is_active)
SELECT 1, 1, 'Sorteo Principal', 'Juego migrado del sistema anterior', is_active
FROM game_state WHERE id = 1;

-- Migrate existing participants to game_participants
INSERT INTO game_participants (game_id, name, slug, access_code, assigned_to_id)
SELECT 1, name, slug, access_code, assigned_to_id
FROM participants
WHERE NOT EXISTS (SELECT 1 FROM game_participants WHERE game_id = 1);

-- Drop old tables (optional - comment out if you want to keep backup)
-- DROP TABLE IF EXISTS participants;
-- DROP TABLE IF EXISTS game_state;

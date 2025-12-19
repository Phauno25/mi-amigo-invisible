import Database from "better-sqlite3"
import bcrypt from "bcryptjs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbName = process.env.DB_NAME || "amigo-invisible.db"
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", dbName)

async function initializeDatabase() {
  console.log("🔧 Inicializando base de datos...")

  const db = new Database(dbPath)
  db.pragma("journal_mode = WAL")

  // Create tables first
  console.log("📦 Creando tablas...")
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

  // Get credentials from environment variables
  const adminUsername = process.env.ADMIN_USER || "admin"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

  // Check if users table exists and has data
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get()

  if (userCount.count === 0) {
    console.log("👤 Creando usuario super admin desde variables de entorno...")

    // Create super admin with credentials from .env
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    db.prepare(
      "INSERT INTO users (username, password_hash, email, is_super_admin) VALUES (?, ?, ?, TRUE)"
    ).run(adminUsername, passwordHash, "admin@example.com")

    console.log("✅ Super admin creado exitosamente")
    console.log("📝 Credenciales configuradas desde .env:")
    console.log(`   Usuario: ${adminUsername}`)
    console.log(`   Contraseña: ${adminPassword}`)
    console.log("")
    console.log("⚠️  IMPORTANTE: Cambia estas credenciales en producción!")
  } else {
    console.log("✅ Base de datos ya tiene usuarios configurados")
  }

  db.close()
  console.log("✨ Inicialización completada")
}

initializeDatabase().catch((error) => {
  console.error("❌ Error al inicializar la base de datos:", error)
  process.exit(1)
})

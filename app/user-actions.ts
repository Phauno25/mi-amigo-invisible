"use server"

import { revalidatePath } from "next/cache"
import { getDb, type User, type Game } from "@/lib/db"
import { hashPassword, createUserSession, getCurrentUser, isSuperAdmin } from "@/lib/auth"

// ============================================
// USER MANAGEMENT ACTIONS (Super Admin only)
// ============================================

export async function createUserAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const email = formData.get("email") as string

  // Verify super admin
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return { success: false, error: "No tienes permisos para crear usuarios" }
  }

  if (!username || !password || username.trim().length === 0 || password.length < 6) {
    return { success: false, error: "Usuario y contraseña (mínimo 6 caracteres) son requeridos" }
  }

  const db = getDb()
  const passwordHash = await hashPassword(password)

  try {
    db.prepare("INSERT INTO users (username, password_hash, email, is_super_admin) VALUES (?, ?, ?, FALSE)").run(
      username.trim(),
      passwordHash,
      email.trim() || null,
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return { success: false, error: "Ya existe un usuario con ese nombre" }
    }
    return { success: false, error: "Error al crear usuario" }
  }
}

export async function deleteUserAction(userId: number) {
  // Verify super admin
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return { success: false, error: "No tienes permisos para eliminar usuarios" }
  }

  const db = getDb()

  try {
    // This will cascade delete all games and participants
    db.prepare("DELETE FROM users WHERE id = ? AND is_super_admin = FALSE").run(userId)

    revalidatePath("/admin/users")
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar usuario" }
  }
}

export async function listUsersAction() {
  // Verify super admin
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return { success: false, error: "No tienes permisos", users: [] }
  }

  const db = getDb()
  const users = db.prepare("SELECT id, username, email, is_super_admin, created_at FROM users ORDER BY created_at DESC").all() as User[]

  return { success: true, users }
}

// ============================================
// GAME MANAGEMENT ACTIONS (Per User)
// ============================================

export async function createGameAction(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  if (!name || name.trim().length === 0) {
    return { success: false, error: "El nombre del sorteo es requerido" }
  }

  const db = getDb()

  try {
    const result = db
      .prepare("INSERT INTO games (user_id, name, description) VALUES (?, ?, ?)")
      .run(user.id, name.trim(), description?.trim() || null)

    revalidatePath("/admin")
    return { success: true, gameId: result.lastInsertRowid }
  } catch {
    return { success: false, error: "Error al crear sorteo" }
  }
}

export async function deleteGameAction(gameId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  const db = getDb()

  try {
    // Verify ownership
    const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id)
    if (!game) {
      return { success: false, error: "Sorteo no encontrado o no tienes permiso" }
    }

    // Delete will cascade to participants
    db.prepare("DELETE FROM games WHERE id = ?").run(gameId)

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar sorteo" }
  }
}

export async function listGamesAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado", games: [] }
  }

  const db = getDb()
  const games = db
    .prepare(
      `
    SELECT 
      g.*,
      COUNT(gp.id) as participant_count
    FROM games g
    LEFT JOIN game_participants gp ON g.id = gp.game_id
    WHERE g.user_id = ?
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `,
    )
    .all(user.id) as (Game & { participant_count: number })[]

  return { success: true, games }
}

export async function getGameDetailsAction(gameId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado", game: null }
  }

  const db = getDb()
  const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id) as Game | undefined

  if (!game) {
    return { success: false, error: "Sorteo no encontrado", game: null }
  }

  return { success: true, game }
}

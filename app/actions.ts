"use server"

import { revalidatePath } from "next/cache"
import { verifyAdminCredentials, createAdminSession, destroyAdminSession, verifyUserCredentials, createUserSession, destroySession, getCurrentUser } from "@/lib/auth"
import { getDb, type Participant, type GameParticipant, type User } from "@/lib/db"

// ============================================
// AUTHENTICATION ACTIONS
// ============================================

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // First try to authenticate as a database user
  const user = await verifyUserCredentials(username, password)
  
  if (user) {
    await createUserSession(user.id, user.is_super_admin)
    return { success: true, isSuperAdmin: user.is_super_admin }
  }

  // If not found in DB, check if it's super admin from env variables (legacy)
  const isSuperAdminEnv = await verifyAdminCredentials(username, password)
  
  if (isSuperAdminEnv) {
    // Find or create super admin user in database
    const db = getDb()
    let adminUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined
    
    if (!adminUser) {
      // Create super admin user if doesn't exist
      const { hashPassword } = await import("@/lib/auth")
      const passwordHash = await hashPassword(password)
      const result = db.prepare(
        "INSERT INTO users (username, password_hash, is_super_admin) VALUES (?, ?, TRUE)"
      ).run(username, passwordHash)
      adminUser = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as User
    }
    
    if (adminUser) {
      await createUserSession(adminUser.id, true)
      return { success: true, isSuperAdmin: true }
    }
  }

  return { success: false, error: "Credenciales inválidas" }
}

export async function logoutAction() {
  await destroySession()
  revalidatePath("/")
  return { success: true }
}

// ============================================
// GAME PARTICIPANT ACTIONS (New multi-game support)
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function generateAccessCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function addParticipantToGameAction(gameId: number, formData: FormData) {
  const name = formData.get("name") as string

  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  if (!name || name.trim().length === 0) {
    return { success: false, error: "El nombre es requerido" }
  }

  const db = getDb()

  // Verify game ownership
  const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id)
  if (!game) {
    return { success: false, error: "Sorteo no encontrado o sin permisos" }
  }

  const slug = generateSlug(name.trim())
  const accessCode = generateAccessCode()

  try {
    db.prepare("INSERT INTO game_participants (game_id, name, slug, access_code) VALUES (?, ?, ?, ?)").run(
      gameId,
      name.trim(),
      slug,
      accessCode,
    )

    revalidatePath("/admin")
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return { success: false, error: "Ya existe un participante con ese nombre en este sorteo" }
    }
    return { success: false, error: "Error al agregar participante" }
  }
}

export async function removeParticipantFromGameAction(gameId: number, participantId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  const db = getDb()

  // Verify game ownership
  const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id)
  if (!game) {
    return { success: false, error: "Sorteo no encontrado o sin permisos" }
  }

  try {
    // First, clear any assignments pointing to this participant
    db.prepare("UPDATE game_participants SET assigned_to_id = NULL WHERE assigned_to_id = ? AND game_id = ?").run(
      participantId,
      gameId,
    )
    // Then delete the participant
    db.prepare("DELETE FROM game_participants WHERE id = ? AND game_id = ?").run(participantId, gameId)

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar participante" }
  }
}

export async function assignSecretSantaForGameAction(gameId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  const db = getDb()

  // Verify game ownership
  const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id)
  if (!game) {
    return { success: false, error: "Sorteo no encontrado o sin permisos" }
  }

  const participants = db.prepare("SELECT * FROM game_participants WHERE game_id = ?").all(gameId) as GameParticipant[]

  if (participants.length < 2) {
    return { success: false, error: "Se necesitan al menos 2 participantes" }
  }

  // Fisher-Yates shuffle for derangement (no one gets themselves)
  const shuffled = [...participants]
  let valid = false
  let attempts = 0
  const maxAttempts = 1000

  while (!valid && attempts < maxAttempts) {
    // Shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Check if it's a valid derangement (no one assigned to themselves)
    valid = participants.every((p, i) => p.id !== shuffled[i].id)
    attempts++
  }

  if (!valid) {
    return { success: false, error: "No se pudo generar un sorteo válido. Intenta de nuevo." }
  }

  // Update assignments in database
  const updateStmt = db.prepare("UPDATE game_participants SET assigned_to_id = ? WHERE id = ?")
  const transaction = db.transaction(() => {
    participants.forEach((participant, index) => {
      updateStmt.run(shuffled[index].id, participant.id)
    })
    db.prepare("UPDATE games SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gameId)
  })

  try {
    transaction()
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al guardar las asignaciones" }
  }
}

export async function resetGameAssignmentsAction(gameId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  const db = getDb()

  // Verify game ownership
  const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id)
  if (!game) {
    return { success: false, error: "Sorteo no encontrado o sin permisos" }
  }

  try {
    db.prepare("UPDATE game_participants SET assigned_to_id = NULL WHERE game_id = ?").run(gameId)
    db.prepare("UPDATE games SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gameId)

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al reiniciar el juego" }
  }
}

export async function clearAllParticipantsFromGameAction(gameId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "Debes estar autenticado" }
  }

  const db = getDb()

  // Verify game ownership
  const game = db.prepare("SELECT * FROM games WHERE id = ? AND user_id = ?").get(gameId, user.id)
  if (!game) {
    return { success: false, error: "Sorteo no encontrado o sin permisos" }
  }

  try {
    db.prepare("DELETE FROM game_participants WHERE game_id = ?").run(gameId)
    db.prepare("UPDATE games SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gameId)

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al limpiar participantes" }
  }
}

export async function verifyParticipantAccessForGame(gameId: number, slug: string, code: string) {
  const db = getDb()

  const participant = db
    .prepare("SELECT * FROM game_participants WHERE game_id = ? AND slug = ?")
    .get(gameId, slug) as GameParticipant | undefined

  if (!participant) {
    return { success: false, error: "Participante no encontrado" }
  }

  const providedCode = code.split(":")[1] || code

  if (providedCode !== participant.access_code) {
    return { success: false, error: "Código de acceso inválido" }
  }

  if (!participant.assigned_to_id) {
    return { success: false, error: "El sorteo aún no se ha realizado" }
  }

  const assignedTo = db
    .prepare("SELECT name FROM game_participants WHERE id = ?")
    .get(participant.assigned_to_id) as { name: string } | undefined

  if (!assignedTo) {
    return { success: false, error: "Error al obtener asignación" }
  }

  return {
    success: true,
    assignedTo: assignedTo.name,
    participantName: participant.name,
  }
}

// ============================================
// LEGACY ACTIONS (For backward compatibility)
// ============================================

export async function addParticipantAction(formData: FormData) {
  const name = formData.get("name") as string

  if (!name || name.trim().length === 0) {
    return { success: false, error: "El nombre es requerido" }
  }

  const db = getDb()
  const slug = generateSlug(name.trim())
  const accessCode = generateAccessCode()

  try {
    db.prepare("INSERT INTO participants (name, slug, access_code) VALUES (?, ?, ?)").run(name.trim(), slug, accessCode)

    revalidatePath("/admin")
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return { success: false, error: "Ya existe un participante con ese nombre" }
    }
    return { success: false, error: "Error al agregar participante" }
  }
}

export async function removeParticipantAction(id: number) {
  const db = getDb()

  try {
    db.prepare("UPDATE participants SET assigned_to_id = NULL WHERE assigned_to_id = ?").run(id)
    db.prepare("DELETE FROM participants WHERE id = ?").run(id)

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al eliminar participante" }
  }
}

export async function assignSecretSantaAction() {
  const db = getDb()

  const participants = db.prepare("SELECT * FROM participants").all() as Participant[]

  if (participants.length < 2) {
    return { success: false, error: "Se necesitan al menos 2 participantes" }
  }

  const shuffled = [...participants]
  let valid = false
  let attempts = 0
  const maxAttempts = 1000

  while (!valid && attempts < maxAttempts) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    valid = participants.every((p, i) => p.id !== shuffled[i].id)
    attempts++
  }

  if (!valid) {
    return { success: false, error: "No se pudo generar un sorteo válido. Intenta de nuevo." }
  }

  const updateStmt = db.prepare("UPDATE participants SET assigned_to_id = ? WHERE id = ?")
  const transaction = db.transaction(() => {
    participants.forEach((participant, index) => {
      updateStmt.run(shuffled[index].id, participant.id)
    })
    db.prepare("UPDATE game_state SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = 1").run()
  })

  try {
    transaction()
    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al guardar las asignaciones" }
  }
}

export async function resetGameAction() {
  const db = getDb()

  try {
    db.prepare("UPDATE participants SET assigned_to_id = NULL").run()
    db.prepare("UPDATE game_state SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = 1").run()

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al reiniciar el juego" }
  }
}

export async function clearAllParticipantsAction() {
  const db = getDb()

  try {
    db.prepare("DELETE FROM participants").run()
    db.prepare("UPDATE game_state SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = 1").run()

    revalidatePath("/admin")
    return { success: true }
  } catch {
    return { success: false, error: "Error al limpiar participantes" }
  }
}

export async function verifyParticipantAccess(slug: string, code: string) {
  const db = getDb()

  const participant = db.prepare("SELECT * FROM participants WHERE slug = ?").get(slug) as Participant | undefined

  if (!participant) {
    return { success: false, error: "Participante no encontrado" }
  }

  const providedCode = code.split(":")[1] || code

  if (providedCode !== participant.access_code) {
    return { success: false, error: "Código de acceso inválido" }
  }

  if (!participant.assigned_to_id) {
    return { success: false, error: "El sorteo aún no se ha realizado" }
  }

  const assignedTo = db.prepare("SELECT name FROM participants WHERE id = ?").get(participant.assigned_to_id) as
    | { name: string }
    | undefined

  if (!assignedTo) {
    return { success: false, error: "Error al obtener asignación" }
  }

  return {
    success: true,
    assignedTo: assignedTo.name,
    participantName: participant.name,
  }
}

import { cookies } from "next/headers"
import { getDb, type User } from "./db"
import bcrypt from "bcryptjs"

const SESSION_COOKIE = "user_session"
const USER_ID_COOKIE = "user_id"

// Super admin authentication (for backward compatibility and super admin features)
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const adminUser = process.env.ADMIN_USER || "admin"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

  return username === adminUser && password === adminPassword
}

// User authentication (for regular users)
export async function verifyUserCredentials(username: string, password: string): Promise<User | null> {
  const db = getDb()
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined

  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password_hash)
  return isValid ? user : null
}

export async function createUserSession(userId: number, isSuperAdmin: boolean = false): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = crypto.randomUUID()

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  cookieStore.set(USER_ID_COOKIE, userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

// Legacy function for backward compatibility
export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = crypto.randomUUID()

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  const userIdCookie = cookieStore.get(USER_ID_COOKIE)

  if (!session?.value || !userIdCookie?.value) {
    return null
  }

  const db = getDb()
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number.parseInt(userIdCookie.value)) as
    | User
    | undefined

  return user || null
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return !!session?.value
}

// Legacy function for backward compatibility
export async function isAdminAuthenticated(): Promise<boolean> {
  return isAuthenticated()
}

export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  // SQLite stores boolean as 0 or 1, so we need to check for both true and 1
  return Boolean(user?.is_super_admin)
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(USER_ID_COOKIE)
}

// Legacy function for backward compatibility
export async function destroyAdminSession(): Promise<void> {
  await destroySession()
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

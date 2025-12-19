import { redirect } from "next/navigation"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { getDb, type Game, type GameParticipant } from "@/lib/db"
import { MultiGameDashboard } from "@/components/multi-game-dashboard"
import { Snowflakes } from "@/components/snowflakes"

export default async function AdminPage() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect("/")
  }

  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/")
  }

  const db = getDb()

  // Get all games for the current user
  const games = db
    .prepare("SELECT * FROM games WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id) as Game[]

  // Get participants for each game
  const gamesWithParticipants = games.map((game) => {
    const participants = db
      .prepare("SELECT * FROM game_participants WHERE game_id = ? ORDER BY created_at ASC")
      .all(game.id) as GameParticipant[]

    return {
      ...game,
      participants,
    }
  })

  return (
    <main className="min-h-screen bg-christmas-gradient relative overflow-hidden">
      <Snowflakes />
      <div className="relative z-10">
        <MultiGameDashboard 
          games={gamesWithParticipants} 
          isSuperAdmin={user.is_super_admin}
          username={user.username}
        />
      </div>
    </main>
  )
}

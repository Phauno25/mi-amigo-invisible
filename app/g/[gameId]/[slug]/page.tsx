import { notFound } from "next/navigation"
import { getDb, type Game } from "@/lib/db"
import { GameParticipantReveal } from "@/components/game-participant-reveal"
import { Snowflakes } from "@/components/snowflakes"

interface GameParticipantPageProps {
  params: Promise<{
    gameId: string
    slug: string
  }>
}

export default async function GameParticipantPage({ params }: GameParticipantPageProps) {
  const { gameId, slug } = await params
  const db = getDb()

  // Verify game exists
  const game = db.prepare("SELECT * FROM games WHERE id = ?").get(Number.parseInt(gameId)) as Game | undefined

  if (!game) {
    notFound()
  }

  // Verify participant exists in this game
  const participant = db
    .prepare("SELECT * FROM game_participants WHERE game_id = ? AND slug = ?")
    .get(Number.parseInt(gameId), slug)

  if (!participant) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-christmas-gradient relative overflow-hidden">
      <Snowflakes />
      <div className="relative z-10">
        <GameParticipantReveal slug={slug} gameId={Number.parseInt(gameId)} gameName={game.name} />
      </div>
    </main>
  )
}

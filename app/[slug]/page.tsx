import { getDb, type Participant, type GameState } from "@/lib/db"
import { notFound } from "next/navigation"
import { ParticipantReveal } from "@/components/participant-reveal"
import { Snowflakes } from "@/components/snowflakes"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ParticipantPage({ params }: PageProps) {
  const { slug } = await params
  const db = getDb()

  const participant = db.prepare("SELECT * FROM participants WHERE slug = ?").get(slug) as Participant | undefined

  if (!participant) {
    notFound()
  }

  const gameState = db.prepare("SELECT * FROM game_state WHERE id = 1").get() as GameState

  return (
    <main className="min-h-screen bg-christmas-gradient relative overflow-hidden">
      <Snowflakes />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <ParticipantReveal participant={participant} isGameActive={gameState?.is_active || false} />
      </div>
    </main>
  )
}

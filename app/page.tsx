import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { Snowflakes } from "@/components/snowflakes"
import { Gift, TreePine } from "lucide-react"

export default async function HomePage() {
  const isAuthenticated = await isAdminAuthenticated()

  if (isAuthenticated) {
    redirect("/admin")
  }

  return (
    <main className="min-h-screen bg-christmas-gradient relative overflow-hidden">
      <Snowflakes />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TreePine className="w-10 h-10 text-christmas-green" />
            <Gift className="w-12 h-12 text-christmas-red animate-bounce" />
            <TreePine className="w-10 h-10 text-christmas-green" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 text-balance">Amigo Invisible</h1>
          <p className="text-foreground text-lg">El sorteo navideño más divertido</p>
        </div>

        {/* Login Card */}
        <LoginForm />

        {/* Footer decoration */}
        <div className="mt-8 flex items-center gap-2 text-christmas-cream/60 text-sm">
          <span>🎄</span>
          <span>Creado por Pablo Coronel</span>
          <span>🎄</span>
        </div>
      </div>
    </main>
  )
}

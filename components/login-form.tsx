"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Loader2 } from "lucide-react"
import { loginAction } from "@/app/actions"

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await loginAction(formData)

    if (result.success) {
      router.push("/admin")
    } else {
      setError(result.error || "Error al iniciar sesión")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md bg-christmas-cream/95 border-christmas-gold border-2 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-christmas-dark">Panel de Administración</CardTitle>
        <CardDescription className="text-christmas-dark/70">
          Ingresa tus credenciales para gestionar el sorteo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-christmas-dark">
              Usuario
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="admin"
              autoComplete="username"
              required
              className="bg-white border-christmas-green/30 focus:border-christmas-green"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-christmas-dark">
              Contraseña
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="bg-white border-christmas-green/30 focus:border-christmas-green"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-christmas-red/10 border border-christmas-red/30 text-christmas-red text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-christmas-red hover:bg-christmas-red/90 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ingresando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Ingresar
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

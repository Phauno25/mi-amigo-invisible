"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Trash2,
  Shuffle,
  RotateCcw,
  LogOut,
  Gift,
  Users,
  LinkIcon,
  Copy,
  Check,
  Loader2,
  TreePine,
} from "lucide-react"
import {
  addParticipantAction,
  removeParticipantAction,
  assignSecretSantaAction,
  resetGameAction,
  clearAllParticipantsAction,
  logoutAction,
} from "@/app/actions"
import type { Participant } from "@/lib/db"

interface ParticipantWithAssignment extends Participant {
  assignedToName: string | null
}

interface AdminDashboardProps {
  participants: ParticipantWithAssignment[]
  isGameActive: boolean
}

export function AdminDashboard({ participants, isGameActive }: AdminDashboardProps) {
  const [newName, setNewName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const router = useRouter()

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("name", newName)

    const result = await addParticipantAction(formData)

    if (result.success) {
      setNewName("")
    } else {
      setError(result.error || "Error al agregar")
    }
    setIsLoading(false)
  }

  async function handleRemove(id: number) {
    await removeParticipantAction(id)
  }

  async function handleAssign() {
    setIsLoading(true)
    setError(null)

    const result = await assignSecretSantaAction()

    if (!result.success) {
      setError(result.error || "Error al asignar")
    }
    setIsLoading(false)
  }

  async function handleReset() {
    setIsLoading(true)
    await resetGameAction()
    setIsLoading(false)
  }

  async function handleClearAll() {
    setIsLoading(true)
    await clearAllParticipantsAction()
    setIsLoading(false)
  }

  async function handleLogout() {
    await logoutAction()
    router.push("/")
  }

  function copyToClipboard(participant: ParticipantWithAssignment) {
    const url = `${baseUrl}/${participant.slug}`
    const credentials = `Usuario: ${participant.name.toUpperCase()}\nCódigo: ${participant.access_code}\nURL: ${url}`
    navigator.clipboard.writeText(credentials)
    setCopiedId(participant.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <TreePine className="w-8 h-8 text-christmas-green" />
          <h1 className="text-3xl font-bold text-christmas-cream">Panel de Administración</h1>
          <Gift className="w-8 h-8 text-christmas-red" />
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-christmas-cream/20 border-christmas-cream/30 text-christmas-cream hover:bg-christmas-cream/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      {/* Status Card */}
      <Card className="mb-6 bg-christmas-cream/95 border-christmas-gold border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${isGameActive ? "bg-christmas-green animate-pulse" : "bg-christmas-red/50"}`}
              />
              <span className="text-christmas-dark font-medium">
                {isGameActive ? "Sorteo realizado" : "Sorteo pendiente"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-christmas-dark/70">
              <Users className="w-4 h-4" />
              <span>{participants.length} participantes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Add Participant Card */}
        <Card className="lg:col-span-1 bg-christmas-cream/95 border-christmas-gold border-2">
          <CardHeader>
            <CardTitle className="text-christmas-dark flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Participante
            </CardTitle>
            <CardDescription className="text-christmas-dark/70">Añade personas al sorteo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <Input
                placeholder="Nombre del participante"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isGameActive || isLoading}
                className="bg-white border-christmas-green/30"
              />
              <Button
                type="submit"
                disabled={isGameActive || isLoading || !newName.trim()}
                className="w-full bg-christmas-green hover:bg-christmas-green/90 text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Agregar
              </Button>
            </form>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-christmas-red/10 border border-christmas-red/30 text-christmas-red text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {!isGameActive ? (
                <Button
                  onClick={handleAssign}
                  disabled={participants.length < 2 || isLoading}
                  className="w-full bg-christmas-red hover:bg-christmas-red/90 text-white"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Armar Esquema
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-christmas-gold text-christmas-dark hover:bg-christmas-gold/20 bg-transparent"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reiniciar Sorteo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-christmas-cream border-christmas-gold">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-christmas-dark">¿Reiniciar el sorteo?</AlertDialogTitle>
                      <AlertDialogDescription className="text-christmas-dark/70">
                        Esto eliminará todas las asignaciones actuales. Los participantes se mantendrán.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-christmas-dark/30">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset} className="bg-christmas-red hover:bg-christmas-red/90">
                        Reiniciar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={participants.length === 0}
                    className="w-full border-christmas-red/50 text-christmas-red hover:bg-christmas-red/10 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar Todo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-christmas-cream border-christmas-gold">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-christmas-dark">
                      ¿Eliminar todos los participantes?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-christmas-dark/70">
                      Esta acción no se puede deshacer. Se eliminarán todos los participantes y asignaciones.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-christmas-dark/30">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-christmas-red hover:bg-christmas-red/90">
                      Eliminar Todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Participants List */}
        <Card className="lg:col-span-2 bg-christmas-cream/95 border-christmas-gold border-2">
          <CardHeader>
            <CardTitle className="text-christmas-dark flex items-center gap-2">
              <Users className="w-5 h-5" />
              Lista de Participantes
            </CardTitle>
            <CardDescription className="text-christmas-dark/70">
              {isGameActive
                ? "Comparte las credenciales con cada participante"
                : "Agrega participantes y luego realiza el sorteo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-12 text-christmas-dark/50">
                <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay participantes aún</p>
                <p className="text-sm">Agrega el primer participante para comenzar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-christmas-dark/20">
                      <TableHead className="text-christmas-dark">Nombre</TableHead>
                      <TableHead className="text-christmas-dark">URL</TableHead>
                      <TableHead className="text-christmas-dark">Código</TableHead>
                      {isGameActive && <TableHead className="text-christmas-dark">Regala a</TableHead>}
                      <TableHead className="text-christmas-dark text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id} className="border-christmas-dark/10">
                        <TableCell className="font-medium text-christmas-dark">{participant.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-christmas-dark/70">
                            <LinkIcon className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">/{participant.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-christmas-dark/5 rounded text-sm text-christmas-dark">
                            {participant.access_code}
                          </code>
                        </TableCell>
                        {isGameActive && (
                          <TableCell className="text-christmas-green font-medium">
                            {participant.assignedToName || "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isGameActive && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(participant)}
                                className="border-christmas-green/30 text-christmas-green hover:bg-christmas-green/10"
                              >
                                {copiedId === participant.id ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isGameActive}
                                  className="border-christmas-red/30 text-christmas-red hover:bg-christmas-red/10 bg-transparent"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-christmas-cream border-christmas-gold">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-christmas-dark">
                                    ¿Eliminar a {participant.name}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-christmas-dark/70">
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-christmas-dark/30">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemove(participant.id)}
                                    className="bg-christmas-red hover:bg-christmas-red/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      {isGameActive && (
        <Card className="mt-6 bg-christmas-green/10 border-christmas-green/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-christmas-cream mb-2">Instrucciones para los participantes:</h3>
            <ol className="list-decimal list-inside space-y-1 text-christmas-cream/80 text-sm">
              <li>Comparte la URL personal y el código de acceso con cada participante</li>
              <li>El usuario para ingresar es su nombre en MAYÚSCULAS</li>
              <li>El código de acceso es el que aparece en la tabla</li>
              <li>Al ingresar, verán a quién deben regalar</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

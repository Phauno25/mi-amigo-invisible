"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  PlayCircle,
  PauseCircle,
  UserCog,
} from "lucide-react";
import {
  addParticipantToGameAction,
  removeParticipantFromGameAction,
  assignSecretSantaForGameAction,
  resetGameAssignmentsAction,
  clearAllParticipantsFromGameAction,
  logoutAction,
} from "@/app/actions";
import { createGameAction, deleteGameAction } from "@/app/user-actions";
import type { Game, GameParticipant } from "@/lib/db";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

interface GameWithParticipants extends Game {
  participants: GameParticipant[];
}

interface MultiGameDashboardProps {
  games: GameWithParticipants[];
  isSuperAdmin: boolean;
  username: string;
}

export function MultiGameDashboard({
  games: initialGames,
  isSuperAdmin,
  username,
}: MultiGameDashboardProps) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(
    initialGames.length > 0 ? initialGames[0].id : null
  );
  const [gameName, setGameName] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const router = useRouter();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const selectedGame = initialGames.find((g) => g.id === selectedGameId);

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!gameName.trim()) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", gameName);
    formData.append("description", gameDescription);

    const result = await createGameAction(formData);

    if (result.success) {
      setGameName("");
      setGameDescription("");
      setIsCreateGameOpen(false);
      router.refresh();
    } else {
      setError(result.error || "Error al crear sorteo");
    }
    setIsLoading(false);
  }

  async function handleDeleteGame(gameId: number) {
    setIsLoading(true);
    const result = await deleteGameAction(gameId);

    if (result.success) {
      if (selectedGameId === gameId) {
        const remainingGames = initialGames.filter((g) => g.id !== gameId);
        setSelectedGameId(remainingGames[0]?.id || null);
      }
      router.refresh();
    } else {
      setError(result.error || "Error al eliminar sorteo");
    }
    setIsLoading(false);
  }

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !selectedGameId) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", newName);

    const result = await addParticipantToGameAction(selectedGameId, formData);

    if (result.success) {
      setNewName("");
      router.refresh();
    } else {
      setError(result.error || "Error al agregar");
    }
    setIsLoading(false);
  }

  async function handleRemove(participantId: number) {
    if (!selectedGameId) return;
    await removeParticipantFromGameAction(selectedGameId, participantId);
    router.refresh();
  }

  async function handleAssign() {
    if (!selectedGameId) return;

    setIsLoading(true);
    setError(null);

    const result = await assignSecretSantaForGameAction(selectedGameId);

    if (!result.success) {
      setError(result.error || "Error al asignar");
    } else {
      router.refresh();
    }
    setIsLoading(false);
  }

  async function handleReset() {
    if (!selectedGameId) return;

    setIsLoading(true);
    const result = await resetGameAssignmentsAction(selectedGameId);

    if (!result.success) {
      setError(result.error || "Error al reiniciar");
    } else {
      router.refresh();
    }
    setIsLoading(false);
  }

  async function handleClearAll() {
    if (!selectedGameId) return;

    setIsLoading(true);
    const result = await clearAllParticipantsFromGameAction(selectedGameId);

    if (!result.success) {
      setError(result.error || "Error al limpiar");
    } else {
      router.refresh();
    }
    setIsLoading(false);
  }

  async function handleLogout() {
    await logoutAction();
    router.push("/");
  }

  function copyToClipboard(
    text: string,
    id: number,
    type: "link" | "code" = "link"
  ) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);

    if (type === "code") {
      toast.success("Código copiado", {
        description: "El código de acceso se ha copiado al portapapeles",
      });
    } else {
      toast.success("Enlace copiado", {
        description: "El enlace se ha copiado al portapapeles",
      });
    }

    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-red-500 font-bold flex items-center gap-2">
            <TreePine className="h-8 w-8 text-green-600" />
            Amigo Invisible
          </h1>
          <p className="text-background">Bienvenido, {username}</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => router.push("/admin/users")}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Gestionar Usuarios
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Games List and Create Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Mis Sorteos ({initialGames.length})
              </CardTitle>
              <CardDescription>
                Selecciona un sorteo para gestionarlo
              </CardDescription>
            </div>
            <Dialog open={isCreateGameOpen} onOpenChange={setIsCreateGameOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Sorteo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Sorteo</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo sorteo de amigo invisible
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gameName">Nombre del Sorteo *</Label>
                    <Input
                      id="gameName"
                      placeholder="Ej: Navidad 2024, Oficina, Familia..."
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gameDescription">
                      Descripción (opcional)
                    </Label>
                    <Textarea
                      id="gameDescription"
                      placeholder="Añade detalles sobre el sorteo..."
                      value={gameDescription}
                      onChange={(e) => setGameDescription(e.target.value)}
                      disabled={isLoading}
                      rows={3}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateGameOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {initialGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tienes sorteos creados</p>
              <p className="text-sm">Crea tu primer sorteo para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialGames.map((game) => (
                <Card
                  key={game.id}
                  className={`cursor-pointer transition-all ${
                    selectedGameId === game.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedGameId(game.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{game.name}</CardTitle>
                        {game.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {game.description}
                          </CardDescription>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Eliminar sorteo?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Se eliminarán todos los participantes y
                              asignaciones de este sorteo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGame(game.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{game.participants.length} participantes</span>
                      </div>
                      {game.is_active ? (
                        <Badge className="flex items-center gap-1 bg-green-800 text-white">
                          <PlayCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Sorteado</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <PauseCircle className="h-4 w-4" />
                          <span className="text-xs">Sin Iniciar</span>
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Game Management */}
      {selectedGame && (
        <>
          {/* Add Participant */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Add Participant Card */}
            <Card className="lg:col-span-1 bg-christmas-cream/95 border-christmas-gold border-2">
              <CardHeader>
                <CardTitle className="text-christmas-dark flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Participante
                </CardTitle>
                <CardDescription className="text-christmas-dark/70">
                  Añade personas al sorteo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddParticipant} className="flex gap-2">
                  <Input
                    placeholder="Nombre del participante"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={isLoading || selectedGame.is_active}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || selectedGame.is_active}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </form>

                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-christmas-red/10 border border-christmas-red/30 text-christmas-red text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Participantes ({selectedGame.participants.length})
                    </CardTitle>
                    <CardDescription>
                      {selectedGame.is_active
                        ? "Comparte los enlaces con los participantes"
                        : "Agrega al menos 2 participantes"}
                    </CardDescription>
                  </div>
                  {selectedGame.participants.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpiar Todo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar todos los participantes?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará todos los participantes y
                            reiniciará el sorteo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearAll}>
                            Eliminar Todos
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedGame.participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay participantes</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Código de Acceso</TableHead>
                          <TableHead>Enlace</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedGame.participants.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              {p.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="cursor-pointer px-2 py-1 bg-muted rounded text-sm">
                                  {p.access_code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(p.access_code, p.id, "code")
                                  }
                                >
                                  {copiedId === p.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {selectedGameId && (
                                  <code className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {baseUrl}/g/{selectedGame.id}/{p.slug}
                                  </code>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    copyToClipboard(
                                      `${baseUrl}/g/${selectedGame.id}/${p.slug}`,
                                      p.id
                                    )
                                  }
                                >
                                  {copiedId === p.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemove(p.id)}
                                disabled={selectedGame.is_active}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
          {/* Stats */}
          <div className="flex w-full justify-center">
            <Card className="w-full">
              <CardContent className="flex w-full items-center justify-center gap-2">
                {!selectedGame.is_active ? (
                  <Button
                    onClick={handleAssign}
                    disabled={selectedGame.participants.length < 2 || isLoading}
                    className=" bg-green-800 w-fit sm:w-1/4"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Realizar Sorteo
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reiniciar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Reiniciar sorteo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esto eliminará las asignaciones actuales. Podrás
                          realizar un nuevo sorteo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset}>
                          Reiniciar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      {selectedGame?.is_active && (
        <Card className="mt-6 bg-christmas-green/10 border-christmas-green/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-christmas-cream mb-2">
              Instrucciones para los participantes:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-christmas-cream/80 text-sm">
              <li>
                Comparte la URL personal y el código de acceso con cada
                participante
              </li>
              <li>El usuario para ingresar es su nombre en MAYÚSCULAS</li>
              <li>El código de acceso es el que aparece en la tabla</li>
              <li>Al ingresar, verán a quién deben regalar</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

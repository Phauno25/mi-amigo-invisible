"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gift, Lock, TreePine } from "lucide-react";
import { verifyParticipantAccessForGame } from "@/app/actions";

interface GameParticipantRevealProps {
  slug: string;
  gameId: number;
  gameName: string;
}

export function GameParticipantReveal({
  slug,
  gameId,
  gameName,
}: GameParticipantRevealProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    participantName: string;
    assignedTo: string;
  } | null>(null);
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const verification = await verifyParticipantAccessForGame(
      gameId,
      slug,
      accessCode
    );

    if (
      verification.success &&
      verification.assignedTo &&
      verification.participantName
    ) {
      setResult({
        participantName: verification.participantName,
        assignedTo: verification.assignedTo,
      });
    } else {
      setError(verification.error || "Código inválido");
    }

    setIsLoading(false);
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-2xl">
              ¡Hola, {result.participantName}!
            </CardTitle>
            <CardDescription className="text-lg">{gameName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Tu amigo invisible es:
              </p>
              <p className="text-3xl font-bold text-primary">
                {result.assignedTo}
              </p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              ¡Recuerda mantener el secreto y prepara un regalo especial! 🎁
            </p>
          </CardContent>
        </Card>
        <div className="mt-8 flex items-center gap-2 text-christmas-cream/60 text-sm">
          <span>🎄</span>
          <span>Creado por Pablo Coronel</span>
          <span>🎄</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center flex-col justify-center p-4 gap-4">
      <div>
        <h1 className="text-3xl text-red-500 font-bold flex items-center gap-2">
          <TreePine className="h-8 w-8 text-green-600" />
          Mi Amigo Invisible
        </h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Acceso a Participante</CardTitle>
          <CardDescription>{gameName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Código de Acceso
              </label>
              <Input
                id="code"
                type="text"
                placeholder="Ingresa tu código"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                required
                className="text-center text-lg tracking-widest"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verificando..." : "Ver mi Amigo Invisible"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span>🎄</span>
        <span>Creado por Pablo Coronel</span>
        <span>🎄</span>
      </div>
    </div>
  );
}

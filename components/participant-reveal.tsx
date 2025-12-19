"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gift, Loader2, Lock, TreePine, PartyPopper } from "lucide-react";
import { verifyParticipantAccess } from "@/app/actions";
import type { Participant } from "@/lib/db";

interface ParticipantRevealProps {
  participant: Participant;
  isGameActive: boolean;
}

export function ParticipantReveal({
  participant,
  isGameActive,
}: ParticipantRevealProps) {
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [revealedName, setRevealedName] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check if username matches (case insensitive)
    if (username.toUpperCase() !== participant.name.toUpperCase()) {
      setError("Usuario incorrecto");
      setIsLoading(false);
      return;
    }

    const result = await verifyParticipantAccess(
      participant.slug,
      `${username}:${accessCode}`
    );

    if (result.success && result.assignedTo) {
      setRevealedName(result.assignedTo);
      setTimeout(() => setShowReveal(true), 500);
    } else {
      setError(result.error || "Error al verificar");
    }
    setIsLoading(false);
  }

  if (!isGameActive) {
    return (
      <Card className="w-full max-w-md bg-christmas-cream/95 border-christmas-gold border-2 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TreePine className="w-6 h-6 text-christmas-green" />
            <Gift className="w-8 h-8 text-christmas-red" />
            <TreePine className="w-6 h-6 text-christmas-green" />
          </div>
          <CardTitle className="text-2xl text-christmas-dark">
            Hola, {participant.name}
          </CardTitle>
          <CardDescription className="text-christmas-dark/70">
            El sorteo aún no se ha realizado
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-christmas-dark/60">
            Espera a que el administrador realice el sorteo del Amigo Invisible.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showReveal && revealedName) {
    return (
      <Card className="w-full max-w-md bg-christmas-cream/95 border-christmas-gold border-2 shadow-2xl animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <PartyPopper className="w-8 h-8 text-christmas-gold animate-bounce" />
          </div>
          <CardTitle className="text-2xl text-christmas-dark">
            Tu Amigo Invisible es...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="py-8">
            <div className="inline-block px-8 py-4 bg-christmas-red rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <p className="text-4xl font-bold text-white">{revealedName}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-christmas-green/10 rounded-lg border border-christmas-green/30">
            <Gift className="w-6 h-6 mx-auto mb-2 text-christmas-green" />
            <p className="text-christmas-dark text-sm">
              Recuerda: Este es tu secreto. ¡No se lo cuentes a nadie!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-christmas-cream/95 border-christmas-gold border-2 shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TreePine className="w-6 h-6 text-christmas-green" />
          <Gift className="w-8 h-8 text-christmas-red" />
          <TreePine className="w-6 h-6 text-christmas-green" />
        </div>
        <CardTitle className="text-2xl text-christmas-dark">
          Hola, {participant.name}
        </CardTitle>
        <CardDescription className="text-christmas-dark/70">
          Ingresa tus credenciales para ver tu amigo invisible
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-christmas-dark">
              Usuario (tu nombre en MAYÚSCULAS)
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="NOMBRE"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white border-christmas-green/30 uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-christmas-dark">
              Código de Acceso
            </Label>
            <Input
              id="code"
              type="text"
              placeholder="ABC123"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
              className="bg-white border-christmas-green/30 uppercase"
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
                Verificando...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Revelar Mi Amigo Invisible
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

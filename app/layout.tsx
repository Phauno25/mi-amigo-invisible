import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Amigo Invisible - Sorteo Navideño",
  description: "Organiza el sorteo del Amigo Invisible para tu familia y amigos. ¡Felices Fiestas!",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon.svg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a472a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors theme="system" />
        <Analytics />
      </body>
    </html>
  )
}

import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Providers } from "@/app/providers"

export const metadata: Metadata = {
  title: "Web3 Dashboard",
  description: "A secure token swap application with verification",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}



import './globals.css'
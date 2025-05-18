import { Providers } from "./providers"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Auth App",
  description: "App with Next.js, NextAuth and Prisma",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

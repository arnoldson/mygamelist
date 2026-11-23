import { Providers } from "./providers"
import "./globals.css"
import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
import { auth } from "@/auth"

export const metadata: Metadata = {
  title: "My Game List",
  description:
    "Track your games, share your progress, and discover new titles.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}

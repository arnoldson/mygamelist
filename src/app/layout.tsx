import { Providers } from "./providers"
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Game List",
  description:
    "Track your games, share your progress, and discover new titles.",
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

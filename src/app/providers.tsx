"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import { ReactNode } from "react"

type ProvidersProps = {
  children: ReactNode
  session: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  // SessionProvider only reads `session` on mount and never refetches while the
  // cached session is null, so a server-action login (soft redirect) would leave
  // useSession() stale. Keying on the user remounts it when auth state changes.
  return (
    <SessionProvider session={session} key={session?.user?.id ?? "guest"}>
      {children}
    </SessionProvider>
  )
}

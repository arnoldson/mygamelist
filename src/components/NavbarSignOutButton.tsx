// components/NavbarSignOutButton.tsx
"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export default function NavbarSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 font-medium"
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  )
}

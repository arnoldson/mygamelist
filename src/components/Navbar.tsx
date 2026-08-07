// components/Navbar.tsx
import Link from "next/link"
import { Gamepad2, Search, User, List, LogIn } from "lucide-react"
import { auth } from "@/auth"
import NavbarSignOutButton from "./NavbarSignOutButton"

export default async function Navbar() {
  const session = await auth()

  return (
    <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              MyGameList
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-6">
            {/* Search Link - Only show for unauthenticated users, hidden on the smallest screens to make room for Login/Register */}
            {!session?.user && (
              <Link
                href="/games/search"
                className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </Link>
            )}

            {/* Conditional Auth Links */}
            {session?.user ? (
              // Authenticated user
              <div className="flex items-center gap-1 sm:gap-4">
                <Link
                  href="/games/search"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
                <Link
                  href={`/gameslist/${session.user.username}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">My List</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="text-gray-300 text-sm hidden md:block">
                  Welcome, {session.user.username || session.user.email}
                </div>
                <NavbarSignOutButton />
              </div>
            ) : (
              // Unauthenticated user
              <div className="flex items-center gap-1 sm:gap-3">
                <Link
                  href="/login"
                  aria-label="Login"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 font-medium"
                >
                  <LogIn className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 text-sm sm:px-4 sm:text-base rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

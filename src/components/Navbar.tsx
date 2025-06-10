"use client"

import React from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Gamepad2, Search, User, LogOut, List } from "lucide-react"

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <Gamepad2 className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
            <span className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              MyGameList
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {/* Search Link - Only show for unauthenticated users */}
            {!session?.user && (
              <Link
                href="/games/search"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </Link>
            )}

            {/* Conditional Auth Links */}
            {status === "loading" ? (
              // Loading state
              <div className="flex items-center gap-3">
                <div className="w-16 h-8 bg-gray-600/50 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-600/50 rounded animate-pulse"></div>
              </div>
            ) : session?.user ? (
              // Authenticated user
              <div className="flex items-center gap-4">
                <Link
                  href="/games/search"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
                <Link
                  href={`/gameslist/${session.user.username}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">My List</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="text-gray-300 text-sm hidden md:block">
                  Welcome, {session.user.username || session.user.email}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10 font-medium"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              // Unauthenticated user
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10 font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
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

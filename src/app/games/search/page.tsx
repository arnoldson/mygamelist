"use client"

import { useState, useCallback } from "react"
import { Search, GamepadIcon, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

import type { Game, RAWGSearchResponse } from "@/types/game"
import GameCard from "./GameCard"
import { useGameEntry } from "@/hooks/useGameEntry"
import GameEntryForm from "@/components/GameEntryForm"
import { GameListType } from "@/types/enums"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/Toast"

interface ErrorResponse {
  error: string
  message: string
}

interface AddModalState {
  isOpen: boolean
  game: Game | null
}

interface GameEntry {
  id: string
  rawgGameId: number
  title: string
  status: GameListType
  rating?: number
  review?: string
  hoursPlayed?: number
  startedAt?: string
  completedAt?: string
}

export default function GamesSearchPage() {
  const [query, setQuery] = useState("")
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(-1)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Add modal state
  const [addModal, setAddModal] = useState<AddModalState>({
    isOpen: false,
    game: null,
  })

  const { data: session } = useSession()
  const {
    createEntry,
    isLoading: isCreating,
    error: createError,
    clearError,
  } = useGameEntry()

  // Add toast hook
  const { toasts, addToast, removeToast } = useToast()

  const searchGames = useCallback(
    async (searchQuery: string, pageNum: number = 1) => {
      if (!searchQuery.trim()) return

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          page: pageNum.toString(),
          page_size: "20",
        })

        const response = await fetch(`/api/games/search?${params}`)
        const data = await response.json()

        if (!response.ok) {
          const errorData = data as ErrorResponse
          throw new Error(errorData.message || "Failed to search games")
        }

        const searchData = data as RAWGSearchResponse

        if (pageNum === 1) {
          setGames(searchData.results)
        } else {
          setGames((prev) => [...prev, ...searchData.results])
        }

        setTotalCount(searchData.count)
        setHasMore(!!searchData.next)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        if (pageNum === 1) {
          setGames([])
        }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      searchGames(query, 1)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      searchGames(query, page + 1)
    }
  }

  // Handle add game to list
  const handleAddGame = (game: Game) => {
    if (!session?.user) {
      // Redirect to login or show login modal
      window.location.href = "/api/auth/signin"
      return
    }
    clearError() // Clear any previous errors
    setAddModal({
      isOpen: true,
      game,
    })
  }

  // Handle save from add modal
  const handleCreateAdd = async (formData: Partial<GameEntry>) => {
    if (!addModal.game) return

    try {
      const gameData = {
        title: addModal.game.name,
        rawgGameId: addModal.game.id,
        ...formData,
      }
      const result = await createEntry(gameData)

      // Close the modal on success
      setAddModal({
        isOpen: false,
        game: null,
      })

      // Show success toast notification
      addToast({
        type: "success",
        title: "Game Added Successfully!",
        message: `"${addModal.game.name}" has been added to your library.`,
        duration: 5000,
      })
    } catch (err) {
      // Show error toast notification
      addToast({
        type: "error",
        title: "Failed to Add Game",
        message:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        duration: 7000,
      })
      console.error("Failed to create game entry:", err)
    }
  }

  // Handle close add modal
  const handleCloseAdd = () => {
    clearError()
    setAddModal({
      isOpen: false,
      game: null,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Game Search
          </h1>
          <p className="text-gray-300 text-lg">
            Discover your next favorite game
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for games..."
              className="w-full pl-12 pr-4 py-4 text-lg rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        {/* Auth Status Info */}
        {!session?.user && games.length > 0 && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 text-blue-200">
              <Link
                href="/api/auth/signin"
                className="underline hover:text-blue-100 transition-colors"
              >
                Sign in
              </Link>{" "}
              to add games to your library
            </div>
          </div>
        )}

        {/* Results Count */}
        {totalCount > 0 && (
          <div className="max-w-6xl mx-auto mb-6">
            <p className="text-gray-300">
              Found {totalCount.toLocaleString()} games
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Games Grid */}
        {games.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  showAddButton={true}
                  onAddGame={handleAddGame}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    "Load More Games"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && totalCount === 0 && query && !error && (
          <div className="text-center py-12">
            <GamepadIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              No games found
            </h3>
            <p className="text-gray-400">
              Try searching for a different game title
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && games.length === 0 && !query && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              Start searching for games
            </h3>
            <p className="text-gray-400">
              Enter a game title to discover amazing games
            </p>
          </div>
        )}
      </div>

      {/* Add Game Modal */}
      {addModal.isOpen && addModal.game && (
        <GameEntryForm
          gameEntry={{
            rawgGameId: addModal.game.id,
            title: addModal.game.name,
            status: GameListType.PLAN_TO_PLAY, // Default status
          }}
          isModal={true}
          onClose={handleCloseAdd}
          onCreate={handleCreateAdd}
          showTitle={true}
          submitButtonText={isCreating ? "Adding..." : "Add to Library"}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

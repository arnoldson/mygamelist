// app/gameslist/[userName]/GamesListContent.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import {
  Star,
  Clock,
  Calendar,
  MessageSquare,
  User,
  Trash2,
  Edit3,
  X,
} from "lucide-react"
import GamesListSkeleton from "./GamesListSkeleton"
import { useSession } from "next-auth/react"
import { GameListType } from "@/types/enums"
import { useGameEntry } from "@/hooks/useGameEntry"
import GameEntryForm from "@/components/GameEntryForm"
import { deepCopy } from "@/lib/utils"
import { STATUS_CONFIG } from "@/types/constants"

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
  addedAt: string
  updatedAt: string
}

interface GameList {
  type: GameListType
  status: GameListType
  gameEntries: GameEntry[]
}

interface ApiResponse {
  user: {
    username: string
    image?: string
  }
  gameList?: GameList
  gameLists?: GameList[]
  meta: {
    totalGames: number
    totalHours: number
    averageRating?: number
    listCounts?: Record<GameListType, number>
  }
}

interface GamesListContentProps {
  userName: string
  status?: string
}

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  gameTitle: string
  isDeleting: boolean
}

interface EditModalState {
  isOpen: boolean
  gameEntry: GameEntry | null
}

// Dark-theme status styling, independent of the light-mode STATUS_CONFIG
// color fields (label/value from STATUS_CONFIG are still used).
const DARK_STATUS_STYLES: Record<
  GameListType,
  { dot: string; text: string; bgTint: string; border: string }
> = {
  [GameListType.PLAYING]: {
    dot: "bg-green-400",
    text: "text-green-400",
    bgTint: "bg-green-500/10",
    border: "border-green-500/20",
  },
  [GameListType.PLAN_TO_PLAY]: {
    dot: "bg-blue-400",
    text: "text-blue-400",
    bgTint: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  [GameListType.COMPLETED]: {
    dot: "bg-purple-400",
    text: "text-purple-400",
    bgTint: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  [GameListType.ON_HOLD]: {
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    bgTint: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  [GameListType.DROPPED]: {
    dot: "bg-red-400",
    text: "text-red-400",
    bgTint: "bg-red-500/10",
    border: "border-red-500/20",
  },
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  gameTitle,
  isDeleting,
}: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-lg shadow-xl max-w-md w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Delete Game</h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Are you sure you want to delete this game?
              </p>
              <p className="text-sm text-gray-400 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
            <p className="font-medium text-white">{gameTitle}</p>
          </div>

          <p className="text-sm text-gray-400">
            This will permanently remove the game from your library, including
            all ratings, reviews, and progress data.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10 bg-white/5 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Game</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GamesListContent({
  userName,
  status,
}: GamesListContentProps) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    gameEntry: GameEntry | null
    isDeleting: boolean
  }>({
    isOpen: false,
    gameEntry: null,
    isDeleting: false,
  })

  // Edit modal state
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    gameEntry: null,
  })

  const router = useRouter()
  const { data: session } = useSession()
  const {
    updateEntry,
    isLoading: isUpdating,
    error: updateError,
    clearError,
  } = useGameEntry()

  // Check if current user can modify entries (owns this profile)
  const canModify = session?.user?.username === userName

  // Fetch games list data from internal API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const url = status
          ? `/api/gameslist/${encodeURIComponent(userName)}?status=${status}`
          : `/api/gameslist/${encodeURIComponent(userName)}`

        const response = await fetch(url)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found")
          }
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error?.message || "Failed to fetch games list",
          )
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error("Error fetching games list:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userName, status])

  // Handle edit game entry
  const handleEditGame = (gameEntry: GameEntry) => {
    clearError() // Clear any previous errors
    setEditModal({
      isOpen: true,
      gameEntry,
    })
  }

  // Handle save from edit modal
  const handleSaveEdit = async (formData: Partial<GameEntry>) => {
    if (!editModal.gameEntry) return

    try {
      await updateEntry(editModal.gameEntry.id, formData)

      // Update local state with the updated entry
      setData((prevData) => {
        if (!prevData) return prevData

        const updatedEntry = {
          ...editModal.gameEntry,
          ...formData,
        } as GameEntry

        // Deep copy to avoid mutating original state
        const updatedStateData = deepCopy(prevData)

        const oldStatus = editModal.gameEntry!.status
        const newStatus = updatedEntry.status

        if (updatedStateData.gameList) {
          if (oldStatus !== newStatus) {
            // Status changed - move entry between lists
            updatedStateData.gameList.gameEntries =
              updatedStateData.gameList.gameEntries.filter(
                (entry) => entry.id !== editModal.gameEntry!.id,
              )
          } else {
            // Status unchanged - just update the entry
            // Single list view
            updatedStateData.gameList.gameEntries =
              updatedStateData.gameList.gameEntries.map((entry) =>
                entry.id === editModal.gameEntry!.id ? updatedEntry : entry,
              )
          }
        }

        if (updatedStateData.gameLists) {
          // Multiple lists view

          if (oldStatus !== newStatus) {
            // Status changed - move entry between lists
            updatedStateData.gameLists = updatedStateData.gameLists.map(
              (gameList) => {
                if (gameList.status === oldStatus) {
                  // Remove from old list
                  return {
                    ...gameList,
                    gameEntries: gameList.gameEntries.filter(
                      (entry) => entry.id !== editModal.gameEntry!.id,
                    ),
                  }
                } else if (gameList.status === newStatus) {
                  // Add to new list (or update if already there)
                  const existingIndex = gameList.gameEntries.findIndex(
                    (entry) => entry.id === editModal.gameEntry!.id,
                  )
                  if (existingIndex >= 0) {
                    // Update existing entry
                    const newEntries = [...gameList.gameEntries]
                    newEntries[existingIndex] = updatedEntry
                    return { ...gameList, gameEntries: newEntries }
                  } else {
                    // Add new entry
                    return {
                      ...gameList,
                      gameEntries: [...gameList.gameEntries, updatedEntry],
                    }
                  }
                }
                return gameList
              },
            )
          } else {
            // Status unchanged - just update the entry
            updatedStateData.gameLists = updatedStateData.gameLists.map(
              (gameList) => ({
                ...gameList,
                gameEntries: gameList.gameEntries.map((entry) =>
                  entry.id === editModal.gameEntry!.id ? updatedEntry : entry,
                ),
              }),
            )
          }
        }

        // Update metadata (hours played might have changed)
        const hoursDiff =
          (updatedEntry.hoursPlayed || 0) -
          (editModal.gameEntry!.hoursPlayed || 0)
        if (hoursDiff !== 0) {
          updatedStateData.meta.totalHours = Math.max(
            0,
            updatedStateData.meta.totalHours + hoursDiff,
          )
        }

        if (oldStatus !== newStatus) {
          // Update list counts if available
          if (updatedStateData.meta.listCounts) {
            updatedStateData.meta.listCounts = {
              ...updatedStateData.meta.listCounts,
              [oldStatus]: updatedStateData.meta.listCounts[oldStatus] - 1,
              [newStatus]: updatedStateData.meta.listCounts[newStatus] + 1,
            }
          }
        }

        return updatedStateData
      })

      // Close the modal
      setEditModal({
        isOpen: false,
        gameEntry: null,
      })
    } catch (err) {
      // Error is handled by the hook and will be shown in the form
      console.error("Failed to update game entry:", err)
    }
  }

  // Handle close edit modal
  const handleCloseEdit = () => {
    clearError()
    setEditModal({
      isOpen: false,
      gameEntry: null,
    })
  }

  // Handle delete game entry
  const handleDeleteGame = async (gameEntry: GameEntry) => {
    setDeleteModal({
      isOpen: true,
      gameEntry,
      isDeleting: false,
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.gameEntry) return

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(
        `/api/gameslist/entries/${deleteModal.gameEntry.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to delete game")
      }

      const result = await response.json()

      // Show success message (you can replace this with a toast notification)
      console.log(result.message)

      // Update the local state to remove the deleted entry
      setData((prevData) => {
        if (!prevData) return prevData

        // Update the data by removing the deleted entry
        const updatedData = { ...prevData }

        if (updatedData.gameList) {
          // Single list view
          updatedData.gameList.gameEntries =
            updatedData.gameList.gameEntries.filter(
              (entry) => entry.id !== deleteModal.gameEntry!.id,
            )
        }

        if (updatedData.gameLists) {
          // Multiple lists view
          updatedData.gameLists = updatedData.gameLists.map((gameList) => ({
            ...gameList,
            gameEntries: gameList.gameEntries.filter(
              (entry) => entry.id !== deleteModal.gameEntry!.id,
            ),
          }))
        }

        // Update metadata
        updatedData.meta = {
          ...updatedData.meta,
          totalGames: updatedData.meta.totalGames - 1,
          totalHours:
            updatedData.meta.totalHours -
            (deleteModal.gameEntry!.hoursPlayed || 0),
        }

        // Update list counts if available
        if (updatedData.meta.listCounts && deleteModal.gameEntry) {
          const deletedEntryStatus = deleteModal.gameEntry.status
          if (updatedData.meta.listCounts[deletedEntryStatus] > 0) {
            updatedData.meta.listCounts[deletedEntryStatus] -= 1
          }
        }

        return updatedData
      })

      // Close the modal
      setDeleteModal({
        isOpen: false,
        gameEntry: null,
        isDeleting: false,
      })
    } catch (err) {
      console.error("Error deleting game:", err)
      alert(err instanceof Error ? err.message : "Failed to delete game")
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const closeDeleteModal = () => {
    if (deleteModal.isDeleting) return // Prevent closing while deleting
    setDeleteModal({
      isOpen: false,
      gameEntry: null,
      isDeleting: false,
    })
  }

  // Handle status filter change
  const handleStatusChange = (newStatus?: string) => {
    const params = new URLSearchParams()

    if (newStatus) {
      params.set("status", newStatus)
    }

    const queryString = params.toString()
    const newUrl = `/gameslist/${userName}${
      queryString ? `?${queryString}` : ""
    }`

    router.push(newUrl)
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Render stars for rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < rating
                ? "text-yellow-400 fill-current drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]"
                : "text-gray-600"
            }`}
          />
        ))}
        <span className="text-sm font-medium ml-1 text-gray-300">
          {rating}/10
        </span>
      </div>
    )
  }

  if (loading) return <GamesListSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-12">
        <div className="max-w-md mx-auto p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-md">
          <div className="text-center">
            <div className="text-red-400 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        <div className="text-center py-12">
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    )
  }

  const currentGameLists =
    status && data.gameList ? [data.gameList] : data.gameLists || []

  const currentStatus = status
    ? STATUS_CONFIG[parseInt(status) as GameListType]
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              {data.user.image ? (
                <Image
                  src={data.user.image}
                  alt={data.user.username}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {data.user.username}&apos;s Game Library
              </h1>
              <div className="flex items-center space-x-4 text-gray-300 mt-1">
                <span className="flex items-center">
                  <span className="font-medium text-white">
                    {data.meta.totalGames}
                  </span>
                  <span className="ml-1">games</span>
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-purple-400" />
                  <span className="font-medium text-white">
                    {data.meta.totalHours}
                  </span>
                  <span className="ml-1">hours</span>
                </span>
                {data.meta.averageRating && (
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-400" />
                    <span className="font-medium text-white">
                      {data.meta.averageRating}
                    </span>
                    /10 avg
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Filter by Status
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleStatusChange()}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !status
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                  : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              All Lists ({data.meta.totalGames})
            </button>
            {Object.entries(STATUS_CONFIG).map(([statusValue, config]) => {
              const dark = DARK_STATUS_STYLES[config.value as GameListType]
              const count = data.meta.listCounts?.[config.value] || 0
              const isActive = status === statusValue
              return (
                <button
                  key={statusValue}
                  onClick={() => handleStatusChange(statusValue)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? `${dark.bgTint} ${dark.text} ${dark.border} shadow-md transform scale-105`
                      : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {config.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Games Content */}
        {currentGameLists.length === 0 && !status && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Games Yet
            </h3>
            <p className="text-gray-400">
              This user hasn&apos;t added any games to their library yet.
            </p>
          </div>
        )}

        {currentGameLists.map((gameList) => {
          const statusConfig = STATUS_CONFIG[gameList.status]
          const dark = DARK_STATUS_STYLES[gameList.status]

          return (
            <div
              key={gameList.type}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm overflow-hidden"
            >
              {/* List Header */}
              <div
                className={`${dark.bgTint} border-b border-white/10 px-6 py-4`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${dark.dot}`}></div>
                  <h2 className={`text-xl font-semibold ${dark.text}`}>
                    {statusConfig.label}
                  </h2>
                  <span className="text-gray-300 bg-white/10 px-2 py-1 rounded-full text-sm">
                    {gameList.gameEntries.length} games
                  </span>
                </div>
              </div>

              {/* Games Grid */}
              <div className="p-6">
                {gameList.gameEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-400 italic">
                      No games in this list
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {gameList.gameEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="border border-white/10 bg-white/[0.03] rounded-lg p-4 hover:shadow-md hover:border-purple-500/40 hover:bg-white/[0.06] transition-all duration-200 relative group"
                      >
                        {/* Action Buttons (only show for owner) */}
                        {canModify && (
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditGame(entry)
                              }}
                              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                              title="Edit game"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteGame(entry)
                              }}
                              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                              title="Delete game"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Game Header */}
                        <div className="mb-3">
                          <h3 className="font-semibold text-lg text-white mb-1 line-clamp-2 pr-20">
                            {entry.title}
                          </h3>
                        </div>

                        {/* Game Stats */}
                        <div className="space-y-2 mb-3">
                          {entry.rating && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">
                                Rating:
                              </span>
                              {renderStars(entry.rating)}
                            </div>
                          )}

                          {entry.hoursPlayed !== undefined &&
                            entry.hoursPlayed > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                  Hours:
                                </span>
                                <span className="text-sm font-medium flex items-center text-gray-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {entry.hoursPlayed}h
                                </span>
                              </div>
                            )}

                          {entry.startedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">
                                Started:
                              </span>
                              <span className="text-sm text-gray-200 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(entry.startedAt)}
                              </span>
                            </div>
                          )}

                          {entry.completedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">
                                Completed:
                              </span>
                              <span className="text-sm text-green-400 flex items-center font-medium">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(entry.completedAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Review */}
                        {entry.review && (
                          <div className="border-t border-white/10 pt-3">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-400 line-clamp-3">
                                {entry.review}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Added Date */}
                        <div className="mt-3 pt-2 border-t border-white/10">
                          <p className="text-xs text-gray-500">
                            Added {formatDate(entry.addedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {status && currentGameLists.length === 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Games Found
            </h3>
            <p className="text-gray-400 mb-4">
              No games found in the &quot;{currentStatus?.label}&quot; list.
            </p>
            <button
              onClick={() => handleStatusChange()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              View All Lists
            </button>
          </div>
        )}

        {/* Edit Game Modal */}
        {editModal.isOpen && editModal.gameEntry && (
          <GameEntryForm
            gameEntry={editModal.gameEntry}
            isModal={true}
            onClose={handleCloseEdit}
            onSave={handleSaveEdit}
            showTitle={true}
            submitButtonText={isUpdating ? "Saving..." : "Save Changes"}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          gameTitle={deleteModal.gameEntry?.title || ""}
          isDeleting={deleteModal.isDeleting}
        />

        {/* Optional: Update Error Toast */}
        {updateError && (
          <div className="fixed bottom-4 right-4 bg-gray-900 border border-red-500/30 rounded-lg p-4 shadow-lg z-[60]">
            <div className="flex items-center max-w-sm">
              <div className="text-red-400 mr-2">⚠️</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">
                  Update Failed
                </p>
                <p className="text-sm text-gray-300">{updateError}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

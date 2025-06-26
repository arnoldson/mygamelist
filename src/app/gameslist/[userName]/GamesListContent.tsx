// app/gameslist/[userName]/GamesListContent.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Star, Clock, User, Trash2, X } from "lucide-react"
import GamesListSkeleton from "./GamesListSkeleton"
import GameListItem from "./GameListItem"
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

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  gameTitle,
  isDeleting,
}: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Delete Game</h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Are you sure you want to delete this game?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="font-medium text-gray-900">{gameTitle}</p>
          </div>

          <p className="text-sm text-gray-600">
            This will permanently remove the game from your library, including
            all ratings, reviews, and progress data.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center space-x-2"
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
            errorData.error?.message || "Failed to fetch games list"
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
                (entry) => entry.id !== editModal.gameEntry!.id
              )
          } else {
            // Status unchanged - just update the entry
            // Single list view
            updatedStateData.gameList.gameEntries =
              updatedStateData.gameList.gameEntries.map((entry) =>
                entry.id === editModal.gameEntry!.id ? updatedEntry : entry
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
                      (entry) => entry.id !== editModal.gameEntry!.id
                    ),
                  }
                } else if (gameList.status === newStatus) {
                  // Add to new list (or update if already there)
                  const existingIndex = gameList.gameEntries.findIndex(
                    (entry) => entry.id === editModal.gameEntry!.id
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
              }
            )
          } else {
            // Status unchanged - just update the entry
            updatedStateData.gameLists = updatedStateData.gameLists.map(
              (gameList) => ({
                ...gameList,
                gameEntries: gameList.gameEntries.map((entry) =>
                  entry.id === editModal.gameEntry!.id ? updatedEntry : entry
                ),
              })
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
            updatedStateData.meta.totalHours + hoursDiff
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
        }
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
              (entry) => entry.id !== deleteModal.gameEntry!.id
            )
        }

        if (updatedData.gameLists) {
          // Multiple lists view
          updatedData.gameLists = updatedData.gameLists.map((gameList) => ({
            ...gameList,
            gameEntries: gameList.gameEntries.filter(
              (entry) => entry.id !== deleteModal.gameEntry!.id
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

  if (loading) return <GamesListSkeleton />

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const currentGameLists =
    status && data.gameList ? [data.gameList] : data.gameLists || []

  const currentStatus = status
    ? STATUS_CONFIG[parseInt(status) as GameListType]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
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
            <h1 className="text-3xl font-bold text-gray-900">
              {data.user.username}&apos;s Game Library
            </h1>
            <div className="flex items-center space-x-4 text-gray-600 mt-1">
              <span className="flex items-center">
                <span className="font-medium">{data.meta.totalGames}</span>{" "}
                games
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium">{data.meta.totalHours}</span>{" "}
                hours
              </span>
              {data.meta.averageRating && (
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  <span className="font-medium">{data.meta.averageRating}</span>
                  /10 avg
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Filter by Status</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleStatusChange()}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              !status
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Lists ({data.meta.totalGames})
          </button>
          {Object.entries(STATUS_CONFIG).map(([statusValue, config]) => {
            const count = data.meta.listCounts?.[config.value] || 0
            const isActive = status === statusValue
            return (
              <button
                key={statusValue}
                onClick={() => handleStatusChange(statusValue)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `${config.color} text-white shadow-md transform scale-105`
                    : `${config.bgLight} ${config.textColor} hover:scale-105`
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
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Games Yet
          </h3>
          <p className="text-gray-500">
            This user hasn&apos;t added any games to their library yet.
          </p>
        </div>
      )}

      {/* Single Games List */}
      {currentGameLists.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* List Header */}
          <div className="bg-gray-50 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {status ? currentStatus?.label : "All Games"}
              </h2>
              <span className="text-gray-500 bg-white px-2 py-1 rounded-full text-sm">
                {currentGameLists.reduce(
                  (total, list) => total + list.gameEntries.length,
                  0
                )}{" "}
                games
              </span>
            </div>
          </div>

          {/* Games List */}
          <div className="divide-y divide-gray-200">
            {(() => {
              // Collect all games from all lists
              const allGames = currentGameLists.flatMap(
                (list) => list.gameEntries
              )

              // Group by status and sort within each group by addedAt (most recent first)
              const gamesByStatus = allGames.reduce((groups, game) => {
                const status = game.status
                if (!groups[status]) {
                  groups[status] = []
                }
                groups[status].push(game)
                return groups
              }, {} as Record<GameListType, GameEntry[]>)

              // Sort each group by addedAt (most recent first)
              Object.keys(gamesByStatus).forEach((status) => {
                gamesByStatus[status as unknown as GameListType].sort(
                  (a, b) =>
                    new Date(b.addedAt).getTime() -
                    new Date(a.addedAt).getTime()
                )
              })

              // Define status order for grouping
              const statusOrder = [
                GameListType.PLAYING,
                GameListType.PLAN_TO_PLAY,
                GameListType.COMPLETED,
                GameListType.ON_HOLD,
                GameListType.DROPPED,
              ]

              // Render games grouped by status
              return statusOrder.flatMap(
                (statusType) =>
                  gamesByStatus[statusType]?.map((entry) => (
                    <GameListItem
                      key={entry.id}
                      entry={entry}
                      canModify={canModify}
                      onEdit={handleEditGame}
                      onDelete={handleDeleteGame}
                    />
                  )) || []
              )
            })()}
          </div>
        </div>
      )}

      {status && currentGameLists.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Games Found
          </h3>
          <p className="text-gray-500 mb-4">
            No games found in the &quot;{currentStatus?.label}&quot; list.
          </p>
          <button
            onClick={() => handleStatusChange()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-[60]">
          <div className="flex items-center max-w-sm">
            <div className="text-red-500 mr-2">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Update Failed</p>
              <p className="text-sm text-red-600">{updateError}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

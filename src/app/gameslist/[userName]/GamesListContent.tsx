// app/gameslist/[userName]/GamesListContent.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { STATUS_CONFIG } from "./page"
import { Star, Clock, Calendar, MessageSquare, User } from "lucide-react"
import GamesListSkeleton from "./GamesListSkeleton"

interface GameEntry {
  id: string
  rawgGameId: number
  title: string
  rating?: number
  review?: string
  hoursPlayed?: number
  startedAt?: string
  completedAt?: string
  addedAt: string
  updatedAt: string
}

interface GameList {
  id?: string
  type: string
  status: number
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
    listCounts?: Record<string, number>
  }
}

interface GamesListContentProps {
  userName: string
  status?: string
}

export default function GamesListContent({
  userName,
  status,
}: GamesListContentProps) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Fetch games list data from internal API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const url = status
          ? `/api/gameslist/${encodeURIComponent(userName)}?status=${status}`
          : `/api/gameslist/${encodeURIComponent(userName)}`

        console.log("Fetching games list from:", url)
        console.log("Status filter:", status)

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
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm font-medium ml-1">{rating}/10</span>
      </div>
    )
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
    ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
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
          {Object.entries(STATUS_CONFIG).map(([statusNum, config]) => {
            const count = data.meta.listCounts?.[config.type] || 0
            const isActive = status === statusNum
            return (
              <button
                key={statusNum}
                onClick={() => handleStatusChange(statusNum)}
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

      {currentGameLists.map((gameList) => {
        const statusConfig =
          STATUS_CONFIG[
            gameList.status.toString() as keyof typeof STATUS_CONFIG
          ]

        return (
          <div
            key={gameList.type}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            {/* List Header */}
            <div className={`${statusConfig.bgLight} border-b px-6 py-4`}>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full ${statusConfig.color}`}
                ></div>
                <h2
                  className={`text-xl font-semibold ${statusConfig.textColor}`}
                >
                  {statusConfig.label}
                </h2>
                <span className="text-gray-500 bg-white px-2 py-1 rounded-full text-sm">
                  {gameList.gameEntries.length} games
                </span>
              </div>
            </div>

            {/* Games Grid */}
            <div className="p-6">
              {gameList.gameEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-500 italic">No games in this list</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {gameList.gameEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                    >
                      {/* Game Header */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                          {entry.title}
                        </h3>
                      </div>

                      {/* Game Stats */}
                      <div className="space-y-2 mb-3">
                        {entry.rating && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Rating:
                            </span>
                            {renderStars(entry.rating)}
                          </div>
                        )}

                        {entry.hoursPlayed !== undefined &&
                          entry.hoursPlayed > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Hours:
                              </span>
                              <span className="text-sm font-medium flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {entry.hoursPlayed}h
                              </span>
                            </div>
                          )}

                        {entry.startedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Started:
                            </span>
                            <span className="text-sm text-gray-800 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(entry.startedAt)}
                            </span>
                          </div>
                        )}

                        {entry.completedAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Completed:
                            </span>
                            <span className="text-sm text-green-600 flex items-center font-medium">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(entry.completedAt)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Review */}
                      {entry.review && (
                        <div className="border-t pt-3">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {entry.review}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Added Date */}
                      <div className="mt-3 pt-2 border-t">
                        <p className="text-xs text-gray-400">
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
    </div>
  )
}

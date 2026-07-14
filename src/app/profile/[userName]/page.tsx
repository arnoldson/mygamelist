// app/profile/[userName]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import {
  User,
  Star,
  Clock,
  Calendar,
  GamepadIcon,
  TrendingUp,
  Award,
  Activity,
  ExternalLink,
  Edit3,
} from "lucide-react"
import { GameListType } from "@/types/enums"
import { STATUS_CONFIG } from "@/types/constants"

interface RecentUpdate {
  id: string
  gameTitle: string
  rawgGameId: number
  action: "added" | "updated" | "status_changed"
  oldStatus?: GameListType
  newStatus?: GameListType
  updatedAt: string
  changes?: {
    rating?: { old?: number; new?: number }
    hoursPlayed?: { old?: number; new?: number }
    review?: { old?: string; new?: string }
  }
}

interface UserStats {
  totalGames: number
  totalHours: number
  averageRating: number
  statusCounts: Record<GameListType, number>
  totalRatedGames: number
  memberSince: string
  lastActive: string
  recentUpdates: RecentUpdate[]
}

interface UserProfile {
  username: string
  email?: string
  image?: string
  bio?: string
  joinedAt: string
  stats: UserStats
}

interface ProfilePageProps {
  params: {
    userName: string
  }
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-10 bg-gray-300 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "text-blue-600",
  bgColor = "bg-blue-50",
}: {
  icon: any
  title: string
  value: string | number
  subtitle?: string
  color?: string
  bgColor?: string
}) {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

function RecentActivity({ updates }: { updates: RecentUpdate[] }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    )

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getActionText = (update: RecentUpdate) => {
    switch (update.action) {
      case "added":
        return "Added to library"
      case "status_changed":
        if (update.oldStatus && update.newStatus) {
          const oldConfig = STATUS_CONFIG[update.oldStatus]
          const newConfig = STATUS_CONFIG[update.newStatus]
          return `Moved from ${oldConfig.label} to ${newConfig.label}`
        }
        return "Status updated"
      case "updated":
        const changes = []
        if (update.changes?.rating) changes.push("rating")
        if (update.changes?.hoursPlayed) changes.push("hours")
        if (update.changes?.review) changes.push("review")
        return changes.length > 0 ? `Updated ${changes.join(", ")}` : "Updated"
      default:
        return "Updated"
    }
  }

  const getActionIcon = (update: RecentUpdate) => {
    switch (update.action) {
      case "added":
        return <GamepadIcon className="w-4 h-4 text-green-500" />
      case "status_changed":
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      default:
        return <Edit3 className="w-4 h-4 text-orange-500" />
    }
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {updates.map((update) => (
        <div
          key={update.id}
          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-shrink-0 mt-1">{getActionIcon(update)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {update.gameTitle}
            </p>
            <p className="text-xs text-gray-600">{getActionText(update)}</p>
            {update.changes && (
              <div className="mt-1 space-y-1">
                {update.changes.rating && (
                  <p className="text-xs text-gray-500">
                    Rating: {update.changes.rating.old || "None"} →{" "}
                    {update.changes.rating.new}/10
                  </p>
                )}
                {update.changes.hoursPlayed && (
                  <p className="text-xs text-gray-500">
                    Hours: {update.changes.hoursPlayed.old || 0} →{" "}
                    {update.changes.hoursPlayed.new}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 text-xs text-gray-400">
            {formatDate(update.updatedAt)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userName } = params
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwnProfile = session?.user?.username === userName

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/profile/${encodeURIComponent(userName)}`
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found")
          }
          const errorData = await response.json()
          throw new Error(errorData.error?.message || "Failed to fetch profile")
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userName])

  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-gray-500">No profile data available</p>
      </div>
    )
  }

  const formatMemberSince = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDays = (hours: number) => {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (days === 0) return `${hours}h`
    if (remainingHours === 0) return `${days}d`
    return `${days}d ${remainingHours}h`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-20"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col items-center -mt-12">
                  <div className="w-24 h-24 bg-white rounded-full p-2 shadow-lg">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.username}
                        width={88}
                        height={88}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mt-4">
                    {profile.username}
                  </h1>
                  <p className="text-gray-600">
                    Member since {formatMemberSince(profile.joinedAt)}
                  </p>

                  {profile.bio && (
                    <p className="text-gray-700 text-center mt-3 text-sm leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  <div className="mt-6 w-full">
                    <Link
                      href={`/gameslist/${userName}`}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <GamepadIcon className="w-4 h-4" />
                      <span>View Game Library</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  {isOwnProfile && (
                    <Link
                      href="/profile/edit"
                      className="mt-3 w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>Gaming Statistics</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={GamepadIcon}
                  title="Total Games"
                  value={profile.stats.totalGames}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                />
                <StatCard
                  icon={Clock}
                  title="Time Played"
                  value={formatDays(profile.stats.totalHours)}
                  subtitle={`${profile.stats.totalHours} hours`}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <StatCard
                  icon={Star}
                  title="Average Rating"
                  value={
                    profile.stats.averageRating > 0
                      ? `${profile.stats.averageRating}/10`
                      : "N/A"
                  }
                  subtitle={
                    profile.stats.totalRatedGames > 0
                      ? `${profile.stats.totalRatedGames} rated`
                      : "No ratings"
                  }
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
                />
                <StatCard
                  icon={Calendar}
                  title="Member Since"
                  value={new Date(profile.joinedAt).getFullYear()}
                  subtitle={formatMemberSince(profile.joinedAt)}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Library Breakdown</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(STATUS_CONFIG).map(([statusValue, config]) => {
                  const count = profile.stats.statusCounts[config.value] || 0
                  const percentage =
                    profile.stats.totalGames > 0
                      ? Math.round((count / profile.stats.totalGames) * 100)
                      : 0

                  return (
                    <Link
                      key={statusValue}
                      href={`/gameslist/${userName}?status=${statusValue}`}
                      className={`${config.bgLight} ${config.borderColor} border-2 rounded-lg p-4 hover:scale-105 transition-all duration-200 block`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-3 h-3 rounded-full ${config.color}`}
                        ></div>
                        <span className="text-2xl font-bold text-gray-900">
                          {count}
                        </span>
                      </div>
                      <p className={`font-medium ${config.textColor} text-sm`}>
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {percentage}% of library
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>Recent Activity</span>
              </h2>
              <RecentActivity updates={profile.stats.recentUpdates} />
              {profile.stats.recentUpdates.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/gameslist/${userName}`}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center space-x-1"
                  >
                    <span>View full library</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

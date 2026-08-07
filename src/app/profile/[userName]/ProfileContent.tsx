// app/profile/[userName]/ProfileContent.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
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
import ProfileSkeleton from "./ProfileSkeleton"

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

interface ProfileContentProps {
  userName: string
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "text-blue-400",
  bgColor = "bg-blue-500/10",
}: {
  icon: LucideIcon
  title: string
  value: string | number
  subtitle?: string
  color?: string
  bgColor?: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 backdrop-blur-sm transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${bgColor} shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
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
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
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
      case "updated": {
        const changes = []
        if (update.changes?.rating) changes.push("rating")
        if (update.changes?.hoursPlayed) changes.push("hours")
        if (update.changes?.review) changes.push("review")
        return changes.length > 0 ? `Updated ${changes.join(", ")}` : "Updated"
      }
      default:
        return "Updated"
    }
  }

  const getActionIcon = (update: RecentUpdate) => {
    switch (update.action) {
      case "added":
        return <GamepadIcon className="w-4 h-4 text-green-400" />
      case "status_changed":
        return <TrendingUp className="w-4 h-4 text-blue-400" />
      default:
        return <Edit3 className="w-4 h-4 text-orange-400" />
    }
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {updates.map((update) => (
        <div
          key={update.id}
          className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex-shrink-0 mt-1">{getActionIcon(update)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {update.gameTitle}
            </p>
            <p className="text-xs text-gray-400">{getActionText(update)}</p>
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
          <div className="flex-shrink-0 text-xs text-gray-500">
            {formatDate(update.updatedAt)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfileContent({ userName }: ProfileContentProps) {
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
          `/api/profile/${encodeURIComponent(userName)}`,
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
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center px-4">
        <div className="max-w-md mx-auto p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-center">
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
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-20"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col items-center -mt-12">
                  <div className="w-24 h-24 bg-gray-950 rounded-full p-2 shadow-lg">
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
                  <h1 className="text-2xl font-bold text-white mt-4 text-center break-words">
                    {profile.username}
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Member since {formatMemberSince(profile.joinedAt)}
                  </p>

                  {profile.bio && (
                    <p className="text-gray-300 text-center mt-3 text-sm leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  <div className="mt-6 w-full">
                    <Link
                      href={`/gameslist/${userName}`}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <GamepadIcon className="w-4 h-4" />
                      <span>View Game Library</span>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>

                  {isOwnProfile && (
                    <Link
                      href="/profile/edit"
                      className="mt-3 w-full border border-white/10 text-gray-300 px-4 py-3 sm:py-2 rounded-lg hover:bg-white/10 transition-colors font-medium flex items-center justify-center space-x-2"
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
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>Gaming Statistics</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={GamepadIcon}
                  title="Total Games"
                  value={profile.stats.totalGames}
                  color="text-purple-400"
                  bgColor="bg-purple-500/10"
                />
                <StatCard
                  icon={Clock}
                  title="Time Played"
                  value={formatDays(profile.stats.totalHours)}
                  subtitle={`${profile.stats.totalHours} hours`}
                  color="text-blue-400"
                  bgColor="bg-blue-500/10"
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
                  color="text-yellow-400"
                  bgColor="bg-yellow-500/10"
                />
                <StatCard
                  icon={Calendar}
                  title="Member Since"
                  value={new Date(profile.joinedAt).getFullYear()}
                  subtitle={formatMemberSince(profile.joinedAt)}
                  color="text-green-400"
                  bgColor="bg-green-500/10"
                />
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span>Library Breakdown</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <p className="text-xs text-gray-600">
                        {percentage}% of library
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-400" />
                <span>Recent Activity</span>
              </h2>
              <RecentActivity updates={profile.stats.recentUpdates} />
              {profile.stats.recentUpdates.length > 0 && (
                <div className="mt-4 text-center">
                  <Link
                    href={`/gameslist/${userName}`}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-flex items-center space-x-1"
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

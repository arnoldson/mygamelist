// app/gameslist/[userName]/GameListItem.tsx
"use client"

import { useState } from "react"
import {
  Star,
  Clock,
  Calendar,
  MessageSquare,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { GameListType } from "@/types/enums"
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

interface GameListItemProps {
  entry: GameEntry
  canModify: boolean
  onEdit: (entry: GameEntry) => void
  onDelete: (entry: GameEntry) => void
}

export default function GameListItem({
  entry,
  canModify,
  onEdit,
  onDelete,
}: GameListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Check if entry has expandable details
  const hasDetails = entry.review || entry.startedAt || entry.completedAt

  // Handle expand/collapse
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Get status config for this entry
  const statusConfig = STATUS_CONFIG[entry.status]

  return (
    <div
      className="relative group border-l-4"
      style={{
        borderLeftColor:
          statusConfig.color.replace("bg-", "#") === statusConfig.color
            ? statusConfig.color === "bg-green-500"
              ? "#10b981"
              : statusConfig.color === "bg-blue-500"
              ? "#3b82f6"
              : statusConfig.color === "bg-purple-500"
              ? "#8b5cf6"
              : statusConfig.color === "bg-yellow-500"
              ? "#eab308"
              : statusConfig.color === "bg-red-500"
              ? "#ef4444"
              : "#6b7280"
            : statusConfig.color,
      }}
    >
      {/* Main Row */}
      <div className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              {/* Expand/Collapse Button or Spacer */}
              <div className="flex-shrink-0 w-6 flex justify-center">
                {hasDetails ? (
                  <button
                    onClick={toggleExpanded}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={
                      isExpanded ? "Collapse details" : "Expand details"
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-6" />
                )}
              </div>

              {/* Game Title and Status */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {entry.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgLight} ${statusConfig.textColor}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Added {formatDate(entry.addedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center space-x-6 text-sm">
            {/* Rating */}
            {entry.rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-700">
                  {entry.rating}/10
                </span>
              </div>
            )}

            {/* Hours */}
            {entry.hoursPlayed !== undefined && entry.hoursPlayed > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{entry.hoursPlayed}h</span>
              </div>
            )}

            {/* Completed Date */}
            {entry.completedAt && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  {formatDate(entry.completedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons (only show for owner) */}
          {canModify && (
            <div className="flex items-center space-x-1 ml-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(entry)
                }}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Edit game"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(entry)
                }}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Delete game"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && hasDetails && (
        <div className="px-4 pb-4 bg-gray-50 border-t">
          <div className="ml-6 space-y-3">
            {/* Dates */}
            {(entry.startedAt || entry.completedAt) && (
              <div className="flex items-center space-x-6 text-sm">
                {entry.startedAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">
                      Started: {formatDate(entry.startedAt)}
                    </span>
                  </div>
                )}
                {entry.completedAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">
                      Completed: {formatDate(entry.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Review */}
            {entry.review && (
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {entry.review}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

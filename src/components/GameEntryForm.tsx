// components/GameEntryForm.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import {
  X,
  Save,
  Plus,
  Star,
  Calendar,
  Clock,
  MessageSquare,
  Gamepad2,
  AlertCircle,
} from "lucide-react"
import { GameListType } from "@/types/enums"

interface BaseGameEntry {
  rawgGameId: number
  title: string
  status: GameListType
  rating?: number
  review?: string
  hoursPlayed?: number
  startedAt?: string
  completedAt?: string
}

interface ExistingGameEntry extends BaseGameEntry {
  id: string
  addedAt: string
  updatedAt: string
}

interface NewGameEntry extends BaseGameEntry {
  id?: never
  addedAt?: never
  updatedAt?: never
}

type GameEntry = ExistingGameEntry | NewGameEntry

interface GameEntryFormProps {
  gameEntry: GameEntry
  // Modal-specific props
  isModal?: boolean
  onClose?: () => void
  // Callback props
  onSave?: (updatedEntry: Partial<GameEntry>) => Promise<void>
  onCreate?: (newEntry: Omit<BaseGameEntry, "id">) => Promise<void>
  onCancel?: () => void
  // UI props
  showTitle?: boolean
  submitButtonText?: string
  createButtonText?: string
}

interface FormData {
  status: GameListType
  rating: number
  review: string
  hoursPlayed: number
  startedAt: string
  completedAt: string
}

interface FormErrors {
  rating?: string
  hoursPlayed?: string
  completedAt?: string
  submit?: string
}

// Status configuration (dark theme: translucent tints on a near-black surface)
const STATUS_CONFIG: Record<
  GameListType,
  {
    label: string
    dot: string
    textColor: string
    bgTint: string
    borderColor: string
  }
> = {
  [GameListType.PLAYING]: {
    label: "Currently Playing",
    dot: "bg-green-400",
    textColor: "text-green-400",
    bgTint: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  [GameListType.PLAN_TO_PLAY]: {
    label: "Plan to Play",
    dot: "bg-blue-400",
    textColor: "text-blue-400",
    bgTint: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  [GameListType.COMPLETED]: {
    label: "Completed",
    dot: "bg-purple-400",
    textColor: "text-purple-400",
    bgTint: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  [GameListType.ON_HOLD]: {
    label: "On Hold",
    dot: "bg-yellow-400",
    textColor: "text-yellow-400",
    bgTint: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  [GameListType.DROPPED]: {
    label: "Dropped",
    dot: "bg-red-400",
    textColor: "text-red-400",
    bgTint: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
} as const

const GameEntryForm: React.FC<GameEntryFormProps> = ({
  gameEntry,
  isModal = false,
  onClose,
  onSave,
  onCreate,
  onCancel,
  showTitle = true,
  submitButtonText,
  createButtonText = "Add to Library",
}) => {
  // Determine if this is edit or create mode
  const isEditMode: boolean = "id" in gameEntry && !!gameEntry.id
  const defaultSubmitText = isEditMode ? "Save Changes" : createButtonText

  // Form state
  const [formData, setFormData] = useState<FormData>({
    status: gameEntry.status,
    rating: gameEntry.rating || 0,
    review: gameEntry.review || "",
    hoursPlayed: gameEntry.hoursPlayed || 0,
    startedAt: gameEntry.startedAt ? gameEntry.startedAt.split("T")[0] : "",
    completedAt: gameEntry.completedAt
      ? gameEntry.completedAt.split("T")[0]
      : "",
  })

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasChanges, setHasChanges] = useState<boolean>(false)

  // Track changes
  useEffect(() => {
    const hasFormChanges: boolean =
      formData.status !== gameEntry.status ||
      formData.rating !== (gameEntry.rating || 0) ||
      formData.review !== (gameEntry.review || "") ||
      formData.hoursPlayed !== (gameEntry.hoursPlayed || 0) ||
      formData.startedAt !==
        (gameEntry.startedAt ? gameEntry.startedAt.split("T")[0] : "") ||
      formData.completedAt !==
        (gameEntry.completedAt ? gameEntry.completedAt.split("T")[0] : "")

    setHasChanges(hasFormChanges || !isEditMode) // Always show changes for new entries
  }, [formData, gameEntry, isEditMode])

  // Handle input changes
  const handleInputChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field-specific errors
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (formData.rating < 0 || formData.rating > 10) {
      newErrors.rating = "Rating must be between 0 and 10"
    }

    if (formData.hoursPlayed < 0) {
      newErrors.hoursPlayed = "Hours played cannot be negative"
    }

    if (formData.startedAt && formData.completedAt) {
      const startDate = new Date(formData.startedAt)
      const completedDate = new Date(formData.completedAt)
      if (completedDate < startDate) {
        newErrors.completedAt = "Completion date cannot be before start date"
      }
    }

    // Require completion date for completed games
    if (formData.status === GameListType.COMPLETED && !formData.completedAt) {
      newErrors.completedAt = "Completion date is required for completed games"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) return
    if (isEditMode && !hasChanges) return

    setIsSubmitting(true)

    try {
      const entryData = {
        rawgGameId: gameEntry.rawgGameId,
        title: gameEntry.title,
        status: formData.status,
        rating: formData.rating === 0 ? undefined : formData.rating,
        review: formData.review.trim() || undefined,
        hoursPlayed:
          formData.hoursPlayed === 0 ? undefined : formData.hoursPlayed,
        startedAt: formData.startedAt || undefined,
        completedAt: formData.completedAt || undefined,
      }

      if (isEditMode) {
        await onSave?.(entryData)
      } else {
        await onCreate?.(entryData)
      }

      if (isModal) {
        onClose?.()
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "saving" : "creating"} game entry:`,
        error,
      )
      setErrors({
        submit: `Failed to ${
          isEditMode ? "save changes" : "add game"
        }. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel

  const handleCancel = useCallback((): void => {
    if (hasChanges) {
      const message = isEditMode
        ? "You have unsaved changes. Are you sure you want to cancel?"
        : "Are you sure you want to cancel adding this game?"
      const confirmDiscard = window.confirm(message)
      if (!confirmDiscard) return
    }

    if (isModal) {
      onClose?.()
    } else {
      onCancel?.()
    }
  }, [hasChanges, isEditMode, isModal, onClose, onCancel])

  // Keyboard handling for modal
  useEffect(() => {
    if (isModal) {
      const handleEscape = (e: KeyboardEvent): void => {
        if (e.key === "Escape") handleCancel()
      }
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isModal, hasChanges, handleCancel])

  // Render star rating input
  const renderStarRating = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Rating (0-10)
      </label>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {[...Array(10)].map((_, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => handleInputChange("rating", i + 1)}
              className={`w-6 h-6 transition-colors ${
                i < formData.rating
                  ? "text-yellow-400 hover:text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]"
                  : "text-gray-600 hover:text-gray-500"
              }`}
            >
              <Star className="w-full h-full fill-current" />
            </button>
          ))}
        </div>
        <span className="text-sm font-medium text-gray-300">
          {formData.rating}/10
        </span>
        {formData.rating > 0 && (
          <button
            type="button"
            onClick={() => handleInputChange("rating", 0)}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Clear
          </button>
        )}
      </div>
      {errors.rating && (
        <p className="text-sm text-red-400 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors.rating}
        </p>
      )}
    </div>
  )

  // Form content
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Game Title Display */}
      {showTitle && (
        <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
          <Gamepad2 className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">
              {gameEntry.title}
            </h3>
            {!isEditMode && (
              <p className="text-sm text-gray-400">Adding to your library</p>
            )}
          </div>
        </div>
      )}

      {/* Status Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Status
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const statusValue = parseInt(status) as GameListType
            const isSelected = formData.status === statusValue

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleInputChange("status", statusValue)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? `${config.bgTint} ${config.borderColor} ${config.textColor}`
                    : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.dot}`}></div>
                  <span className="font-medium">{config.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Rating */}
      {renderStarRating()}

      {/* Hours Played */}
      <div className="space-y-2">
        <label
          htmlFor="hoursPlayed"
          className="block text-sm font-medium text-gray-300"
        >
          Hours Played
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="number"
            id="hoursPlayed"
            min="0"
            step="0.5"
            value={formData.hoursPlayed}
            onChange={(e) =>
              handleInputChange("hoursPlayed", parseFloat(e.target.value) || 0)
            }
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="0"
          />
        </div>
        {errors.hoursPlayed && (
          <p className="text-sm text-red-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.hoursPlayed}
          </p>
        )}
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <label
          htmlFor="startedAt"
          className="block text-sm font-medium text-gray-300"
        >
          Started Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="date"
            id="startedAt"
            value={formData.startedAt}
            onChange={(e) => handleInputChange("startedAt", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Completion Date */}
      <div className="space-y-2">
        <label
          htmlFor="completedAt"
          className="block text-sm font-medium text-gray-300"
        >
          Completion Date
          {formData.status === GameListType.COMPLETED && (
            <span className="text-red-400 ml-1">*</span>
          )}
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="date"
            id="completedAt"
            value={formData.completedAt}
            onChange={(e) => handleInputChange("completedAt", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none [color-scheme:dark]"
          />
        </div>
        {errors.completedAt && (
          <p className="text-sm text-red-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.completedAt}
          </p>
        )}
      </div>

      {/* Review */}
      <div className="space-y-2">
        <label
          htmlFor="review"
          className="block text-sm font-medium text-gray-300"
        >
          Review / Notes
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <textarea
            id="review"
            rows={4}
            maxLength={1000}
            value={formData.review}
            onChange={(e) => handleInputChange("review", e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            placeholder="Write your thoughts about this game..."
          />
        </div>
        <p className="text-xs text-gray-500">
          {formData.review.length}/1000 characters
        </p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errors.submit}
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (isEditMode && !hasChanges)}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 border border-transparent rounded-md hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{isEditMode ? "Saving..." : "Adding..."}</span>
            </>
          ) : (
            <>
              {isEditMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{submitButtonText || defaultSubmitText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  )

  // Determine modal title and page title
  const modalTitle = isEditMode ? "Edit Game Entry" : "Add Game to Library"
  const pageTitle = isEditMode ? "Edit Game Entry" : "Add New Game"

  // Return as modal
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-white/10 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">{modalTitle}</h2>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">{formContent}</div>
        </div>
      </div>
    )
  }

  // Return as full page
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-white mb-6">{pageTitle}</h1>
          {formContent}
        </div>
      </div>
    </div>
  )
}

export default GameEntryForm

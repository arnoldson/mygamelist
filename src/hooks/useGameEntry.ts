// hooks/useGameEntry.ts
"use client"

import { GameListType } from "@/types/enums"
import { useState } from "react"

interface GameEntryData {
  rawgGameId: number
  title: string
  status: GameListType
  rating?: number
  review?: string
  hoursPlayed?: number
  startedAt?: string
  completedAt?: string
}

export const useGameEntry = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateEntry = async (entryId: string, data: Partial<GameEntryData>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gameslist/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to update entry")
      }

      return await response.json()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createEntry = async (data: GameEntryData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/gameslist/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to create entry")
      }

      return await response.json()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gameslist/entries/${entryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to delete entry")
      }

      return await response.json()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateEntry,
    createEntry,
    deleteEntry,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}

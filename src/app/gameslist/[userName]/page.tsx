// app/gameslist/[userName]/page.tsx
import { Suspense } from "react"
import { notFound } from "next/navigation"
import GamesListSkeleton from "./GamesListSkeleton"
import GamesListContent from "./GamesListContent"
import { GameListType } from "@/types/enums"

interface PageProps {
  params: {
    userName: string
  }
  searchParams: {
    status?: string
  }
}

// Status mapping for display using the enum
export const STATUS_CONFIG = {
  [GameListType.PLAYING]: {
    label: "Currently Playing",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
    type: "PLAYING",
    value: GameListType.PLAYING,
  },
  [GameListType.PLAN_TO_PLAY]: {
    label: "Plan to Play",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    type: "PLAN_TO_PLAY",
    value: GameListType.PLAN_TO_PLAY,
  },
  [GameListType.COMPLETED]: {
    label: "Completed",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgLight: "bg-purple-50",
    type: "COMPLETED",
    value: GameListType.COMPLETED,
  },
  [GameListType.ON_HOLD]: {
    label: "On Hold",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgLight: "bg-yellow-50",
    type: "ON_HOLD",
    value: GameListType.ON_HOLD,
  },
  [GameListType.DROPPED]: {
    label: "Dropped",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgLight: "bg-red-50",
    type: "DROPPED",
    value: GameListType.DROPPED,
  },
} as const

// Helper to validate status parameter
const isValidStatus = (
  status: string
): status is keyof typeof STATUS_CONFIG => {
  const numStatus = parseInt(status)
  return Object.values(GameListType).includes(numStatus)
}

export default async function GamesListPage({
  params,
  searchParams,
}: PageProps) {
  const { userName } = await params
  const { status } = await searchParams

  // Validate status parameter if provided
  if (status && !isValidStatus(status)) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<GamesListSkeleton />}>
          <GamesListContent userName={userName} status={status} />
        </Suspense>
      </div>
    </div>
  )
}

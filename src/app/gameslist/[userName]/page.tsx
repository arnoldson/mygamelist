// app/gameslist/[userName]/page.tsx
import { Suspense } from "react"
import { notFound } from "next/navigation"
import GamesListSkeleton from "./GamesListSkeleton"
import GamesListContent from "./GamesListContent"

interface PageProps {
  params: {
    userName: string
  }
  searchParams: {
    status?: string
  }
}

// Status mapping for display
export const STATUS_CONFIG = {
  "1": {
    label: "Currently Playing",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgLight: "bg-green-50",
    type: "PLAYING",
  },
  "2": {
    label: "Plan to Play",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50",
    type: "PLAN_TO_PLAY",
  },
  "3": {
    label: "Completed",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgLight: "bg-purple-50",
    type: "COMPLETED",
  },
  "4": {
    label: "On Hold",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgLight: "bg-yellow-50",
    type: "ON_HOLD",
  },
  "5": {
    label: "Dropped",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgLight: "bg-red-50",
    type: "DROPPED",
  },
} as const

export default async function GamesListPage({
  params,
  searchParams,
}: PageProps) {
  const { userName } = await params
  const { status } = await searchParams

  // Validate status parameter if provided
  if (status && !STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]) {
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

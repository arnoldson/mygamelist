// app/gameslist/[userName]/page.tsx
import { Suspense } from "react"
import { notFound } from "next/navigation"
import GamesListSkeleton from "./GamesListSkeleton"
import GamesListContent from "./GamesListContent"
import { GameListType } from "@/types/enums"

interface PageProps {
  params: Promise<{
    userName: string
  }>
  searchParams: Promise<{
    status?: string
  }>
}

// Helper to validate status parameter
const isValidStatus = (status: string): boolean => {
  const numStatus = parseInt(status)
  return (
    !isNaN(numStatus) &&
    Object.values(GameListType).includes(numStatus as GameListType)
  )
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

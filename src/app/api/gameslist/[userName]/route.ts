// app/api/gameslist/[userName]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GameListType } from "@/types/enums"

const prisma = new PrismaClient()

// Reverse mapping from enum values to names for validation
const STATUS_MAP = {
  1: GameListType.PLAYING,
  2: GameListType.PLAN_TO_PLAY,
  3: GameListType.COMPLETED,
  4: GameListType.ON_HOLD,
  5: GameListType.DROPPED,
} as const

type StatusKey = keyof typeof STATUS_MAP

interface RouteParams {
  params: {
    userName: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userName } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Validate userName
    if (!userName || userName.trim() === "") {
      return NextResponse.json(
        {
          error: {
            message: "Username is required",
            code: "INVALID_USERNAME",
          },
        },
        { status: 400 }
      )
    }

    // Validate status parameter if provided
    if (status && !STATUS_MAP[parseInt(status) as StatusKey]) {
      return NextResponse.json(
        {
          error: {
            message:
              "Invalid status parameter. Must be 1-5 or omitted for all lists",
            code: "INVALID_STATUS",
            details: {
              validStatuses: {
                "1": "PLAYING",
                "2": "PLAN_TO_PLAY",
                "3": "COMPLETED",
                "4": "ON_HOLD",
                "5": "DROPPED",
              },
            },
          },
        },
        { status: 400 }
      )
    }

    const gameListType = status
      ? STATUS_MAP[parseInt(status) as StatusKey]
      : null

    // Find user by username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: userName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      )
    }

    // Define the game entry selection
    const gameEntrySelect = {
      id: true,
      rawgGameId: true,
      title: true,
      status: true,
      rating: true,
      review: true,
      hoursPlayed: true,
      startedAt: true,
      completedAt: true,
      addedAt: true,
      updatedAt: true,
    }

    // Build where clause for game entries with proper typing
    const gameEntryWhere: Prisma.GameEntryWhereInput = {
      userId: user.id,
    }

    // Add status filter if specific status requested
    if (gameListType) {
      gameEntryWhere.status = gameListType
    }

    // Fetch game entries with optional status filter
    const gameEntries = await prisma.gameEntry.findMany({
      where: gameEntryWhere,
      select: gameEntrySelect,
      orderBy: [{ addedAt: "desc" }, { updatedAt: "desc" }],
    })

    // Calculate complete metadata for ALL games (regardless of status filter)
    const allUserEntries = status
      ? await prisma.gameEntry.findMany({
          where: { userId: user.id },
          select: { rating: true, hoursPlayed: true, status: true },
        })
      : gameEntries.map((entry) => ({
          rating: entry.rating,
          hoursPlayed: entry.hoursPlayed,
          status: entry.status,
        }))

    const totalGames = allUserEntries.length
    const totalHours = allUserEntries.reduce(
      (sum, entry) => sum + (entry.hoursPlayed || 0),
      0
    )
    const ratingsWithValues = allUserEntries
      .map((entry) => entry.rating)
      .filter((rating): rating is number => rating !== null)

    const averageRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) /
          ratingsWithValues.length
        : null

    // Calculate counts for each status (always include all statuses)
    const statusOrder = [
      GameListType.PLAYING,
      GameListType.PLAN_TO_PLAY,
      GameListType.COMPLETED,
      GameListType.ON_HOLD,
      GameListType.DROPPED,
    ]

    const listCounts = statusOrder.reduce((acc, statusType) => {
      acc[statusType] = allUserEntries.filter(
        (entry) => entry.status === statusType
      ).length
      return acc
    }, {} as Record<GameListType, number>)

    // Build complete metadata object (used in both single and all list responses)
    const completeMetadata = {
      totalGames,
      totalHours,
      averageRating: averageRating
        ? parseFloat(averageRating.toFixed(1))
        : null,
      listCounts,
    }

    // Handle single status request
    if (status) {
      return NextResponse.json({
        user: {
          username: user.username,
          image: user.image,
        },
        gameList: {
          type: gameListType,
          status: gameListType, // Using enum value directly (1, 2, 3, 4, 5)
          gameEntries: gameEntries,
        },
        meta: completeMetadata,
      })
    } else {
      // Handle all lists request - group entries by status
      const groupedEntries = statusOrder.map((statusType) => {
        const entriesForStatus = gameEntries.filter(
          (entry) => entry.status === statusType
        )

        return {
          type: statusType,
          status: statusType, // Using enum value directly (1, 2, 3, 4, 5)
          gameEntries: entriesForStatus,
        }
      })

      return NextResponse.json({
        user: {
          username: user.username,
          image: user.image,
        },
        gameLists: groupedEntries,
        meta: completeMetadata,
      })
    }
  } catch (error) {
    console.error("Error fetching games list:", error)
    return NextResponse.json(
      {
        error: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userName } = await params
    const body = await request.json()
    const { entryId } = body

    // Validate userName
    if (!userName || userName.trim() === "") {
      return NextResponse.json(
        {
          error: {
            message: "Username is required",
            code: "INVALID_USERNAME",
          },
        },
        { status: 400 }
      )
    }

    // Validate entryId
    if (!entryId || entryId.trim() === "") {
      return NextResponse.json(
        {
          error: {
            message: "Game entry ID is required",
            code: "INVALID_ENTRY_ID",
          },
        },
        { status: 400 }
      )
    }

    // Check authentication using NextAuth session
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: {
            message:
              "Authentication required. Please sign in to delete game entries.",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      )
    }

    // Find the authenticated user
    const authenticatedUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true },
    })

    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: {
            message: "Authenticated user not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      )
    }

    // Verify the authenticated user matches the username in URL
    if (authenticatedUser.username?.toLowerCase() !== userName.toLowerCase()) {
      return NextResponse.json(
        {
          error: {
            message:
              "Access denied. You can only delete games from your own list.",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      )
    }

    // Find the game entry and verify ownership
    const gameEntry = await prisma.gameEntry.findFirst({
      where: {
        id: entryId,
        userId: authenticatedUser.id,
      },
      select: {
        id: true,
        title: true,
        rawgGameId: true,
        status: true,
        rating: true,
        hoursPlayed: true,
      },
    })

    if (!gameEntry) {
      return NextResponse.json(
        {
          error: {
            message:
              "Game entry not found or you don't have permission to delete it",
            code: "ENTRY_NOT_FOUND",
          },
        },
        { status: 404 }
      )
    }

    // Store info for response before deletion
    const deletedEntryInfo = {
      id: gameEntry.id,
      title: gameEntry.title,
      rawgGameId: gameEntry.rawgGameId,
      status: gameEntry.status,
      rating: gameEntry.rating,
      hoursPlayed: gameEntry.hoursPlayed,
    }

    // Delete the game entry
    await prisma.gameEntry.delete({
      where: { id: entryId },
    })

    // Return success response with deleted entry info
    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted "${deletedEntryInfo.title}" from your ${deletedEntryInfo.status} list`,
        deletedEntry: deletedEntryInfo,
        user: {
          username: authenticatedUser.username,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("Error deleting game entry:", error)

    // Handle specific Prisma errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          error: {
            message: "Game entry not found",
            code: "ENTRY_NOT_FOUND",
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: "Internal server error",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    )
  }
}

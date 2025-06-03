// app/api/gameslist/[userName]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Map status numbers to GameListType enum
const STATUS_MAP = {
  "1": "PLAYING",
  "2": "PLAN_TO_PLAY",
  "3": "COMPLETED",
  "4": "ON_HOLD",
  "5": "DROPPED",
} as const

type StatusKey = keyof typeof STATUS_MAP
type GameListType = (typeof STATUS_MAP)[StatusKey]

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
    if (status && !STATUS_MAP[status as StatusKey]) {
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

    const gameListType = status ? STATUS_MAP[status as StatusKey] : null

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

    // Define the game entry selection with title included
    const gameEntrySelect = {
      id: true,
      rawgGameId: true,
      title: true,
      rating: true,
      review: true,
      hoursPlayed: true,
      startedAt: true,
      completedAt: true,
      addedAt: true,
      updatedAt: true,
    }

    // ALWAYS fetch ALL game lists to calculate complete metadata
    const allGameLists = await prisma.gameList.findMany({
      where: {
        userId: user.id,
      },
      include: {
        gameEntries: {
          orderBy: [{ addedAt: "desc" }, { updatedAt: "desc" }],
          select: gameEntrySelect,
        },
      },
      orderBy: {
        type: "asc",
      },
    })

    // Calculate complete metadata for ALL games
    const allEntries = allGameLists.flatMap((list) => list.gameEntries)
    const totalGames = allEntries.length
    const totalHours = allEntries.reduce(
      (sum, entry) => sum + (entry.hoursPlayed || 0),
      0
    )
    const ratingsWithValues = allEntries
      .map((entry) => entry.rating)
      .filter((rating): rating is number => rating !== null)

    const averageRating =
      ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) /
          ratingsWithValues.length
        : null

    // Create a map of all game lists for easy access
    const gameListsMap = new Map(allGameLists.map((list) => [list.type, list]))

    // Calculate counts for each status (always include all statuses)
    const statusOrder: GameListType[] = [
      "PLAYING",
      "PLAN_TO_PLAY",
      "COMPLETED",
      "ON_HOLD",
      "DROPPED",
    ]

    const listCounts = statusOrder.reduce((acc, listType) => {
      const gameList = gameListsMap.get(listType)
      acc[listType] = gameList?.gameEntries.length || 0
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
      const requestedGameList = gameListsMap.get(gameListType!)

      // If no game list exists for this type, return empty list with complete metadata
      if (!requestedGameList) {
        return NextResponse.json({
          user: {
            username: user.username,
            image: user.image,
          },
          gameList: {
            type: gameListType,
            status: parseInt(status),
            gameEntries: [],
          },
          meta: completeMetadata,
        })
      }

      return NextResponse.json({
        user: {
          username: user.username,
          image: user.image,
        },
        gameList: {
          id: requestedGameList.id,
          type: requestedGameList.type,
          status: parseInt(status),
          gameEntries: requestedGameList.gameEntries,
        },
        meta: completeMetadata,
      })
    } else {
      // Handle all lists request
      // Build ordered game lists with status numbers (ensure all statuses are represented)
      const orderedGameLists = statusOrder.map((type) => {
        const gameList = gameListsMap.get(type)
        const statusNumber = Object.keys(STATUS_MAP).find(
          (key) => STATUS_MAP[key as StatusKey] === type
        )

        return {
          id: gameList?.id || null,
          type: type,
          status: parseInt(statusNumber!),
          gameEntries: gameList?.gameEntries || [],
        }
      })

      return NextResponse.json({
        user: {
          username: user.username,
          image: user.image,
        },
        gameLists: orderedGameLists,
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

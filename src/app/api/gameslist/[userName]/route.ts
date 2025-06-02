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

    // Get the game list(s) for the user
    if (status) {
      // Single list requested
      const gameList = await prisma.gameList.findUnique({
        where: {
          userId_type: {
            userId: user.id,
            type: gameListType!,
          },
        },
        include: {
          gameEntries: {
            orderBy: [{ addedAt: "desc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              rawgGameId: true,
              rating: true,
              review: true,
              hoursPlayed: true,
              startedAt: true,
              completedAt: true,
              addedAt: true,
              updatedAt: true,
            },
          },
        },
      })

      // If no game list exists for this type, return empty list
      if (!gameList) {
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
          meta: {
            totalGames: 0,
            totalHours: 0,
            averageRating: null,
          },
        })
      }

      // Calculate metadata for single list
      const totalGames = gameList.gameEntries.length
      const totalHours = gameList.gameEntries.reduce(
        (sum, entry) => sum + (entry.hoursPlayed || 0),
        0
      )
      const ratingsWithValues = gameList.gameEntries
        .map((entry) => entry.rating)
        .filter((rating): rating is number => rating !== null)

      const averageRating =
        ratingsWithValues.length > 0
          ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) /
            ratingsWithValues.length
          : null

      return NextResponse.json({
        user: {
          name: user.name,
          image: user.image,
        },
        gameList: {
          id: gameList.id,
          type: gameList.type,
          status: parseInt(status),
          gameEntries: gameList.gameEntries,
        },
        meta: {
          totalGames,
          totalHours,
          averageRating: averageRating
            ? parseFloat(averageRating.toFixed(1))
            : null,
        },
      })
    } else {
      // All lists requested - sorted by status
      const allGameLists = await prisma.gameList.findMany({
        where: {
          userId: user.id,
        },
        include: {
          gameEntries: {
            orderBy: [{ addedAt: "desc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              rawgGameId: true,
              rating: true,
              review: true,
              hoursPlayed: true,
              startedAt: true,
              completedAt: true,
              addedAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          type: "asc", // This will sort: COMPLETED, DROPPED, ON_HOLD, PLAN_TO_PLAY, PLAYING
        },
      })

      // Create a map to ensure all status types are represented
      const statusOrder = [
        "PLAYING",
        "PLAN_TO_PLAY",
        "COMPLETED",
        "ON_HOLD",
        "DROPPED",
      ] as const
      const gameListsMap = new Map(
        allGameLists.map((list) => [list.type, list])
      )

      // Build ordered game lists with status numbers
      const orderedGameLists = statusOrder.map((type, index) => {
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

      // Calculate overall metadata
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

      // Calculate per-list counts
      const listCounts = orderedGameLists.reduce((acc, list) => {
        acc[list.type] = list.gameEntries.length
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        user: {
          name: user.name,
          image: user.image,
        },
        gameLists: orderedGameLists,
        meta: {
          totalGames,
          totalHours,
          averageRating: averageRating
            ? parseFloat(averageRating.toFixed(1))
            : null,
          listCounts,
        },
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

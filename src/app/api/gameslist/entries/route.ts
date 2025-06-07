// app/api/gameslist/entries/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GameListType } from "@/types/enums"

const prisma = new PrismaClient()

// Helper to get status label from enum value
const getStatusLabel = (status: GameListType): string => {
  switch (status) {
    case GameListType.PLAYING:
      return "currently playing"
    case GameListType.PLAN_TO_PLAY:
      return "plan to play"
    case GameListType.COMPLETED:
      return "completed"
    case GameListType.ON_HOLD:
      return "on hold"
    case GameListType.DROPPED:
      return "dropped"
    default:
      return "unknown"
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication using NextAuth session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: {
            message:
              "Authentication required. Please sign in to add game entries.",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      )
    }

    // Find the authenticated user
    const authenticatedUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, email: true },
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

    // Parse and validate request body
    const body = await request.json()

    // Required fields validation
    if (
      !body.title ||
      typeof body.title !== "string" ||
      body.title.trim() === ""
    ) {
      return NextResponse.json(
        {
          error: {
            message: "Game title is required",
            code: "MISSING_TITLE",
          },
        },
        { status: 400 }
      )
    }

    if (!body.rawgGameId || typeof body.rawgGameId !== "number") {
      return NextResponse.json(
        {
          error: {
            message: "Valid RAWG game ID is required",
            code: "MISSING_RAWG_GAME_ID",
          },
        },
        { status: 400 }
      )
    }

    // Check if user already has this game in their list
    const existingEntry = await prisma.gameEntry.findFirst({
      where: {
        userId: authenticatedUser.id,
        rawgGameId: body.rawgGameId,
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        {
          error: {
            message: "This game is already in your list",
            code: "GAME_ALREADY_EXISTS",
          },
        },
        { status: 409 }
      )
    }

    // Prepare data for creation
    const gameData: any = {
      title: body.title.trim(),
      rawgGameId: body.rawgGameId,
      userId: authenticatedUser.id,
      status: GameListType.PLAN_TO_PLAY, // Default status
    }

    // Optional fields validation and assignment
    if ("status" in body) {
      const statusValue = parseInt(body.status)
      const validStatuses = Object.values(GameListType).filter(
        (value) => typeof value === "number"
      )

      if (isNaN(statusValue) || !validStatuses.includes(statusValue)) {
        return NextResponse.json(
          {
            error: {
              message: `Invalid status. Valid values are: ${validStatuses.join(
                ", "
              )}`,
              code: "INVALID_STATUS",
            },
          },
          { status: 400 }
        )
      }
      gameData.status = statusValue
    }

    if ("rating" in body) {
      if (
        typeof body.rating !== "number" ||
        isNaN(body.rating) ||
        body.rating < 0
      ) {
        return NextResponse.json(
          {
            error: {
              message: "Invalid value for rating",
              code: "INVALID_RATING",
            },
          },
          { status: 400 }
        )
      }
      gameData.rating = body.rating
    }

    if ("review" in body) {
      if (typeof body.review !== "string") {
        return NextResponse.json(
          {
            error: {
              message: "Invalid value for review",
              code: "INVALID_REVIEW",
            },
          },
          { status: 400 }
        )
      }
      gameData.review = body.review
    }

    if ("hoursPlayed" in body) {
      if (
        typeof body.hoursPlayed !== "number" ||
        isNaN(body.hoursPlayed) ||
        body.hoursPlayed < 0
      ) {
        return NextResponse.json(
          {
            error: {
              message: "Invalid value for hoursPlayed",
              code: "INVALID_HOURS_PLAYED",
            },
          },
          { status: 400 }
        )
      }
      gameData.hoursPlayed = body.hoursPlayed
    }

    // Helper function to convert date string to ISO DateTime
    function dateStringToISODateTime(dateString: string): string {
      const date = new Date(dateString + "T00:00:00.000Z")
      return date.toISOString()
    }

    // Date field validation
    if ("startedAt" in body) {
      if (body.startedAt !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (
          typeof body.startedAt !== "string" ||
          !dateRegex.test(body.startedAt)
        ) {
          return NextResponse.json(
            {
              error: {
                message:
                  "Invalid date format for startedAt. Use YYYY-MM-DD format.",
                code: "INVALID_DATE_FORMAT",
              },
            },
            { status: 400 }
          )
        }

        const date = new Date(body.startedAt)
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            {
              error: {
                message: "Invalid date for startedAt",
                code: "INVALID_DATE",
              },
            },
            { status: 400 }
          )
        }

        gameData.startedAt = dateStringToISODateTime(body.startedAt)
      } else {
        gameData.startedAt = null
      }
    }

    if ("completedAt" in body) {
      if (body.completedAt !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (
          typeof body.completedAt !== "string" ||
          !dateRegex.test(body.completedAt)
        ) {
          return NextResponse.json(
            {
              error: {
                message:
                  "Invalid date format for completedAt. Use YYYY-MM-DD format.",
                code: "INVALID_DATE_FORMAT",
              },
            },
            { status: 400 }
          )
        }

        const date = new Date(body.completedAt)
        if (isNaN(date.getTime())) {
          return NextResponse.json(
            {
              error: {
                message: "Invalid date for completedAt",
                code: "INVALID_DATE",
              },
            },
            { status: 400 }
          )
        }

        gameData.completedAt = dateStringToISODateTime(body.completedAt)
      } else {
        gameData.completedAt = null
      }
    }

    // Create the game entry
    const newEntry = await prisma.gameEntry.create({
      data: gameData,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `Successfully added "${
          newEntry.title
        }" to your ${getStatusLabel(newEntry.status)} list`,
        gameEntry: {
          id: newEntry.id,
          title: newEntry.title,
          rawgGameId: newEntry.rawgGameId,
          status: newEntry.status,
          statusLabel: getStatusLabel(newEntry.status),
          rating: newEntry.rating,
          hoursPlayed: newEntry.hoursPlayed,
          review: newEntry.review,
          startedAt: newEntry.startedAt,
          completedAt: newEntry.completedAt,
          addedAt: newEntry.addedAt,
        },
        user: {
          username: newEntry.user.username,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating game entry:", error)

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: {
            message: "This game is already in your list",
            code: "GAME_ALREADY_EXISTS",
          },
        },
        { status: 409 }
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

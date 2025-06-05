// app/api/gameslist/entries/[entryId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GameListType } from "@/types/enums"

const prisma = new PrismaClient()

interface RouteParams {
  params: {
    entryId: string
  }
}

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = params

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

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: {
            message:
              "Authentication required. Please sign in to update game entries.",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      )
    }

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

    const gameEntry = await prisma.gameEntry.findFirst({
      where: { id: entryId, userId: authenticatedUser.id },
    })

    if (!gameEntry) {
      return NextResponse.json(
        {
          error: {
            message:
              "Game entry not found or you don't have permission to update it",
            code: "ENTRY_NOT_FOUND",
          },
        },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const allowedFields = [
      "status",
      "rating",
      "review",
      "hoursPlayed",
      "startedAt",
      "completedAt",
    ]
    const updates: any = {}

    // Validation logic
    let hasUpdate = false
    if ("status" in body) {
      // Assuming GameListType is an enum, you may want to check against allowed values
      if (
        typeof body.status !== "string" ||
        !Object.values(GameListType).includes(body.status)
      ) {
        return NextResponse.json(
          {
            error: {
              message: "Invalid value for status",
              code: "INVALID_STATUS",
            },
          },
          { status: 400 }
        )
      }
      updates.status = body.status
      hasUpdate = true
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
      updates.rating = body.rating
      hasUpdate = true
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
      updates.review = body.review
      hasUpdate = true
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
      updates.hoursPlayed = body.hoursPlayed
      hasUpdate = true
    }
    if ("startedAt" in body) {
      if (
        body.startedAt !== null &&
        (typeof body.startedAt !== "string" ||
          isNaN(Date.parse(body.startedAt)))
      ) {
        return NextResponse.json(
          {
            error: {
              message: "Invalid value for startedAt",
              code: "INVALID_STARTED_AT",
            },
          },
          { status: 400 }
        )
      }
      updates.startedAt = body.startedAt
      hasUpdate = true
    }
    if ("completedAt" in body) {
      if (
        body.completedAt !== null &&
        (typeof body.completedAt !== "string" ||
          isNaN(Date.parse(body.completedAt)))
      ) {
        return NextResponse.json(
          {
            error: {
              message: "Invalid value for completedAt",
              code: "INVALID_COMPLETED_AT",
            },
          },
          { status: 400 }
        )
      }
      updates.completedAt = body.completedAt
      hasUpdate = true
    }

    // Require at least one updatable field
    if (!hasUpdate) {
      return NextResponse.json(
        {
          error: {
            message: "At least one updatable field must be provided",
            code: "NO_FIELDS_TO_UPDATE",
          },
        },
        { status: 400 }
      )
    }

    const updatedEntry = await prisma.gameEntry.update({
      where: { id: entryId },
      data: updates,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated game entry "${updatedEntry.title}".`,
        updatedEntry,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating game entry:", error)
    return NextResponse.json(
      { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { entryId } = await params

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

    // Find the game entry and verify ownership (simplified - no GameList join needed)
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
        review: true,
        addedAt: true,
        user: {
          select: {
            username: true,
          },
        },
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
      statusLabel: getStatusLabel(gameEntry.status),
      rating: gameEntry.rating,
      hoursPlayed: gameEntry.hoursPlayed,
      review: gameEntry.review,
      addedAt: gameEntry.addedAt,
    }

    // Delete the game entry
    await prisma.gameEntry.delete({
      where: { id: entryId },
    })

    // Return success response with deleted entry info
    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted "${deletedEntryInfo.title}" from your ${deletedEntryInfo.statusLabel} list`,
        deletedEntry: deletedEntryInfo,
        user: {
          username: gameEntry.user.username,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error deleting game entry:", error)
    console.log("Error details:", error)

    // Handle specific Prisma errors
    if (error.code === "P2025") {
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

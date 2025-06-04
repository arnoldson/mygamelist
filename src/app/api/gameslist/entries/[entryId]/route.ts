// app/api/gameslist/entries/[entryId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

interface RouteParams {
  params: {
    entryId: string
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

    // Find the game entry and verify ownership in one query
    const gameEntry = await prisma.gameEntry.findFirst({
      where: {
        id: entryId,
        gameList: {
          userId: authenticatedUser.id,
        },
      },
      include: {
        gameList: {
          select: {
            type: true,
            userId: true,
            user: {
              select: {
                username: true,
              },
            },
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
      gameListType: gameEntry.gameList.type,
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
        message: `Successfully deleted "${
          deletedEntryInfo.title
        }" from your ${deletedEntryInfo.gameListType
          .toLowerCase()
          .replace("_", " ")} list`,
        deletedEntry: deletedEntryInfo,
        user: {
          username: gameEntry.gameList.user.username,
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

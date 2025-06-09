import { NextRequest, NextResponse } from "next/server"
import type { RAWGSearchResponse } from "@/types/game"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { deepCopy } from "@/lib/utils"

const RAWG_BASE_URL = "https://api.rawg.io/api"
const RAWG_API_KEY = process.env.RAWG_API_KEY

if (!RAWG_API_KEY) {
  console.warn("RAWG_API_KEY environment variable is not set")
}

async function getUserGameEntries(userId: string, rawgGameIds: number[]) {
  const gameEntries = await prisma.gameEntry.findMany({
    where: {
      userId: userId,
      rawgGameId: {
        in: rawgGameIds,
      },
    },
    select: {
      rawgGameId: true,
      status: true,
    },
  })

  // Convert to Map for efficient lookup
  const entriesMap = new Map()
  gameEntries.forEach((entry) => {
    entriesMap.set(entry.rawgGameId, entry)
  })

  return entriesMap
}

async function augmentSearchResults(
  data: RAWGSearchResponse
): Promise<RAWGSearchResponse | null> {
  try {
    // If no results, return null
    if (!data || !data.results || data.results.length === 0) {
      return null
    }
    // If no user session, return null
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }
    const userId = session.user.id
    const rawgGameIds = data.results.map((game) => game.id)
    const userGameEntries = await getUserGameEntries(userId, rawgGameIds)
    // If no matching user entries, return null
    if (userGameEntries.size === 0) {
      return null
    }
    // Augment each game with user entry status
    const augmentedResults = deepCopy(data)
    augmentedResults.results.forEach((game) => {
      const entry = userGameEntries.get(game.id)
      if (entry) {
        game.status = entry.status // Add status from user's game entry
      }
    })
    return augmentedResults
  } catch (error) {
    // If augmentation fails for any reason, return null
    console.error("Error augmenting search results:", error)
    return null
  }
}
export async function GET(request: NextRequest) {
  // Check if API key is configured
  if (!RAWG_API_KEY) {
    return NextResponse.json(
      {
        error: "Server configuration error",
        message: "RAWG API key not configured",
      },
      { status: 500 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = searchParams.get("page") || "1"
    const pageSize = searchParams.get("page_size") || "20"

    // Validate required query parameter
    if (!query || query.trim() === "") {
      return NextResponse.json(
        {
          error: "Search query is required",
          message: 'Please provide a search term using the "q" parameter',
        },
        { status: 400 }
      )
    }

    // Build the RAWG API URL
    const url = new URL(`${RAWG_BASE_URL}/games`)
    url.searchParams.append("key", RAWG_API_KEY)
    url.searchParams.append("search", query.trim())
    url.searchParams.append("page", page)
    url.searchParams.append("page_size", pageSize)
    url.searchParams.append("ordering", "-rating") // Order by rating (highest first)

    // Make request to RAWG API
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NextJS-App",
      },
    })

    if (!response.ok) {
      throw new Error(`RAWG API responded with status: ${response.status}`)
    }

    const data: RAWGSearchResponse = await response.json()

    // Augment the results with user's game entries if needed
    const enrichedResults = await augmentSearchResults(data)

    return NextResponse.json(enrichedResults || data)
  } catch (error) {
    console.error("Error searching games:", error)

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        return NextResponse.json(
          {
            error: "Service temporarily unavailable",
            message: "Unable to connect to game database",
          },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to search games",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    )
  }
}

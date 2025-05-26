import { NextRequest, NextResponse } from "next/server"
import type { RAWGSearchResponse } from "@/types/game"

const RAWG_BASE_URL = "https://api.rawg.io/api"
const RAWG_API_KEY = process.env.RAWG_API_KEY

if (!RAWG_API_KEY) {
  console.warn("RAWG_API_KEY environment variable is not set")
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

    // Return the search results
    return NextResponse.json(data)
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

// app/api/profile/[userName]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { GameListType } from "@/types/enums"

// This would be your actual database queries
// I'm showing the structure you'd need to implement

interface UserProfile {
  username: string
  email?: string
  image?: string
  bio?: string
  joinedAt: string
  stats: UserStats
}

interface UserStats {
  totalGames: number
  totalHours: number
  averageRating: number
  statusCounts: Record<GameListType, number>
  totalRatedGames: number
  memberSince: string
  lastActive: string
  recentUpdates: RecentUpdate[]
}

interface RecentUpdate {
  id: string
  gameTitle: string
  rawgGameId: number
  action: "added" | "updated" | "status_changed"
  oldStatus?: GameListType
  newStatus?: GameListType
  updatedAt: string
  changes?: {
    rating?: { old?: number; new?: number }
    hoursPlayed?: { old?: number; new?: number }
    review?: { old?: string; new?: string }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userName: string }> },
) {
  try {
    const { userName } = await params

    if (!userName) {
      return NextResponse.json(
        { error: { message: "Username is required" } },
        { status: 400 },
      )
    }

    // TODO: Replace with your actual database queries
    // Here's the structure of what you need to query:

    /*
    1. Get user basic info:
    const user = await db.user.findUnique({
      where: { username: userName },
      select: {
        username: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: { message: "User not found" } },
        { status: 404 }
      )
    }

    2. Get game entries with aggregations:
    const gameEntries = await db.gameEntry.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        rawgGameId: true,
        title: true,
        status: true,
        rating: true,
        hoursPlayed: true,
        review: true,
        startedAt: true,
        completedAt: true,
        addedAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    3. Calculate statistics:
    const totalGames = gameEntries.length
    const totalHours = gameEntries.reduce((sum, entry) => sum + (entry.hoursPlayed || 0), 0)
    const ratedGames = gameEntries.filter(entry => entry.rating && entry.rating > 0)
    const averageRating = ratedGames.length > 0 
      ? Math.round((ratedGames.reduce((sum, entry) => sum + (entry.rating || 0), 0) / ratedGames.length) * 10) / 10
      : 0

    const statusCounts = gameEntries.reduce((counts, entry) => {
      counts[entry.status] = (counts[entry.status] || 0) + 1
      return counts
    }, {} as Record<GameListType, number>)

    // Ensure all statuses are represented
    Object.values(GameListType).forEach(status => {
      if (typeof status === 'number' && !statusCounts[status]) {
        statusCounts[status] = 0
      }
    })

    4. Get recent updates (last 3 updates):
    // You might want to store update history in a separate table
    // For now, we can use the most recently updated entries
    const recentUpdates = gameEntries
      .slice(0, 3)
      .map(entry => ({
        id: entry.id,
        gameTitle: entry.title,
        rawgGameId: entry.rawgGameId,
        action: 'updated' as const, // You'd determine this based on your update history
        updatedAt: entry.updatedAt.toISOString(),
        // You'd need to track what specifically changed
        changes: {}
      }))
    */

    // Mock data for demonstration - replace with actual database queries
    const mockProfile: UserProfile = {
      username: userName,
      email: `${userName}@example.com`,
      image: undefined, // Would come from user record
      bio: "Gaming enthusiast and completionist. Love RPGs and indie games!",
      joinedAt: "2023-01-15T00:00:00.000Z",
      stats: {
        totalGames: 150,
        totalHours: 2847,
        averageRating: 7.8,
        statusCounts: {
          [GameListType.PLAYING]: 5,
          [GameListType.COMPLETED]: 89,
          [GameListType.PLAN_TO_PLAY]: 42,
          [GameListType.ON_HOLD]: 8,
          [GameListType.DROPPED]: 6,
        },
        totalRatedGames: 95,
        memberSince: "2023-01-15T00:00:00.000Z",
        lastActive: new Date().toISOString(),
        recentUpdates: [
          {
            id: "1",
            gameTitle: "Baldur's Gate 3",
            rawgGameId: 326243,
            action: "updated",
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            changes: {
              rating: { old: 8, new: 9 },
              hoursPlayed: { old: 120, new: 135 },
            },
          },
          {
            id: "2",
            gameTitle: "Pizza Tower",
            rawgGameId: 404783,
            action: "status_changed",
            oldStatus: GameListType.PLAYING,
            newStatus: GameListType.COMPLETED,
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          },
          {
            id: "3",
            gameTitle: "Hollow Knight: Silksong",
            rawgGameId: 362473,
            action: "added",
            updatedAt: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 3 days ago
          },
        ],
      },
    }

    return NextResponse.json(mockProfile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 },
    )
  }
}

/* 
Database Schema Suggestions for tracking updates:

1. Add an UpdateHistory table:
CREATE TABLE update_history (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  game_entry_id VARCHAR NOT NULL,
  action ENUM('added', 'updated', 'status_changed', 'deleted'),
  old_values JSON,
  new_values JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (game_entry_id) REFERENCES game_entries(id)
);

2. Or add fields to track changes in the game_entries table:
ALTER TABLE game_entries ADD COLUMN previous_status INT;
ALTER TABLE game_entries ADD COLUMN status_changed_at TIMESTAMP;
ALTER TABLE game_entries ADD COLUMN previous_rating DECIMAL(3,1);
ALTER TABLE game_entries ADD COLUMN rating_changed_at TIMESTAMP;

3. For the user profile, you might want:
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN last_active TIMESTAMP;

Sample queries you'd use:

-- Get user with basic stats
SELECT 
  u.*,
  COUNT(ge.id) as total_games,
  COALESCE(SUM(ge.hours_played), 0) as total_hours,
  ROUND(AVG(CASE WHEN ge.rating > 0 THEN ge.rating END), 1) as average_rating,
  COUNT(CASE WHEN ge.rating > 0 THEN 1 END) as total_rated_games
FROM users u
LEFT JOIN game_entries ge ON u.id = ge.user_id
WHERE u.username = ?
GROUP BY u.id;

-- Get status counts
SELECT 
  status,
  COUNT(*) as count
FROM game_entries 
WHERE user_id = ?
GROUP BY status;

-- Get recent updates (if using update_history table)
SELECT 
  uh.*,
  ge.title as game_title,
  ge.rawg_game_id
FROM update_history uh
JOIN game_entries ge ON uh.game_entry_id = ge.id
WHERE uh.user_id = ?
ORDER BY uh.created_at DESC
LIMIT 3;
*/

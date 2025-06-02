// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Export test user data for use in tests
export const TEST_USER = {
  username: "testuser",
  email: "test@example.com",
  password: "password123", // Plain text password for tests
} as const

async function seedTestUser() {
  // Clear existing data (be careful with this in production!)
  console.log("🧹 Cleaning existing user data from session, account, user...")
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Hash password for test user
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 12)

  // Create single test user
  console.log("👤 Creating test user...")

  const testUser = await prisma.user.create({
    data: {
      username: TEST_USER.username,
      email: TEST_USER.email,
      password: hashedPassword,
      emailVerified: new Date(),
    },
  })

  console.log("📊 Created user:")
  console.log(`   • ${testUser.email} (password: ${TEST_USER.password})`)

  return testUser
}

async function seedGameData(userId: string) {
  console.log("🎮 Creating game lists and entries...")

  // Clear existing game data for this user
  await prisma.gameEntry.deleteMany({
    where: {
      gameList: {
        userId: userId,
      },
    },
  })
  await prisma.gameList.deleteMany({
    where: { userId: userId },
  })

  // Create GameLists for each type
  const gameListTypes = [
    "PLAYING",
    "PLAN_TO_PLAY",
    "COMPLETED",
    "ON_HOLD",
    "DROPPED",
  ] as const
  const createdGameLists: Record<string, any> = {}

  // Create all game lists
  for (const listType of gameListTypes) {
    const gameList = await prisma.gameList.create({
      data: {
        userId: userId,
        type: listType,
      },
    })
    createdGameLists[listType] = gameList
    console.log(`   • GameList created: ${listType}`)
  }

  // Define the game entry type with title
  interface GameEntryData {
    rawgGameId: number
    title: string
    rating?: number | null
    review?: string | null
    hoursPlayed?: number
    startedAt?: Date
    completedAt?: Date
  }

  // Sample game entries with popular games from RAWG API
  // Note: These are real RAWG game IDs for popular games
  const gameEntriesData = [
    // Currently Playing
    {
      listType: "PLAYING",
      games: [
        {
          rawgGameId: 3498,
          title: "Grand Theft Auto V",
          rating: 9,
          review:
            "Amazing open world experience, still discovering new things after 50+ hours!",
          hoursPlayed: 87,
          startedAt: new Date("2024-12-01"),
        },
        {
          rawgGameId: 4200,
          title: "Portal 2",
          rating: null,
          review: null,
          hoursPlayed: 12,
          startedAt: new Date("2025-01-15"),
        },
        {
          rawgGameId: 5286,
          title: "Tomb Raider (2013)",
          rating: null,
          review: null,
          hoursPlayed: 8,
          startedAt: new Date("2025-01-20"),
        },
      ] as GameEntryData[],
    },
    // Plan to Play
    {
      listType: "PLAN_TO_PLAY",
      games: [
        {
          rawgGameId: 3328,
          title: "The Witcher 3: Wild Hunt",
          rating: null,
          review: null,
          hoursPlayed: 0,
        },
        {
          rawgGameId: 4291,
          title: "Counter-Strike: Global Offensive",
          rating: null,
          review: null,
          hoursPlayed: 0,
        },
        {
          rawgGameId: 13536,
          title: "Portal",
          rating: null,
          review: null,
          hoursPlayed: 0,
        },
        {
          rawgGameId: 5679,
          title: "The Elder Scrolls V: Skyrim",
          rating: null,
          review: null,
          hoursPlayed: 0,
        },
        {
          rawgGameId: 11859,
          title: "Team Fortress 2",
          rating: null,
          review: null,
          hoursPlayed: 0,
        },
      ] as GameEntryData[],
    },
    // Completed
    {
      listType: "COMPLETED",
      games: [
        {
          rawgGameId: 1030,
          title: "Limbo",
          rating: 8,
          review:
            "Atmospheric puzzle platformer with haunting visuals. Short but memorable experience.",
          hoursPlayed: 4,
          startedAt: new Date("2024-10-01"),
          completedAt: new Date("2024-10-02"),
        },
        {
          rawgGameId: 4062,
          title: "BioShock Infinite",
          rating: 9,
          review:
            "Mind-bending story with beautiful art direction. Combat was decent but the narrative was exceptional.",
          hoursPlayed: 22,
          startedAt: new Date("2024-09-15"),
          completedAt: new Date("2024-09-28"),
        },
        {
          rawgGameId: 3939,
          title: "PAYDAY 2",
          rating: 7,
          review: "Fun heist gameplay with friends, but gets repetitive solo.",
          hoursPlayed: 45,
          startedAt: new Date("2024-08-01"),
          completedAt: new Date("2024-08-30"),
        },
      ] as GameEntryData[],
    },
    // On Hold
    {
      listType: "ON_HOLD",
      games: [
        {
          rawgGameId: 3070,
          title: "Fallout 4",
          rating: null,
          review:
            "Got overwhelmed by the settlement building system. Will return when I have more time.",
          hoursPlayed: 25,
          startedAt: new Date("2024-11-01"),
        },
        {
          rawgGameId: 28,
          title: "Red Dead Redemption 2",
          rating: null,
          review:
            "Beautiful game but very slow paced. Taking a break but will definitely finish it.",
          hoursPlayed: 35,
          startedAt: new Date("2024-10-15"),
        },
      ] as GameEntryData[],
    },
    // Dropped
    {
      listType: "DROPPED",
      games: [
        {
          rawgGameId: 58175,
          title: "God of War",
          rating: 6,
          review:
            "Great visuals and story but the combat felt repetitive. Not for me.",
          hoursPlayed: 8,
          startedAt: new Date("2024-09-01"),
        },
        {
          rawgGameId: 3272,
          title: "Rocket League",
          rating: 5,
          review:
            "Too competitive for my taste. Prefer single player experiences.",
          hoursPlayed: 12,
          startedAt: new Date("2024-08-15"),
        },
      ] as GameEntryData[],
    },
  ]

  // Create game entries
  let totalEntries = 0
  for (const listData of gameEntriesData) {
    const gameList = createdGameLists[listData.listType]

    for (const gameData of listData.games) {
      await prisma.gameEntry.create({
        data: {
          gameListId: gameList.id,
          rawgGameId: gameData.rawgGameId,
          title: gameData.title,
          rating: gameData.rating,
          review: gameData.review,
          hoursPlayed: gameData.hoursPlayed,
          startedAt: gameData.startedAt ?? null,
          completedAt: gameData.completedAt ?? null,
        },
      })
      totalEntries++
    }
  }

  // Display summary
  const summary = await prisma.gameList.findMany({
    where: { userId: userId },
    include: {
      _count: {
        select: { gameEntries: true },
      },
    },
  })

  console.log("📊 Game data summary:")
  summary.forEach((list) => {
    console.log(`   • ${list.type}: ${list._count.gameEntries} games`)
  })
  console.log(`   • Total entries: ${totalEntries}`)
}

async function main() {
  console.log("🌱 Starting database seed...")

  const testUser = await seedTestUser()
  await seedGameData(testUser.id)

  console.log("✅ Database seeded successfully!")
}

// Only run the seed function if this file is executed directly
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error("❌ Seed failed:", e)
      await prisma.$disconnect()
      process.exit(1)
    })
}

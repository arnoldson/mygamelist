// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Export test user data for use in tests
export const TEST_USER = {
  name: "Test User",
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
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: hashedPassword,
      emailVerified: new Date(),
    },
  })

  console.log("📊 Created user:")
  console.log(`   • ${testUser.email} (password: ${TEST_USER.password})`)
}

async function main() {
  console.log("🌱 Starting database seed...")

  await seedTestUser()
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

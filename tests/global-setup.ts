// global-setup.ts

import { FullConfig } from "@playwright/test"
import { exec } from "child_process"
import { promisify } from "util"
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"

const execAsync = promisify(exec)

async function globalSetup(config: FullConfig) {
  console.log("Starting test database setup...")

  // 1. Get the root directory path
  const rootDir = process.cwd()

  // 2. Load environment variables from .env.test
  console.log("Loading environment variables from .env.test...")
  const envTestPath = path.join(rootDir, ".env.test")
  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath })
    console.log("Environment variables loaded successfully")
  } else {
    console.error(".env.test file not found at:", envTestPath)
    throw new Error(".env.test file not found")
  }

  // 3. Start the test database using docker-compose.test.yml
  console.log("Starting test database container...")
  try {
    await execAsync("docker-compose -f docker-compose.test.yml up -d", {
      cwd: rootDir,
    })
    console.log("Test database container started successfully")
  } catch (error) {
    console.error("Failed to start test database container:", error)
    throw error
  }

  // 4. Run Prisma DB push to sync the schema
  console.log("Syncing database schema with Prisma...")
  try {
    // Give the database a moment to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 3000))

    await execAsync("npx prisma db push", { cwd: rootDir })
    console.log("Database schema synced successfully")
  } catch (error) {
    console.error("Failed to sync database schema:", error)
    throw error
  }

  console.log("Global setup completed successfully")
}

export default globalSetup

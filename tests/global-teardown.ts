import { FullConfig } from "@playwright/test"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

async function globalTeardown(config: FullConfig) {
  console.log("Starting test environment cleanup...")

  // Stop and remove the test containers
  try {
    await execAsync("docker-compose -f docker-compose.test.yml down")
    console.log("Test containers stopped successfully")
  } catch (error) {
    console.error("Failed to stop test containers:", error)
  }
}

export default globalTeardown

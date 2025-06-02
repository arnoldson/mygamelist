import { test, expect } from "@playwright/test"

test("should valid gameslist json for testuser", async ({ request }) => {
  // Make API request
  const response = await request.get("/api/gameslist/testuser")

  // Check response status
  expect(response.status()).toBe(200)

  // Parse response data
  const data = await response.json()

  // Verify basic response structure
  expect(data).toHaveProperty("user")
  expect(data).toHaveProperty("gameLists")
})

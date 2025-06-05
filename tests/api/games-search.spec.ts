import { test, expect } from "@playwright/test"

test('should return games when searching for "zelda"', async ({ request }) => {
  // Make API request
  const response = await request.get("/api/games/search?q=zelda")

  // Check response status
  expect(response.status()).toBe(200)

  // Parse response data
  const data = await response.json()

  // Verify basic RAWG API response structure
  expect(data).toHaveProperty("count")
  expect(data).toHaveProperty("results")
  expect(Array.isArray(data.results)).toBe(true)
  expect(data.results.length).toBeGreaterThan(0)

  // Verify first game has expected properties
  const firstGame = data.results[0]
  expect(firstGame).toHaveProperty("id")
  expect(firstGame).toHaveProperty("name")
  expect(firstGame).toHaveProperty("rating")
  expect(typeof firstGame.name).toBe("string")
  expect(typeof firstGame.id).toBe("number")
})

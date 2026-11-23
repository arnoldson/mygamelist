import { test, expect } from "@playwright/test"
import { MOCK_SEARCH_RESPONSE } from "./fixtures/rawgSearchResponse"
import { TEST_USER } from "../prisma/seed"

test('should search for "zelda" and display valid GameCards', async ({
  page,
}) => {
  // Intercept the RAWG search call with a fixed fixture instead of hitting
  // the real API. This test verifies our own UI renders search results
  // correctly, not RAWG's uptime or response latency.
  await page.route("**/api/games/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SEARCH_RESPONSE),
    }),
  )

  // Navigate to the games search page
  await page.goto("/games/search")

  // Verify the page loaded correctly
  await expect(page.locator("h1")).toContainText("Game Search")

  // Find the search input and enter "zelda"
  const searchInput = page.locator('input[placeholder="Search for games..."]')
  await searchInput.fill("zelda")

  // Click the search button
  await page.locator('button[type="submit"]').click()

  // Wait for search results to load
  await expect(page.locator("text=Found")).toBeVisible()

  // Check that at least one game card is displayed
  const gameCards = page.locator('[data-testid="game-card"]')
  await expect(gameCards.first()).toBeVisible()

  // Validate the first game card has expected content
  const firstCard = gameCards.first()

  // Check that the card has a game title
  await expect(firstCard.locator("h3")).toBeVisible()
  const gameTitle = await firstCard.locator("h3").textContent()
  expect(gameTitle).toBeTruthy()
  expect(gameTitle?.toLowerCase()).toContain("zelda")

  // Check that the card has a rating
  await expect(firstCard.locator('[data-testid="rating"]')).toBeVisible()

  // Check that the card has a release date
  await expect(firstCard.locator('[data-testid="release-date"]')).toBeVisible()

  // Check that the card has either an image or a fallback icon
  const hasImage = await firstCard.locator("img").isVisible()
  const hasFallbackIcon = await firstCard
    .locator("svg.lucide-gamepad")
    .isVisible()
  expect(hasImage || hasFallbackIcon).toBe(true)

  // Check that genres are displayed
  await expect(firstCard.locator('[data-testid="genres"]')).toBeVisible()

  // Verify hover effect works
  await firstCard.hover()

  console.log(`✅ Found Zelda game: "${gameTitle}"`)
})

test("should recognize a fresh login after client-side navigation to search", async ({
  page,
}) => {
  // Regression: logging in via the server action soft-redirects, and
  // SessionProvider used to keep the null session cached from /login, so the
  // search page showed "Sign in" prompts until a manual refresh.
  await page.route("**/api/games/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SEARCH_RESPONSE),
    }),
  )

  await page.goto("/login")
  await page.fill('input[name="email"]', TEST_USER.email)
  await page.fill('input[name="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 10000 })

  // Marker that only survives if no full page load happens from here on,
  // so the test can't pass by accidentally reloading the page.
  await page.evaluate(() => {
    ;(window as Window & { __noReload?: boolean }).__noReload = true
  })

  await page.locator('nav a[href="/games/search"]').click()
  await page.waitForURL("**/games/search")
  await expect(page.locator("h1")).toContainText("Game Search")

  await page.locator('input[placeholder="Search for games..."]').fill("zelda")
  await page.locator('button[type="submit"]').click()
  await expect(page.locator("text=Found")).toBeVisible()

  const firstCard = page.locator('[data-testid="game-card"]').first()
  await expect(firstCard.getByTitle("Add to your list")).toBeAttached()
  await expect(firstCard.getByTitle("Sign in to add to list")).toHaveCount(0)
  await expect(page.getByText("to add games to your library")).toHaveCount(0)

  expect(
    await page.evaluate(
      () => (window as Window & { __noReload?: boolean }).__noReload,
    ),
  ).toBe(true)
})

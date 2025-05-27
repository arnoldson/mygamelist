import { test, expect } from "@playwright/test"

test('should search for "zelda" and display valid GameCards', async ({
  page,
}) => {
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
  await expect(page.locator("text=Found")).toBeVisible({ timeout: 10000 })

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
    .locator('[data-lucide="gamepad"]')
    .isVisible()
  expect(hasImage || hasFallbackIcon).toBe(true)

  // Check that genres are displayed
  await expect(firstCard.locator('[data-testid="genres"]')).toBeVisible()

  // Verify hover effect works
  await firstCard.hover()

  console.log(`✅ Found Zelda game: "${gameTitle}"`)
})
